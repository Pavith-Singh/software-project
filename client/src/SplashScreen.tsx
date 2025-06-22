
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRocket } from 'react-icons/fa';

type Props = {
    onComplete: () => void;
};

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => onComplete(), 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);
    return (
    <motion.div
    className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50"
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    >
        <motion.div
        className="relative flex items-center"
        animate={{ x: [-160, 160, -160], y: [160, -160, 160] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            <motion.div
            className="absolute right-full h-2 rounded-r-full bg-gradient-to-r from-red-300/0 via-red-400/70 to-red-500/0"
            style={{
                width: 200,
                transformOrigin: '100% 50%',
                transform: 'rotate(315deg) translateY(50px)',
            }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <FaRocket className="text-gray-200 drop-shadow-lg" size={140} />
            </motion.div>
            <motion.div
            className="absolute bottom-20 w-full text-center text-white text-3xl font-bold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            >
                🌎 Student <span className="text-red-300">World</span>
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;