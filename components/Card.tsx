
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-dark-base-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
