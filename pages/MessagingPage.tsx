import React, { useState, useEffect, useRef, useContext } from 'react';
import { database } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { useAuthContext } from '../hooks/useAuth';
import type { ChatMessage } from '../types';
import { PageContext } from '../App';

const MessagingPage: React.FC = () => {
    const { user } = useAuthContext();
    const pageContext = useContext(PageContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const messagesQuery = database.ref('messages').orderByChild('timestamp').limitToLast(50);
        const listener = messagesQuery.on('value', (snapshot) => {
            const data = snapshot.val();
            const loadedMessages: ChatMessage[] = [];
            if (data) {
                for (const key in data) {
                    loadedMessages.push({ id: key, ...data[key] });
                }
            }
            setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
        });
        return () => messagesQuery.off('value', listener);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user) return;

        const messagesRef = database.ref('messages');
        await messagesRef.push({
            text: newMessage,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL,
        });

        setNewMessage('');
    };
    
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-dark-base-100 rounded-2xl shadow-lg">
            <h1 className="text-2xl font-bold p-4 border-b dark:border-gray-700">Team Chat</h1>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${user && msg.uid === user.uid ? 'flex-row-reverse' : ''}`}>
                        <img src={msg.photoURL || `https://avatar.vercel.sh/${msg.displayName}.svg?text=${msg.displayName?.charAt(0)}`} alt="avatar" className="w-10 h-10 rounded-full"/>
                        <div className={`p-3 rounded-2xl max-w-xs lg:max-w-md ${user && msg.uid === user.uid ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-dark-base-200 rounded-bl-none'}`}>
                            <p className="font-bold text-sm">{msg.displayName}</p>
                            <p>{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t dark:border-gray-700">
                {user ? (
                    <form onSubmit={handleSendMessage} className="flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-dark-base-200 border-transparent focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button type="submit" className="ml-3 p-3 rounded-full bg-primary text-white hover:bg-primary-focus transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" transform="rotate(45)">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <p>
                            Please{' '}
                            <button
                                onClick={() => pageContext?.setCurrentPage('Player Login')}
                                className="text-primary font-bold hover:underline"
                            >
                                log in
                            </button>
                            {' '}to join the conversation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingPage;