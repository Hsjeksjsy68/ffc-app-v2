// Fix: Import ComponentType from 'react' to resolve namespace error.
import type { ComponentType } from 'react';

export type Page = 'Home' | 'Schedule' | 'Messaging' | 'Players' | 'Player Login' | 'Admin Login' | 'Admin' | 'Logout';

export interface NavLink {
    name: Page;
    icon: ComponentType<{ className?: string }>;
}

export interface Player {
    id?: string;
    name: string;
    position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
    number: number;
    imageUrl: string;
    joinDate: string; 
    stats: {
        season: {
            appearances: number;
            goals: number;
            assists: number;
        };
        allTime: {
            appearances: number;
            goals: number;
            assists: number;
        };
    };
}

export interface Match {
    id?: string;
    opponent: string;
    date: any; // Accommodate Firebase Timestamp
    venue: 'Home' | 'Away';
    isPast: boolean;
    score?: {
        home: number;
        away: number;
    };
}

export interface TrainingSession {
    id?: string;
    date: any; // Accommodate Firebase Timestamp
    focus: string;
    location: string;
}

export interface NewsArticle {
    id?: string;
    title: string;
    summary: string;
    date: any; // Accommodate Firebase Timestamp
    imageUrl: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    timestamp: number;
    uid: string;
    displayName: string;
    photoURL: string | null;
}

export interface UserDocument {
    id: string;
    email: string;
    isAdmin?: boolean;
    isPlayer?: boolean;
}

export type AdminItem = Player | Match | NewsArticle | TrainingSession | UserDocument;