import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { db } from '../services/firebase';
import { doc, deleteDoc, collection, addDoc, updateDoc, Timestamp, query, orderBy, getDocs } from 'firebase/firestore';
import type { Player, Match, NewsArticle, TrainingSession, UserDocument, AdminItem } from '../types';
import { UsersIcon, CalendarIcon, NewsIcon, TrainingIcon, UsersAdminIcon, AddIcon } from '../constants';


type AdminTab = 'players' | 'matches' | 'news' | 'training' | 'users';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('players');
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [users, setUsers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<AdminItem | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const playersQuery = query(collection(db, 'players'), orderBy('number'));
            const playersSnap = await getDocs(playersQuery);
            setPlayers(playersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Player) })));

            const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
            const matchesSnap = await getDocs(matchesQuery);
            setMatches(matchesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Match) })));

            const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
            const newsSnap = await getDocs(newsQuery);
            setNews(newsSnap.docs.map(d => ({ id: d.id, ...(d.data() as NewsArticle) })));

            const trainingQuery = query(collection(db, 'training'), orderBy('date', 'desc'));
            const trainingSnap = await getDocs(trainingQuery);
            setTrainingSessions(trainingSnap.docs.map(d => ({ id: d.id, ...(d.data() as TrainingSession) })));

            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);
            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<UserDocument, 'id'>) })));
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item: any = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentItem(null);
        setIsModalOpen(false);
    };
    
    const handleDelete = async (collectionName: AdminTab, id: string | undefined) => {
        if (!id) {
            console.error("Delete failed: item ID is missing.");
            alert("An error occurred: item ID is missing.");
            return;
        }

        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            setDeletingId(id);
            try {
                await deleteDoc(doc(db, collectionName, id));
                // No need for success alert, UI refresh is enough feedback
                fetchData(); 
            } catch (error) {
                console.error("Error deleting document:", error);
                alert("Failed to delete the item. You may not have the required permissions. See console for details.");
            } finally {
                setDeletingId(null);
            }
        }
    };
    
    const upcomingMatchesCount = useMemo(() => matches.filter(m => !m.isPast).length, [matches]);

    const renderContent = () => {
        switch (activeTab) {
            case 'players':
                return <AdminTable loading={loading} data={players} columns={['number', 'name', 'position']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('players', item.id)} deletingId={deletingId} />;
            case 'matches':
                return <AdminTable loading={loading} data={matches.map(m => ({ ...m, date: m.date.toDate().toLocaleDateString(), isPast: m.isPast ? 'Yes' : 'No' }))} columns={['date', 'opponent', 'venue', 'isPast']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('matches', item.id)} deletingId={deletingId} />;
            case 'news':
                 return <AdminTable loading={loading} data={news.map(n => ({ ...n, date: n.date.toDate().toLocaleDateString() }))} columns={['date', 'title']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('news', item.id)} deletingId={deletingId} />;
            case 'training':
                 return <AdminTable loading={loading} data={trainingSessions.map(t => ({...t, date: t.date.toDate().toLocaleString()}))} columns={['date', 'focus', 'location']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('training', item.id)} deletingId={deletingId} />;
            case 'users':
                return <AdminTable loading={loading} data={users.map(u => ({...u, isAdmin: u.isAdmin ? 'Yes' : 'No', isPlayer: u.isPlayer ? 'Yes' : 'No' }))} columns={['email', 'isAdmin', 'isPlayer']} onEdit={handleOpenModal} onDelete={() => alert("For security, user deletion must be done from the Firebase Console.")} deletingId={deletingId} />;
            default: return null;
        }
    };
    
    const modalTitle = useMemo(() => {
        const action = currentItem ? 'Edit' : 'Add';
        const model = activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1);
        return `${action} ${model}`;
    }, [currentItem, activeTab]);

    const addNewButtonText = useMemo(() => {
        return `Add New ${activeTab.slice(0, -1)}`
    }, [activeTab]);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={UsersIcon} title="Total Players" value={players.length} color="bg-blue-500" />
                <StatCard icon={CalendarIcon} title="Upcoming Matches" value={upcomingMatchesCount} color="bg-green-500" />
                <StatCard icon={NewsIcon} title="News Articles" value={news.length} color="bg-yellow-500" />
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 gap-4">
                    <nav className="flex flex-wrap" aria-label="Tabs">
                        <TabButton name="players" activeTab={activeTab} setActiveTab={setActiveTab} icon={UsersIcon}>Players</TabButton>
                        <TabButton name="matches" activeTab={activeTab} setActiveTab={setActiveTab} icon={CalendarIcon}>Matches</TabButton>
                        <TabButton name="news" activeTab={activeTab} setActiveTab={setActiveTab} icon={NewsIcon}>News</TabButton>
                        <TabButton name="training" activeTab={activeTab} setActiveTab={setActiveTab} icon={TrainingIcon}>Training</TabButton>
                        <TabButton name="users" activeTab={activeTab} setActiveTab={setActiveTab} icon={UsersAdminIcon}>Users</TabButton>
                    </nav>
                    <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary-focus transition-colors">
                        <AddIcon className="w-5 h-5" />
                        {addNewButtonText}
                    </button>
                </div>
                <div className="mt-2">
                    {renderContent()}
                </div>
            </Card>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalTitle}>
                <AdminForm activeTab={activeTab} item={currentItem} onSave={fetchData} closeModal={handleCloseModal}/>
            </Modal>
        </div>
    );
};

// --- Local Sub Components ---
const SpinnerIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-gray-500 animate-spin' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SkeletonRow: React.FC<{ columns: number }> = ({ columns }) => (
    <tr className="animate-pulse">
        {[...Array(columns)].map((_, i) => (
            <td key={i} className="p-4"><div className="h-4 bg-gray-200 dark:bg-dark-base-300 rounded"></div></td>
        ))}
        <td className="p-4"><div className="flex justify-end gap-4"><div className="h-5 w-5 bg-gray-200 dark:bg-dark-base-300 rounded"></div><div className="h-5 w-5 bg-gray-200 dark:bg-dark-base-300 rounded"></div></div></td>
    </tr>
);

const StatCard: React.FC<{icon: React.ComponentType<{className?:string}>, title: string, value: string | number, color: string}> = ({icon: Icon, title, value, color}) => (
    <div className="bg-white dark:bg-dark-base-100 p-6 rounded-2xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className={`p-4 rounded-full ${color} mr-4`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-md font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{name: AdminTab, activeTab: AdminTab, setActiveTab: (tab: AdminTab) => void, children: React.ReactNode, icon: React.ComponentType<{className?: string}>}> = ({name, activeTab, setActiveTab, children, icon: Icon}) => (
    <button onClick={() => setActiveTab(name)} className={`flex items-center gap-2 whitespace-nowrap py-3 px-5 font-semibold text-sm rounded-t-lg transition-colors focus:outline-none ${activeTab === name ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-base-200'}`}>
        <Icon className="w-5 h-5"/> {children}
    </button>
);

const AdminTable: React.FC<{data: any[], columns: string[], onEdit: (item: any) => void, onDelete: (item: any) => void, loading: boolean, deletingId: string | null}> = ({ data, columns, onEdit, onDelete, loading, deletingId }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-dark-base-200 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <tr>
                    {columns.map(col => <th key={col} className="p-4 font-semibold">{col.replace(/([A-Z])/g, ' $1')}</th>)}
                    <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} columns={columns.length} />)
                ) : data.length === 0 ? (
                    <tr><td colSpan={columns.length + 1} className="text-center p-8 text-gray-500">No data found for this category.</td></tr>
                ) : (
                    data.map(item => (
                        <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-base-200 transition-colors">
                            {columns.map(col => <td key={`${item.id}-${col}`} className="p-4 align-middle text-sm">{item[col]}</td>)}
                            <td className="p-4 text-right align-middle">
                                <div className="flex justify-end items-center gap-4">
                                    <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" aria-label={`Edit ${item.name || item.title || item.email}`}><EditIcon /></button>
                                    <button
                                        onClick={() => onDelete(item)}
                                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={`Delete ${item.name || item.title || item.email}`}
                                        disabled={deletingId === item.id}
                                    >
                                        {deletingId === item.id ? <SpinnerIcon /> : <DeleteIcon />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const AdminForm: React.FC<{activeTab: AdminTab, item: any, onSave: () => void, closeModal: () => void}> = ({ activeTab, item, onSave, closeModal }) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const playerDefaults = { name: '', position: 'Forward', number: 0, imageUrl: '', joinDate: new Date().toISOString().split('T')[0], stats: { season: { appearances: 0, goals: 0, assists: 0 }, allTime: { appearances: 0, goals: 0, assists: 0 } } };
        const matchDefaults = { opponent: '', venue: 'Home', date: new Date().toISOString().substring(0, 16), isPast: false, score: { home: 0, away: 0 }};
        const newsDefaults = { title: '', summary: '', imageUrl: '', date: new Date().toISOString().substring(0, 16) };
        const trainingDefaults = { focus: '', location: '', date: new Date().toISOString().substring(0, 16) };
        const userDefaults = { email: '', isAdmin: false, isPlayer: true };
        
        // Fix: Refactor logic to correctly type `initialData` based on `activeTab`.
        // The original implementation created a union type for `initialData` that TypeScript
        // could not narrow, causing errors when accessing tab-specific properties like 'stats' or 'score'.
        // This `switch` statement ensures `initialData` has a well-defined type in each case.
        let initialData;
        switch (activeTab) {
            case 'players':
                initialData = { ...playerDefaults, ...(item || {}) };
                if (item) {
                    initialData.stats = { season: { ...playerDefaults.stats.season, ...item.stats?.season }, allTime: { ...playerDefaults.stats.allTime, ...item.stats?.allTime } };
                }
                break;
            case 'matches':
                initialData = { ...matchDefaults, ...(item || {}) };
                if (item) {
                    initialData.score = { ...matchDefaults.score, ...item.score };
                }
                break;
            case 'news':
                initialData = { ...newsDefaults, ...(item || {}) };
                break;
            case 'training':
                initialData = { ...trainingDefaults, ...(item || {}) };
                break;
            case 'users':
                initialData = { ...userDefaults, ...(item || {}) };
                break;
        }
        setFormData(initialData);
    }, [item, activeTab]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const [main, sub, nested] = name.split('.');
        
        if (nested) {
            setFormData(prev => ({ ...prev, [main]: { ...prev[main], [sub]: { ...prev[main][sub], [nested]: type === 'number' ? Number(value) : value } }}));
        } else if (sub) {
            setFormData(prev => ({ ...prev, [main]: { ...prev[main], [sub]: type === 'number' ? Number(value) : value } }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value}));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const collectionName = activeTab;
        
        let dataToSave = { ...formData };
        if (dataToSave.date && typeof dataToSave.date === 'string') {
            dataToSave.date = Timestamp.fromDate(new Date(dataToSave.date));
        }
        if (dataToSave.joinDate && typeof dataToSave.joinDate === 'string') {
            dataToSave.joinDate = Timestamp.fromDate(new Date(dataToSave.joinDate));
        }
        
        const { id, ...updateData } = dataToSave;

        try {
            if (item) {
                const docRef = doc(db, collectionName, item.id);
                await updateDoc(docRef, updateData);
            } else {
                const collectionRef = collection(db, collectionName);
                await addDoc(collectionRef, updateData);
            }
            onSave();
            closeModal();
        } catch (error) {
            console.error("Error saving data:", error);
            alert("There was an error saving the data. Please check the console for more details.");
        }
    };

    const commonClasses = "mt-1 block w-full rounded-md bg-gray-100 dark:bg-dark-base-300 border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50";
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
            {activeTab === 'players' && <>
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <legend className="text-lg font-semibold col-span-full mb-2 border-b dark:border-gray-700 pb-1">Player Information</legend>
                    <div><label className="text-sm font-medium">Name <input name="name" value={formData['name'] || ''} onChange={handleChange} className={commonClasses} required /></label></div>
                    <div><label className="text-sm font-medium">Number <input name="number" type="number" value={formData['number'] || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    <div className="col-span-full"><label className="text-sm font-medium">Position <select name="position" value={formData['position'] || 'Forward'} onChange={handleChange} className={commonClasses}>
                        <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
                    </select></label></div>
                    <div className="col-span-full"><label className="text-sm font-medium">Image URL <input name="imageUrl" value={formData['imageUrl'] || ''} onChange={handleChange} className={commonClasses} /></label></div>
                    <div className="col-span-full"><label className="text-sm font-medium">Join Date <input name="joinDate" type="date" value={(formData['joinDate']?.toDate ? formData.joinDate.toDate() : new Date(formData.joinDate || Date.now())).toISOString().split('T')[0]} onChange={handleChange} className={commonClasses} /></label></div>
                </fieldset>
                 <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <legend className="text-lg font-semibold col-span-full mb-2 border-b dark:border-gray-700 pb-1">Season Stats</legend>
                    <div><label className="text-sm font-medium">Apps <input name="stats.season.appearances" type="number" value={formData.stats?.season.appearances || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    <div><label className="text-sm font-medium">Goals <input name="stats.season.goals" type="number" value={formData.stats?.season.goals || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    <div><label className="text-sm font-medium">Assists <input name="stats.season.assists" type="number" value={formData.stats?.season.assists || 0} onChange={handleChange} className={commonClasses} /></label></div>
                </fieldset>
                 <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <legend className="text-lg font-semibold col-span-full mb-2 border-b dark:border-gray-700 pb-1">All-Time Stats</legend>
                    <div><label className="text-sm font-medium">Apps <input name="stats.allTime.appearances" type="number" value={formData.stats?.allTime.appearances || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    <div><label className="text-sm font-medium">Goals <input name="stats.allTime.goals" type="number" value={formData.stats?.allTime.goals || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    <div><label className="text-sm font-medium">Assists <input name="stats.allTime.assists" type="number" value={formData.stats?.allTime.assists || 0} onChange={handleChange} className={commonClasses} /></label></div>
                </fieldset>
            </>}
            {activeTab === 'matches' && <>
                 <label className="text-sm font-medium">Opponent <input name="opponent" value={formData['opponent'] || ''} onChange={handleChange} className={commonClasses} required /></label>
                 <label className="text-sm font-medium">Date <input name="date" type="datetime-local" value={formData['date'] ? new Date(formData.date?.toDate ? formData.date.toDate() : formData.date).toISOString().substring(0, 16) : ''} onChange={handleChange} className={commonClasses} required /></label>
                 <label className="text-sm font-medium">Venue <select name="venue" value={formData['venue'] || 'Home'} onChange={handleChange} className={commonClasses}><option>Home</option><option>Away</option></select></label>
                 <label className="flex items-center space-x-2 pt-2 text-sm font-medium"><input name="isPast" type="checkbox" checked={formData['isPast'] || false} onChange={handleChange} className="rounded" /> <span>Match is in the past</span></label>
                 {formData['isPast'] && <>
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <legend className="text-lg font-semibold col-span-full mb-2 border-b dark:border-gray-700 pb-1">Final Score</legend>
                        <div><label className="text-sm font-medium">Home <input name="score.home" type="number" value={formData.score?.home || 0} onChange={handleChange} className={commonClasses} /></label></div>
                        <div><label className="text-sm font-medium">Away <input name="score.away" type="number" value={formData.score?.away || 0} onChange={handleChange} className={commonClasses} /></label></div>
                    </fieldset>
                 </>}
            </>}
            {activeTab === 'news' && <>
                <label className="text-sm font-medium">Title <input name="title" value={formData['title'] || ''} onChange={handleChange} className={commonClasses} required /></label>
                <label className="text-sm font-medium">Summary <textarea name="summary" value={formData['summary'] || ''} onChange={handleChange} className={commonClasses} rows={4}></textarea></label>
                <label className="text-sm font-medium">Image URL <input name="imageUrl" value={formData['imageUrl'] || ''} onChange={handleChange} className={commonClasses} /></label>
                 <label className="text-sm font-medium">Date <input name="date" type="datetime-local" value={formData['date'] ? new Date(formData.date?.toDate ? formData.date.toDate() : formData.date).toISOString().substring(0, 16) : ''} onChange={handleChange} className={commonClasses} required /></label>
            </>}
            {activeTab === 'training' && <>
                <label className="text-sm font-medium">Focus <input name="focus" value={formData['focus'] || ''} onChange={handleChange} className={commonClasses} required /></label>
                <label className="text-sm font-medium">Location <input name="location" value={formData['location'] || ''} onChange={handleChange} className={commonClasses} /></label>
                <label className="text-sm font-medium">Date <input name="date" type="datetime-local" value={formData['date'] ? new Date(formData.date?.toDate ? formData.date.toDate() : formData.date).toISOString().substring(0, 16) : ''} onChange={handleChange} className={commonClasses} required /></label>
            </>}
            {activeTab === 'users' && <>
                {!item && (
                     <div className="p-4 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                        <p className="font-bold">Important Notice:</p>
                        <p className="text-sm">This creates a user profile in the app. For the user to log in, you must also create an account for them in the <strong className="font-semibold">Firebase Authentication Console</strong> using the same email.</p>
                    </div>
                )}
                <label className="text-sm font-medium">Email <input name="email" type="email" value={formData['email'] || ''} onChange={handleChange} disabled={!!item} className={`${commonClasses} ${!!item ? 'bg-gray-200 dark:bg-dark-base-200 cursor-not-allowed' : ''}`} required /></label>
                <div className="flex flex-col gap-2 pt-2">
                    <label className="flex items-center space-x-2 text-sm font-medium">
                        <input name="isAdmin" type="checkbox" checked={formData['isAdmin'] || false} onChange={handleChange} className="rounded" /> 
                        <span>Set as Admin</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm font-medium">
                        <input name="isPlayer" type="checkbox" checked={formData['isPlayer'] || false} onChange={handleChange} className="rounded" /> 
                        <span>Set as Player</span>
                    </label>
                </div>
            </>}
            <button type="submit" className="w-full mt-6 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75 transition-colors">Save Changes</button>
        </form>
    );
}

export default AdminPage;