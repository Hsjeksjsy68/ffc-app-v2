import React from 'react';
import type { Player } from '../types';

interface PlayerCardProps {
    player: Player;
    onClick: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
    const imageUrl = player.imageUrl || `https://avatar.vercel.sh/${player.name}.svg?text=${player.name.charAt(0)}`;
    return (
        <div 
            className="bg-white dark:bg-dark-base-100 rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="relative">
                <img className="w-full h-48 object-cover" src={imageUrl} alt={player.name} />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white font-bold text-2xl rounded-full w-12 h-12 flex items-center justify-center">
                    {player.number}
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold">{player.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{player.position}</p>
            </div>
        </div>
    );
};

export default PlayerCard;