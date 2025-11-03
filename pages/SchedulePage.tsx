
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import type { Match, TrainingSession } from '../types';
import { firestore } from '../services/firebase';
// Fix: Removed modular imports for Firebase v9.
// import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
    // New, enhanced design for upcoming matches
    if (!match.isPast) {
        const homeTeam = { name: "Flamehunter FC", logo: "https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" };
        const awayTeam = { name: match.opponent, logo: `https://avatar.vercel.sh/${match.opponent}.svg?text=${match.opponent.slice(0, 2).toUpperCase()}` };
        
        const displayTeams = match.venue === 'Home' ? [homeTeam, awayTeam] : [awayTeam, homeTeam];

        return (
            <Card className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-5">
                    <div className="flex justify-around items-center text-center">
                        {/* Team 1 */}
                        <div className="flex flex-col items-center w-1/3">
                            <img src={displayTeams[0].logo} alt={displayTeams[0].name} className="h-16 w-16 mb-2 object-contain" />
                            <h3 className="font-bold text-lg truncate">{displayTeams[0].name}</h3>
                        </div>

                        {/* VS Separator */}
                        <div className="text-2xl font-extrabold text-gray-400 dark:text-gray-500">VS</div>

                        {/* Team 2 */}
                        <div className="flex flex-col items-center w-1/3">
                             <img src={displayTeams[1].logo} alt={displayTeams[1].name} className="h-16 w-16 mb-2 object-contain bg-gray-200 dark:bg-dark-base-300 rounded-full" />
                            <h3 className="font-bold text-lg truncate">{displayTeams[1].name}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-base-200 px-5 py-3 border-t dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {match.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {match.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} @ {match.venue}
                    </p>
                </div>
            </Card>
        );
    }
    
    // Original, simple design for past matches
    return (
        <Card className="mb-4 flex justify-between items-center">
            <div>
                <p className="font-bold text-lg">vs {match.opponent}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{match.date.toDate().toLocaleString()} @ {match.venue}</p>
            </div>
            {match.isPast && match.score && (
                <div className="text-right">
                    <p className="text-xl font-bold">{`${match.score.home} - ${match.score.away}`}</p>
                    <p className={`font-semibold ${match.score.home > match.score.away ? 'text-green-500' : match.score.home < match.score.away ? 'text-red-500' : 'text-yellow-500'}`}>
                        {match.score.home > match.score.away ? 'Win' : match.score.home < match.score.away ? 'Loss' : 'Draw'}
                    </p>
                </div>
            )}
        </Card>
    );
};


const TrainingCard: React.FC<{ session: TrainingSession }> = ({ session }) => (
    <Card className="mb-4">
        <p className="font-bold text-lg">{session.focus}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{session.date.toDate().toLocaleString()}</p>
        <p>Location: {session.location}</p>
    </Card>
);


const SchedulePage: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            try {
                // Fix: Use namespaced collection() and chained query methods for Firebase v8.
                const matchesRef = firestore.collection('matches');
                const matchesQuery = matchesRef.orderBy('date', 'desc');
                const matchesSnap = await matchesQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                setMatches(matchesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Match) })));

                const trainingRef = firestore.collection('training');
                const trainingQuery = trainingRef.orderBy('date', 'asc');
                const trainingSnap = await trainingQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                setTrainingSessions(trainingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as TrainingSession) })));
            } catch (error) {
                console.error("Error fetching schedules:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, []);

    const upcomingMatches = matches.filter(m => !m.isPast).sort((a,b) => a.date.toMillis() - b.date.toMillis());
    const pastMatches = matches.filter(m => m.isPast);

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Schedule & Results</h1>
                <p>Loading schedule...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Schedule & Results</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
                    {upcomingMatches.length > 0 ? upcomingMatches.map(match => <MatchCard key={match.id} match={match} />) : <p>No upcoming matches.</p>}

                    <h2 className="text-2xl font-bold mt-8 mb-4">Training Sessions</h2>
                    {trainingSessions.length > 0 ? trainingSessions.map(session => <TrainingCard key={session.id} session={session} />) : <p>No training sessions scheduled.</p>}
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-4">Past Results</h2>
                    {pastMatches.length > 0 ? pastMatches.map(match => <MatchCard key={match.id} match={match} />) : <p>No past matches.</p>}
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;
