import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User, UserInfo } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import { SlCalculator } from 'react-icons/sl';
import { GoGraph } from 'react-icons/go';
import { FaEarthAmericas, FaLaptopCode } from 'react-icons/fa6';
import { SiGoogleclassroom } from 'react-icons/si';
import { GiArtificialIntelligence } from 'react-icons/gi';
import { FaUserFriends } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { RxActivityLog } from 'react-icons/rx';
import { FaPen } from 'react-icons/fa';
import Calculator from './calculator';

// Util: get best possible photoURL from user object
function getProfilePhoto(user: User | null): string | null {
    if (!user) return null;
    // Try the main user.photoURL first
    if (user.photoURL) return user.photoURL;
    // Try all providerData for a non-null photoURL (Google etc)
    if (user.providerData) {
        for (const p of user.providerData) {
            if (p.photoURL) return p.photoURL;
        }
    }
    return null;
}

// Util: get initials from displayName or email
function getInitials(user: User | null): string | null {
    if (!user) return null;
    if (user.displayName) {
        const parts = user.displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        return parts[0][0].toUpperCase();
    }
    if (user.email) {
        const segs = user.email.split('@')[0].split(/[\._\-]/).filter(Boolean);
        if (segs.length >= 2) return `${segs[0][0]}${segs[segs.length-1][0]}`.toUpperCase();
        return segs[0].slice(0, 2).toUpperCase();
    }
    return null;
}

const Sidebar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string>('Account');
    const [showCalc, setShowCalc] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [basePath] = useState<string>('/home');

    useEffect(() => {
        const auth = getAuth();
        return onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u?.displayName) setUsername(u.displayName);
            else if (u?.email) setUsername(u.email.split('@')[0]);
            else setUsername('Account');
        });
    }, []);

    const go = (subpath: string) => {
        const path = subpath ? `${basePath}/${subpath}` : basePath;
        navigate(path);
    };

    const isActive = (subpath: string) => {
        const target = subpath ? `${basePath}/${subpath}` : basePath;
        if (!subpath && (location.pathname === target || location.pathname === '/')) return true;
        return location.pathname === target;
    };

    // This will *always* give you the best profile photo, or null
    const avatarUrl = getProfilePhoto(user);

    // Get initials for fallback
    const initials = getInitials(user);

    return (
        <>
            <div className="fixed z-20 top-0 left-0 h-screen w-16 flex flex-col bg-gray-900 text-white shadow-lg">
                <SidebarIcon onClick={() => go('')} icon={<FaEarthAmericas size={28} />} text="Explore Student World" active={isActive('')} />
                <SidebarIcon onClick={() => go('classes')} icon={<SiGoogleclassroom size={28} />} text="Classes" active={isActive('classes')} />
                <SidebarIcon onClick={() => go('activities')} icon={<RxActivityLog size={28} />} text="Activities" active={isActive('activities')} />
                <SidebarIcon onClick={() => go('social')} icon={<FaUserFriends size={28} />} text="Social" active={isActive('social')} />
                <SidebarIcon onClick={() => go('notes')} icon={<FaPen size={28} />} text="Notes" active={isActive('notes')} />
                <SidebarIcon onClick={() => go('messages')} icon={<FiMessageCircle size={28} />} text="Messages" active={isActive('messages')} />
                <SidebarIcon onClick={() => setShowCalc(p => !p)} icon={<SlCalculator size={28} />} text="Calculator" active={showCalc} />
                <SidebarIcon onClick={() => go('graph')} icon={<GoGraph size={28} />} text="Graphing Calculator" active={isActive('graph')} />
                <SidebarIcon onClick={() => go('ai')} icon={<GiArtificialIntelligence size={28} />} text="NSWEduChat 2.0" active={isActive('ai')} />
                <SidebarIcon onClick={() => go('ide')} icon={<FaLaptopCode size={28} />} text="IDE" active={isActive('ide')} />
                <div className="flex-1"></div>
                <SidebarIcon
                    onClick={() => go('account')}
                    icon={
                        avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/100"; }}
                            />
                        ) : initials ? (
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
            {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
        </>
    );
};

type SidebarIconProps = {
    onClick: () => void;
    icon: React.ReactNode;
    text: string;
    active?: boolean;
};

const SidebarIcon: React.FC<SidebarIconProps> = ({ onClick, icon, text = 'tooltip', active = false }) => (
    <div
        onClick={onClick}
        className={`relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto shadow-lg cursor-pointer rounded-3xl hover:rounded-xl transition-all group ${
            active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-blue-500 hover:bg-blue-600 hover:text-white'
        }`}
    >
        {icon}
        <span className="absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
            {text}
        </span>
    </div>
);

export default Sidebar;