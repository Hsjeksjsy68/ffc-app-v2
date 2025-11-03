
import React, { useState, useEffect } from 'react';
import PlayerCard from '../components/PlayerCard';
import Modal from '../components/Modal';
import type { Player } from '../types';
import { firestore } from '../services/firebase';
// Fix: Removed modular imports for Firebase v9.
// import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const PlayerDetails: React.FC<{ player: Player }> = ({ player }) => (
    <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
            <img src={player.imageUrl || `https://avatar.vercel.sh/${player.name}.svg?text=${player.name.charAt(0)}`} alt={player.name} className="w-full h-auto rounded-lg object-cover" />
            <h2 className="text-3xl font-bold mt-4">{player.name}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">#{player.number} | {player.position}</p>
            <p className="mt-2">Joined: {new Date(player.joinDate).toLocaleDateString()}</p>
        </div>
        <div className="md:w-2/3">
            <h3 className="text-2xl font-bold mb-4">Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold text-lg">Current Season</h4>
                    <p>Appearances: {player.stats.season.appearances}</p>
                    <p>Goals: {player.stats.season.goals}</p>
                    <p>Assists: {player.stats.season.assists}</p>
                </div>
                <div className="bg-gray-100 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold text-lg">All Time</h4>
                    <p>Appearances: {player.stats.allTime.appearances}</p>
                    <p>Goals: {player.stats.allTime.goals}</p>
                    <p>Assists: {player.stats.allTime.assists}</p>
                </div>
            </div>
        </div>
    </div>
);


const PlayersPage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                // Fix: Use namespaced collection() and chained query methods for Firebase v8.
                const playersCollection = firestore.collection('players');
                const q = playersCollection.orderBy('number');
                const playerSnapshot = await q.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                const playerList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Player) }));
                setPlayers(playerList);
            } catch (error) {
                console.error("Error fetching players:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Meet the Team</h1>
            {loading ? (
                <p>Loading players...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {players.map(player => (
                        <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
                    ))}
                </div>
            )}

            <Modal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} title="Player Profile">
                {selectedPlayer && <PlayerDetails player={selectedPlayer} />}
            </Modal>
        </div>
    );
};

export default PlayersPage;