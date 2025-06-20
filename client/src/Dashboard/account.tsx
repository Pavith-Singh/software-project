import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Nav/Sidebar';
import visible from '../assets/eye.png';
import invisible from '../assets/eye_closed.png';
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase/firebase';

const storage = getStorage(app);

const Account: React.FC = () => {
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [activeSection, setActiveSection] = useState<'' | 'username' | 'email' | 'password' | 'picture'>('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [currentPassUsername, setCurrentPassUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassEmail, setCurrentPassEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassPwd, setCurrentPassPwd] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPassPic, setCurrentPassPic] = useState('');
  const [showPassUsername, setShowPassUsername] = useState(false);
  const [showPassEmail, setShowPassEmail] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);
  const [showPassCurrent, setShowPassCurrent] = useState(false);
  const [showPassPic, setShowPassPic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setNewDisplayName(u.displayName || '');
        setNewEmail(u.email || '');
        setPhotoPreview(u.photoURL || null);
        const googleOnly = u.providerData.length === 1 && u.providerData[0].providerId === 'google.com';
        setIsGoogleUser(googleOnly);
      }
    });
    return () => unsub();
  }, [auth]);

  const reauth = async (pass: string) => {
    if (!user || !user.email) throw new Error('User not found');
    const cred = EmailAuthProvider.credential(user.email, pass);
    await reauthenticateWithCredential(user, cred);
  };

  const handleUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await reauth(currentPassUsername);
      if (!user) throw new Error();
      await updateProfile(user, { displayName: newDisplayName });
      setSuccess('Username updated!');
      setActiveSection('');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await reauth(currentPassEmail);
      if (!user) throw new Error();
      await updateEmail(user, newEmail);
      setSuccess('Email updated!');
      setActiveSection('');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await reauth(currentPassPwd);
      if (!user) throw new Error();
      await updatePassword(user, newPassword);
      setSuccess('Password changed!');
      setActiveSection('');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handlePicture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to update your profile picture.');
      setLoading(false);
      return;
    }

    if (!photoPreview) {
      setError('Please select a picture to upload.');
      setLoading(false);
      return;
    }

    try {
      await reauth(currentPassPic);
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      const uploadTask = await uploadString(storageRef, photoPreview, 'data_url');
      const downloadURL = await getDownloadURL(uploadTask.ref);
      await updateProfile(user, { photoURL: downloadURL });
      setSuccess('Profile picture updated!');
      setActiveSection('');
    } catch (err: any) {
      setError(err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' : err.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/signin';
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const fr = new FileReader();
      fr.onload = () => setPhotoPreview(fr.result as string);
      fr.readAsDataURL(file);
    }
  };

  const inputCls = 'w-full px-3 py-2 pr-10 rounded bg-white/10 text-white placeholder:text-gray-400 focus:outline-none';

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-600 via-red-900 to-black">
      <Sidebar />
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, type: 'spring' } }}
        className="w-[90%] max-w-md p-5 bg-black/25 flex-col flex items-center gap-4 rounded-xl shadow-blue-600 shadow-lg relative"
      >
        <h1 className="text-2xl font-semibold text-white">
          {activeSection === ''
            ? 'Account Settings'
            : { username: 'Change Username', email: 'View Details', password: 'Change Password', picture: 'Change Profile Picture' }[activeSection]}
        </h1>

        <AnimatePresence mode="wait">
          {activeSection === '' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-3 w-full"
            >
              {['username', 'email', 'password', 'picture'].map((sec) => {
                const disabled = isGoogleUser && (sec === 'username' || sec === 'password' || sec === 'picture');
                return (
                  <button
                    key={sec}
                    onClick={() => {
                      if (!disabled) {
                        setActiveSection(sec as any);
                        setError(null);
                        setSuccess(null);
                      }
                    }}
                    disabled={disabled}
                    className={`cursor-pointer font-semibold py-2 rounded ${
                      disabled
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {sec === 'email'
                      ? 'View Details'
                      : sec === 'picture'
                      ? 'Change Profile Picture'
                      : `Change ${sec.charAt(0).toUpperCase() + sec.slice(1)}`}
                  </button>
                );
              })}
              <button onClick={handleSignOut} className="cursor-pointer bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded mt-4">
                Sign Out
              </button>
            </motion.div>
          )}

          {activeSection === 'username' && (
            <motion.form
              key="username"
              onSubmit={handleUsername}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col gap-3"
            >
              <input
                type="text"
                className={inputCls.replace('pr-10', '')}
                placeholder="New Username"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                required
              />
              <div className="relative w-full">
                <input
                  type={showPassUsername ? 'text' : 'password'}
                  className={inputCls}
                  placeholder="Current password"
                  value={currentPassUsername}
                  onChange={(e) => setCurrentPassUsername(e.target.value)}
                  required
                />
                <img
                  src={showPassUsername ? visible : invisible}
                  alt="toggle"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPassUsername(v => !v)}
                />
              </div>
              <button type="submit" disabled={loading} className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded">
                Save Username
              </button>
              <button type="button" onClick={() => setActiveSection('')} className="cursor-pointer text-gray-400 underline">
                Cancel
              </button>
            </motion.form>
          )}

          {activeSection === 'email' && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-white text-sm w-full flex flex-col items-center"
            >
              <img src={user.photoURL || 'https://via.placeholder.com/100'} alt="Profile" className="w-24 h-24 rounded-full" />
              <div className="text-lg font-semibold">{user.displayName || 'No username set'}</div>
              <div>Email: <span className="font-mono">{user.email}</span></div>
              <button type="button" onClick={() => setActiveSection('')} className="cursor-pointer text-gray-400 underline">
                Back
              </button>
            </motion.div>
          )}

          {activeSection === 'password' && (
            <motion.form
              key="password"
              onSubmit={handlePassword}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col gap-3"
            >
              <div className="relative w-full">
                <input
                  type={showPassNew ? 'text' : 'password'}
                  className={inputCls}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <img
                  src={showPassNew ? visible : invisible}
                  alt="toggle"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPassNew(v => !v)}
                />
              </div>
              <div className="relative w-full">
                <input
                  type={showPassCurrent ? 'text' : 'password'}
                  className={inputCls}
                  placeholder="Current password"
                  value={currentPassPwd}
                  onChange={(e) => setCurrentPassPwd(e.target.value)}
                  required
                />
                <img
                  src={showPassCurrent ? visible : invisible}
                  alt="toggle"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPassCurrent(v => !v)}
                />
              </div>
              <button type="submit" disabled={loading} className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded">
                Save Password
              </button>
              <button type="button" onClick={() => setActiveSection('')} className="cursor-pointer text-gray-400 underline">
                Cancel
              </button>
            </motion.form>
          )}

          {activeSection === 'picture' && (
            <motion.form
              key="picture"
              onSubmit={handlePicture}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col gap-3"
            >
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onPhotoChange} />
              <button
                type="button"
                className="cursor-pointer bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Profile Picture
              </button>
              {photoPreview && <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full mx-auto" />}
              <div className="relative w-full">
                <input
                  type={showPassPic ? 'text' : 'password'}
                  className={inputCls}
                  placeholder="Current password"
                  value={currentPassPic}
                  onChange={(e) => setCurrentPassPic(e.target.value)}
                  required
                />
                <img
                  src={showPassPic ? visible : invisible}
                  alt="toggle"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPassPic(v => !v)}
                />
              </div>
              <button type="submit" disabled={loading} className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded">
                Save Picture
              </button>
              <button type="button" onClick={() => setActiveSection('')} className="cursor-pointer text-gray-400 underline">
                Cancel
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && <div className="text-red-400 text-xs text-center mt-2">{error}</div>}
        {success && <div className="text-green-400 text-xs text-center mt-2">{success}</div>}
      </motion.div>
    </div>
  );
};

export default Account;