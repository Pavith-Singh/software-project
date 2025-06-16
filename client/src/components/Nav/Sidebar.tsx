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




import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <div className='fixed z-20 top-0 left-0 h-screen w-16 flex flex-col bg-gray-900 text-white shadow-lg'>
            <SidebarIcon icon={<FaEarthAmericas size={28} />} text="Explore Student World" />
            <SidebarIcon icon={<SiGoogleclassroom size={28} />} text="Classes" />
            <SidebarIcon icon={<RxActivityLog size={28} />} text="Activities" />
            <SidebarIcon icon={<FaUserFriends size={28} />} text="Social" />
            <SidebarIcon icon={<FaPen size={28} />} text="Notes" />
            <SidebarIcon icon={<FiMessageCircle size={28} />} text="Messages" />
            <SidebarIcon icon={<SlCalculator size={28} />} text="Calculator" />
            <SidebarIcon icon={<GoGraph size={28} />} text="Graphing Calculator" />
            <SidebarIcon icon={<GiArtificialIntelligence size={28} />} text="NSWEduChat 2.0" />
            <div className='flex-1'></div>
            <SidebarIcon icon={<MdAccountCircle size={48} />} text="Account" />
        </div>
    );
};

type SidebarIconProps = {
    icon: React.ReactNode;
    text: string;
};

const SidebarIcon = ({ icon, text='tooltip' }: SidebarIconProps) => (
    <div className = "relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto shadow-lg cursor-pointer bg-gray-800 text-blue-500 hover:bg-blue-600 hover:text-white rounded-3xl hover:rounded-xl transition-all group">
        {icon}

        <span className='absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100'>{text}</span>

    </div>
);


export default Sidebar;