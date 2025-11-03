import React, { useState, createContext, useMemo, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import MessagingPage from './pages/MessagingPage';
import PlayersPage from './pages/PlayersPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import { useTheme } from './hooks/useTheme';
import { useAuth, AuthContext, User } from './hooks/useAuth';
import { NAV_LINKS, ADMIN_NAV_LINK, LOGOUT_NAV_LINK } from './constants';
import type { Page } from './types';

export const ThemeContext = createContext<{ theme: string; toggleTheme: () => void; } | null>(null);
export const PageContext = createContext<{ currentPage: Page; setCurrentPage: (page: Page) => void; } | null>(null);

const App: React.FC = () => {
    const [theme, toggleTheme] = useTheme();
    const [currentPage, setCurrentPage] = useState<Page>('Home');
    const { user, isAdmin } = useAuth();
    
    const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
    const pageValue = useMemo(() => ({ currentPage, setCurrentPage }), [currentPage]);
    const authValue = useMemo(() => ({ user, isAdmin }), [user, isAdmin]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    const renderPage = () => {
        switch (currentPage) {
            case 'Home':
                return <HomePage />;
            case 'Schedule':
                return <SchedulePage />;
            case 'Messaging':
                return <MessagingPage />;
            case 'Players':
                return <PlayersPage />;
            case 'Player Login':
                return <LoginPage />;
            case 'Admin Login':
                return <AdminLoginPage />;
            case 'Admin':
                return isAdmin ? <AdminPage /> : <HomePage />; // Redirect if not admin
            default:
                return <HomePage />;
        }
    };

    const navLinks = useMemo(() => {
        if (user) {
            // User is logged in, filter out login links
            const baseLinks = NAV_LINKS.filter(
                (link) => link.name !== 'Player Login' && link.name !== 'Admin Login'
            );
            if (isAdmin) {
                // If admin, add the admin panel link and logout
                return [...baseLinks, ADMIN_NAV_LINK, LOGOUT_NAV_LINK];
            }
             // If regular player, just add logout
            return [...baseLinks, LOGOUT_NAV_LINK];
        }
        // User is not logged in, return all default links
        return NAV_LINKS;
    }, [user, isAdmin]);


    return (
        <ThemeContext.Provider value={themeValue}>
            <AuthContext.Provider value={authValue}>
                <PageContext.Provider value={pageValue}>
                    <div className={`flex h-screen font-sans bg-gray-100 dark:bg-dark-base-200 text-gray-800 dark:text-dark-base-content`}>
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-base-200 pb-20">
                                <div className="container mx-auto px-6 py-8">
                                    {renderPage()}
                                </div>
                            </main>
                        </div>
                        <BottomNav navLinks={navLinks} />
                    </div>
                </PageContext.Provider>
            </AuthContext.Provider>
        </ThemeContext.Provider>
    );
};

export default App;