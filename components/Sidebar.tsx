
import React, { useContext } from 'react';
import { PageContext } from '../App';
import ThemeToggle from './ThemeToggle';
import type { NavLink, Page } from '../types';
// Fix: Removed modular signOut import for Firebase v9.
// import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface SidebarProps {
    navLinks: NavLink[];
}

const Sidebar: React.FC<SidebarProps> = ({ navLinks }) => {
    const pageContext = useContext(PageContext);
    if (!pageContext) return null;
    const { currentPage, setCurrentPage } = pageContext;

    const handleLinkClick = (page: Page) => {
        if (page === 'Logout') {
            // Fix: Use the namespaced signOut method for Firebase v8.
            auth.signOut().then(() => {
                setCurrentPage('Home');
            }).catch((error) => {
                console.error("Logout failed:", error);
            });
        } else {
            setCurrentPage(page);
        }
    };

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-dark-base-100 border-r border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
                <img src="https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" alt="Logo" className="h-12" />
                <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">Flamehunter FC</span>
            </div>
            <nav className="flex-1 px-4 py-4">
                {navLinks.map(({ name, icon: Icon }) => (
                    <a
                        key={name}
                        href={`#${name.toLowerCase().replace(' ', '-')}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(name);
                        }}
                        className={`flex items-center px-4 py-3 my-2 text-gray-700 dark:text-dark-base-content rounded-lg transition-colors duration-200 transform hover:bg-gray-200 dark:hover:bg-dark-base-200 ${currentPage === name ? 'bg-primary text-white dark:text-white' : ''}`}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="mx-4 font-medium">{name}</span>
                    </a>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <ThemeToggle />
            </div>
        </aside>
    );
};

export default Sidebar;