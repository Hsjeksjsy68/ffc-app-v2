import React, { useState, useEffect, useContext } from 'react';
import { auth } from '../services/firebase';
import { useAuthContext } from '../hooks/useAuth';
import Card from '../components/Card';
import { PageContext } from '../App';

const AdminLoginPage: React.FC = () => {
    const { user, isAdmin } = useAuthContext();
    const pageContext = useContext(PageContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && pageContext) {
            // A user has just logged in. Check if they are admin.
            if (isAdmin) {
                // Success: redirect to admin panel
                pageContext.setCurrentPage('Admin');
            } else {
                // Not an admin. Show error and log them out immediately.
                setError('You do not have administrative privileges.');
                auth.signOut();
            }
        }
    }, [user, isAdmin, pageContext]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // After this, the useEffect will trigger to handle redirection or error.
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
    
    // This view shouldn't be rendered if an admin is already logged in,
    // as the nav link is hidden, but this acts as a fallback.
    if (user && isAdmin) {
        return (
            <div className="text-center">
                <p>Redirecting to Admin Panel...</p>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6">Admin Login</h1>
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

export default AdminLoginPage;