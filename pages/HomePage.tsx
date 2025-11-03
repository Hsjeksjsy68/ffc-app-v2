
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import type { Player, NewsArticle, Match, TrainingSession } from '../types';
import { firestore } from '../services/firebase';
// Fix: Removed modular imports for Firebase v9.
// import { collection, getDocs, orderBy, limit, query, where, Timestamp } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

const StatCard: React.FC<{ title: string; player: Player | null; value: string; loading: boolean }> = ({ title, player, value, loading }) => (
    <Card className="flex items-center space-x-4">
        {loading ? (
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-base-300 animate-pulse"></div>
        ) : (
            <img src={player?.imageUrl || `https://avatar.vercel.sh/${player?.name}.svg?text=${player?.name?.charAt(0)}`} alt={player?.name} className="w-16 h-16 rounded-full object-cover" />
        )}
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <h3 className="text-xl font-bold">{loading ? 'Loading...' : player?.name || 'N/A'}</h3>
            <p className="text-2xl font-bold text-primary">{loading ? '...' : value}</p>
        </div>
    </Card>
);

const HomePage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [topScorer, setTopScorer] = useState<Player | null>(null);
    const [topAssister, setTopAssister] = useState<Player | null>(null);
    const [topGA, setTopGA] = useState<Player | null>(null);
    const [latestNews, setLatestNews] = useState<NewsArticle | null>(null);
    const [nextMatch, setNextMatch] = useState<Match | null>(null);
    const [lastResult, setLastResult] = useState<Match | null>(null);
    const [nextTraining, setNextTraining] = useState<TrainingSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all players to calculate stats
                // Fix: Use namespaced collection() and get() for Firebase v8.
                const playersRef = firestore.collection('players');
                const playersSnap = await playersRef.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                const playersList = playersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Player) }));
                setPlayers(playersList);

                if (playersList.length > 0) {
                    // Top Scorer
                    const scorer = [...playersList].sort((a, b) => b.stats.season.goals - a.stats.season.goals)[0];
                    setTopScorer(scorer);
                    // Top Assister
                    const assister = [...playersList].sort((a, b) => b.stats.season.assists - a.stats.season.assists)[0];
                    setTopAssister(assister);
                    // Top G/A
                    const ga = [...playersList].sort((a, b) => (b.stats.season.goals + b.stats.season.assists) - (a.stats.season.goals + a.stats.season.assists))[0];
                    setTopGA(ga);
                }

                // Fetch latest news
                // Fix: Use chained query methods for Firebase v8.
                const newsRef = firestore.collection('news');
                const newsQuery = newsRef.orderBy('date', 'desc').limit(1);
                const newsSnap = await newsQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                if (!newsSnap.empty) setLatestNews({ id: newsSnap.docs[0].id, ...(newsSnap.docs[0].data() as NewsArticle) });

                // Fetch all matches and filter client-side to avoid composite index error
                const matchesRef = firestore.collection('matches');
                const allMatchesQuery = matchesRef.orderBy('date', 'desc');
                const allMatchesSnap = await allMatchesQuery.get();
                const allMatches = allMatchesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Match) }));

                const upcomingMatches = allMatches.filter(m => !m.isPast).reverse(); // .reverse() to get ascending order for finding the *next* match
                const pastMatches = allMatches.filter(m => m.isPast); // Already sorted descending

                if (upcomingMatches.length > 0) {
                    setNextMatch(upcomingMatches[0]);
                }
                if (pastMatches.length > 0) {
                    setLastResult(pastMatches[0]);
                }


                // Fetch next training
                const trainingRef = firestore.collection('training');
                // Fix: Use namespaced Timestamp for Firebase v8.
                const now = firebase.firestore.Timestamp.now();
                const trainingQuery = trainingRef.where('date', '>=', now).orderBy('date', 'asc').limit(1);
                const trainingSnap = await trainingQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                if (!trainingSnap.empty) setNextTraining({ id: trainingSnap.docs[0].id, ...(trainingSnap.docs[0].data() as TrainingSession) });

            } catch (error) {
                console.error("Error fetching homepage data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const topGAValue = (topGA?.stats.season.goals || 0) + (topGA?.stats.season.assists || 0);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Club Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard loading={loading} title="Top Goal Scorer" player={topScorer} value={`${topScorer?.stats.season.goals || 0} Goals`} />
                <StatCard loading={loading} title="Top Assister" player={topAssister} value={`${topAssister?.stats.season.assists || 0} Assists`} />
                <StatCard loading={loading} title="Top G/A" player={topGA} value={`${topGAValue} G/A`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Latest News</h2>
                    {loading ? <p>Loading news...</p> : latestNews ? (
                        <div className="flex flex-col md:flex-row gap-4">
                            <img src={latestNews.imageUrl} alt={latestNews.title} className="w-full md:w-1/3 h-auto rounded-lg object-cover" />
                            <div>
                                <h3 className="text-xl font-bold">{latestNews.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{latestNews.date.toDate().toLocaleDateString()}</p>
                                <p>{latestNews.summary}</p>
                            </div>
                        </div>
                    ) : <p>No news available.</p>}
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h2 className="text-2xl font-bold mb-4">Next Training</h2>
                        {loading ? <p>Loading...</p> : nextTraining ? (
                            <div>
                                <p><span className="font-semibold">Date:</span> {nextTraining.date.toDate().toLocaleString()}</p>
                                <p><span className="font-semibold">Location:</span> {nextTraining.location}</p>
                                <p><span className="font-semibold">Focus:</span> {nextTraining.focus}</p>
                            </div>
                        ) : <p>No training scheduled.</p>}
                    </Card>
                    <Card>
                        <h2 className="text-2xl font-bold mb-4">Next Match</h2>
                        {loading ? <p>Loading...</p> : nextMatch ? (
                            <div>
                                <p className="text-xl font-semibold">vs {nextMatch.opponent}</p>
                                <p><span className="font-semibold">Date:</span> {nextMatch.date.toDate().toLocaleString()}</p>
                                <p><span className="font-semibold">Venue:</span> {nextMatch.venue}</p>
                            </div>
                        ) : <p>No matches scheduled.</p>}
                    </Card>
                    <Card>
                        <h2 className="text-2xl font-bold mb-4">Last Result</h2>
                        {loading ? <p>Loading...</p> : lastResult ? (
                            <div>
                                <p className="text-md font-semibold">vs {lastResult.opponent}</p>
                                <div className="text-right">
                                     <p className="text-xl font-bold">{`${lastResult.score?.home} - ${lastResult.score?.away}`}</p>
                                </div>
                            </div>
                        ) : <p>No past matches recorded.</p>}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
