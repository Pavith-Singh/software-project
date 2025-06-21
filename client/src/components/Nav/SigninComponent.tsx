import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import googleLogo from '../../assets/google.png';
import visible from '../../assets/eye.png';
import invisible from '../../assets/eye_closed.png';
import {
  doSignInWithGoogle,
  doSignInWithEmailAndPassword,
  doCreateUserWithEmailAndPassword
} from '../../firebase/auth';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export const password_validation = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const SigninComponent = () => {
  const [Signup, setSignup] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ShowPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (Signup && !password_validation.test(password)) {
      setLoading(false);
      setError(
        'Password must be at least 8 characters long and include a letter, number, and special character.'
      );
      return;
    }

    try {
      if (Signup) {
        const userCredential = await doCreateUserWithEmailAndPassword(email, password);
        if (userCredential) {
          await updateProfile(userCredential.user, { displayName: fullName });
          await userCredential.user.reload();
        }
        setSuccess('Successfully signed up! Welcome to Student World!');
        navigate('/home');
      } else {
        await doSignInWithEmailAndPassword(email, password);
        setSuccess('Successfully signed in! Welcome back to Student World!');
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error('Authentication error:', err);
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await doSignInWithGoogle();
      setSuccess('Successfully signed in with Google!');
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
      console.error('Google authentication error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center relative">
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, type: 'spring' } }}
        className="w-[90%] max-w-sm md:max-w-md lg:max-w-md p-5 bg-black/25 flex-col flex items-center gap-4 rounded-xl shadow-blue-600 shadow-lg relative"
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
            onSubmit={handleSubmit}
          >
            {Signup && (
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="relative w-full">
              <input
                type={ShowPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-3 py-2 pr-10 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none"
                onCopy={e => e.preventDefault()}
                onPaste={e => e.preventDefault()}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <img
                src={ShowPassword ? visible : invisible}
                alt="toggle visibility"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer w-6 h-6"
                onClick={() => setShowPassword(!ShowPassword)}
              />
            </div>
            {error && (
              <div className="text-red-400 text-xs text-center">{error}</div>
            )}
            {success && (
              <div className="text-green-400 text-xs text-center">{success}</div>
            )}
            <button
              type="submit"
              className="cursor-pointer bg-red-500 hover:bg-red-600 transition-all text-white font-semibold py-2 rounded"
              disabled={loading}
            >
              {Signup ? 'Sign Up' : 'Sign In'}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="text-xs md:text-sm text-gray-400 text-center">
          {Signup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            className="text-red-400 cursor-pointer"
            onClick={() => {
              setSignup(!Signup);
              setError(null);
              setSuccess(null);
            }}
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
            onClick={handleGoogle}
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-white font-semibold">Loading...</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SigninComponent;