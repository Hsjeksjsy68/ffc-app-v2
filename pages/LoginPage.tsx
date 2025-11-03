import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../services/firebase';
import { useAuthContext } from '../hooks/useAuth';
import Card from '../components/Card';
import type { Player } from '../types';


const PlayerDashboard: React.FC<{ user: NonNullable<ReturnType<typeof useAuthContext>['user']> }> = ({ user }) => {
    const [playerData, setPlayerData] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerData = async () => {
            if (user) {
                // In a real app with user profiles linked to auth, you'd use user.uid.
                // Here we'll just show a generic dashboard as we don't have a direct link.
                setPlayerData({ id: user.uid, name: user.displayName || 'Player', position: 'Forward', number: 99, imageUrl: user.photoURL || '', joinDate: 'N/A', stats: { season: { appearances: 0, goals: 0, assists: 0 }, allTime: { appearances: 0, goals: 0, assists: 0 } }});
                setLoading(false);
            }
        };
        fetchPlayerData();
    }, [user]);

    if (loading) return <div>Loading player data...</div>;
    if (!playerData) return <div>Could not load player data.</div>;

    const imageUrl = playerData.imageUrl || `https://avatar.vercel.sh/${playerData.name}.svg?text=${playerData.name.charAt(0)}`;

    return (
        <Card className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">My Dashboard</h2>
            <div className="flex flex-col md:flex-row gap-6 items-center">
                 <img src={imageUrl} alt={playerData.name} className="w-32 h-32 rounded-full object-cover" />
                 <div>
                     <h3 className="text-2xl font-bold">{playerData.name} (#{playerData.number})</h3>
                     <p className="text-lg">{playerData.position}</p>
                     <p>Email: {user.email}</p>
                 </div>
            </div>
             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div className="bg-gray-100 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold">Season Stats</h4>
                    <p>{playerData.stats.season.goals} G | {playerData.stats.season.assists} A | {playerData.stats.season.appearances} APPS</p>
                </div>
                <div className="bg-gray-100 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold">All-Time Stats</h4>
                    <p>{playerData.stats.allTime.goals} G | {playerData.stats.allTime.assists} A | {playerData.stats.allTime.appearances} APPS</p>
                </div>
            </div>
            <button
                onClick={() => auth.signOut()}
                className="w-full mt-6 py-3 px-4 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
            >
                Log Out
            </button>
        </Card>
    );
};

const LoginPage: React.FC = () => {
    const { user } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);

            if (userCredential.user) {
                // After successful sign-in, check the user's roles.
                const userDocRef = firestore.collection('users').doc(userCredential.user.uid);
                const userDocSnap = await userDocRef.get();
                
                if (userDocSnap.exists) {
                    const userData = userDocSnap.data() as { isAdmin?: boolean, isPlayer?: boolean };
                    if (userData.isAdmin === true) {
                        // If user is an admin, prevent login through this page.
                        await auth.signOut();
                        setError('Admin accounts must use the Admin Login page.');
                    } else if (userData.isPlayer !== true) {
                        // If user is not a player, prevent login.
                        await auth.signOut();
                        setError('This account is not registered as a player.');
                    }
                    // If they are a player, login is successful and the useAuth hook will handle the redirect.
                } else {
                    // User document doesn't exist, so they cannot be a player.
                    await auth.signOut();
                    setError('This account is not registered as a player.');
                }
            }

        } catch (err: any) {
            // Note: 'auth/invalid-credential' is a generic error for incorrect email/password,
            // or if the user does not exist. This is expected behavior on failed login attempts.
            // If you are sure the credentials are correct, check that the Email/Password
            // sign-in provider is enabled in your Firebase project's Authentication settings.
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                 setError('Invalid email or password. Please try again.');
            } else {
                 setError('An unexpected error occurred. Please try again later.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        return <PlayerDashboard user={user} />;
    }

    return (
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6">Player Login</h1>
                <form onSubmit={handleLogin}>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-dark-base-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-dark-base-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;