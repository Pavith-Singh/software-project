import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import googleLogo from '../../assets/google.png';
import visible from '../../assets/eye.png';
import invisible from '../../assets/eye_closed.png';

const SigninComponent = () => {
  const [Signup, setSignup] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ShowPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <motion.div
        layout 
        transition={{ layout: { duration: 0.5, type: 'spring' } }}
        className="w-[90%] max-w-sm md:max-w-md lg:max-w-md p-5 bg-black/25 flex-col flex items-center gap-4 rounded-xl shadow-slate-500 shadow-lg"
      >
        <img src="/vite.png" alt="logo" className="w-12 md:w-14" />
        <h1 className="text-lg md:text-xl font-semibold text-white">
          {Signup ? 'Register with us' : 'Welcome Back'}
        </h1>

        <AnimatePresence mode="wait">
          <motion.form
            key={Signup ? 'signup' : 'signin'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col gap-3"
          >
            {Signup && (
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
            />
            <div className="relative w-full">
              <input
                type={ShowPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-3 py-2 pr-10 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
                onCopy={e => e.preventDefault()}
                onPaste ={e => e.preventDefault()}
              />
              <img
                src={ShowPassword ? visible : invisible}
                alt="toggle visibility"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer w-6 h-6"
                onClick={() => setShowPassword(!ShowPassword)}
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer bg-red-500 hover:bg-red-600 transition-all text-white font-semibold py-2 rounded"
            >
              {Signup ? 'Sign Up' : 'Sign In'}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="text-xs md:text-sm text-gray-400 text-center">
          {Signup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            className="text-red-400 cursor-pointer"
            onClick={() => setSignup(!Signup)}
          >
            {Signup ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        <div className="cursor-pointer w-full flex justify-center mt-2">
          <motion.div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            animate={{ width: hovered ? 180 : 48 }}
            initial={{ width: 48 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="h-12 bg-white rounded-full flex items-center shadow-md overflow-hidden px-2 transition-all"
          >
            <div className="w-full flex items-center justify-center gap-3">
              {!hovered && (
                <motion.img
                  src={googleLogo}
                  alt="Google Logo"
                  className="w-6 h-6"
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {hovered && (
                <>
                  <motion.img
                    src={googleLogo}
                    alt="Google Logo"
                    className="w-6 h-6"
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium text-black whitespace-nowrap"
                  >
                    {Signup ? 'Sign up with Google' : 'Sign in with Google'}
                  </motion.span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SigninComponent;