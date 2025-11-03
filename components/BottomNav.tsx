
import React, { useContext, useState, useEffect, useRef } from 'react';
import { PageContext } from '../App';
import type { NavLink, Page } from '../types';
// Fix: Removed modular signOut import for Firebase v9.
// import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { MoreIcon } from '../constants';
import ThemeToggle from './ThemeToggle';


interface BottomNavProps {
    navLinks: NavLink[];
}

const MAX_VISIBLE_LINKS = 4;

const BottomNav: React.FC<BottomNavProps> = ({ navLinks }) => {
    const pageContext = useContext(PageContext);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);
    
    if (!pageContext) return null;
    const { currentPage, setCurrentPage } = pageContext;

    const handleLinkClick = (page: Page) => {
        setIsMoreMenuOpen(false);
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
    
    const hasMoreLinks = navLinks.length > MAX_VISIBLE_LINKS;
    const visibleLinks = hasMoreLinks ? navLinks.slice(0, MAX_VISIBLE_LINKS -1) : navLinks;
    const hiddenLinks = hasMoreLinks ? navLinks.slice(MAX_VISIBLE_LINKS -1) : [];


    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-base-100 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
            {isMoreMenuOpen && (
                 <div ref={menuRef} className="absolute bottom-full mb-2 right-2 w-56 bg-white dark:bg-dark-base-100 rounded-xl shadow-lg p-2 border dark:border-gray-700">
                    <ul className="space-y-1">
                        {hiddenLinks.map(({ name, icon: Icon }) => (
                            <li key={name}>
                                <a
                                    href={`#${name.toLowerCase().replace(' ', '-')}`}
                                    onClick={(e) => { e.preventDefault(); handleLinkClick(name); }}
                                    className={`flex items-center w-full p-3 text-sm font-medium rounded-lg transition-colors duration-200 ${currentPage === name ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-base-200'}`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    <span>{name}</span>
                                </a>
                            </li>
                        ))}
                         <li className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700">
                            <ThemeToggle />
                        </li>
                    </ul>
                </div>
            )}
            <div className="flex justify-around">
                {visibleLinks.map(({ name, icon: Icon }) => (
                    <a
                        key={name}
                        href={`#${name.toLowerCase().replace(' ', '-')}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(name);
                        }}
                        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 text-gray-700 dark:text-dark-base-content transition-colors duration-200 ${currentPage === name ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs mt-1">{name}</span>
                    </a>
                ))}
                {hasMoreLinks && (
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 text-gray-700 dark:text-dark-base-content transition-colors duration-200 ${isMoreMenuOpen ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        <MoreIcon className="h-6 w-6" />
                        <span className="text-xs mt-1">More</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default BottomNav;