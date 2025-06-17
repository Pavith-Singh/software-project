import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMessageCircle } from "react-icons/fi";
import { SlCalculator } from "react-icons/sl";
import { GoGraph } from "react-icons/go";
import { FaEarthAmericas } from "react-icons/fa6";
import { SiGoogleclassroom } from "react-icons/si";
import { GiArtificialIntelligence } from "react-icons/gi";
import { FaUserFriends } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { FaPen } from "react-icons/fa";

const Sidebar: React.FC = () => {
    const [initials, setInitials] = React.useState<string | null>(null);
    const [username, setUsername] = React.useState<string>('Account');
    const [basePath] = React.useState<string>('/home');
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.displayName) {
                    setUsername(user.displayName);
                    const parts = user.displayName.trim().split(/\s+/).filter(p => p.length > 0);
                    if (parts.length >= 2) {
                        setInitials(`${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase());
                    } else {
                        setInitials(parts[0][0].toUpperCase());
                    }
                } else if (user.email) {
                    const local = user.email.split('@')[0];
                    setUsername(local);
                    const segments = local.split(/[\._\-]/).filter(s => s.length > 0);
                    if (segments.length >= 2) {
                        setInitials(`${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase());
                    } else {
                        setInitials(local.slice(0, 2).toUpperCase());
                    }
                } else {
                    setUsername('Account');
                    setInitials(null);
                }
            } else {
                setUsername('Account');
                setInitials(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const go = (subpath: string) => {
        const path = subpath ? `${basePath}/${subpath}` : basePath;
        navigate(path);
    };

    const isActive = (subpath: string) => {
        const target = subpath ? `${basePath}/${subpath}` : basePath;
        if (!subpath && (location.pathname === target || location.pathname === '/')) {
            return true;
        }
        return location.pathname === target;
    };

    return (
        <div className='fixed z-20 top-0 left-0 h-screen w-16 flex flex-col bg-gray-900 text-white shadow-lg'>
            <SidebarIcon
                onClick={() => go('')}
                icon={<FaEarthAmericas size={28} />}
                text="Explore Student World"
                active={isActive('')}
            />
            <SidebarIcon
                onClick={() => go('classes')}
                icon={<SiGoogleclassroom size={28} />}
                text="Classes"
                active={isActive('classes')}
            />
            <SidebarIcon
                onClick={() => go('activities')}
                icon={<RxActivityLog size={28} />}
                text="Activities"
                active={isActive('activities')}
            />
            <SidebarIcon
                onClick={() => go('social')}
                icon={<FaUserFriends size={28} />}
                text="Social"
                active={isActive('social')}
            />
            <SidebarIcon
                onClick={() => go('notes')}
                icon={<FaPen size={28} />}
                text="Notes"
                active={isActive('notes')}
            />
            <SidebarIcon
                onClick={() => go('messages')}
                icon={<FiMessageCircle size={28} />}
                text="Messages"
                active={isActive('messages')}
            />
            <SidebarIcon
                onClick={() => go('calculator')}
                icon={<SlCalculator size={28} />}
                text="Calculator"
                active={isActive('calculator')}
            />
            <SidebarIcon
                onClick={() => go('graph')}
                icon={<GoGraph size={28} />}
                text="Graphing Calculator"
                active={isActive('graph')}
            />
            <SidebarIcon
                onClick={() => go('ai')}
                icon={<GiArtificialIntelligence size={28} />}
                text="NSWEduChat 2.0"
                active={isActive('ai')}
            />
            <div className='flex-1'></div>
            <SidebarIcon
                onClick={() => go('account')}
                icon={
                    initials ? (
                        <div className="flex items-center justify-center w-full h-full text-2xl">
                            {initials}
                        </div>
                    ) : (
                        <MdAccountCircle size={48} />
                    )
                }
                text={username}
                active={isActive('account')}
            />
        </div>
    );
};

type SidebarIconProps = {
    onClick: () => void;
    icon: React.ReactNode;
    text: string;
    active?: boolean;
};

const SidebarIcon = ({ onClick, icon, text = 'tooltip', active = false }: SidebarIconProps) => (
    <div
        onClick={onClick}
        className={`relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto shadow-lg cursor-pointer rounded-3xl hover:rounded-xl transition-all group ${
            active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-blue-500 hover:bg-blue-600 hover:text-white'
        }`}
    >
        {icon}
        <span className='absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100'>
            {text}
        </span>
    </div>
);

export default Sidebar;