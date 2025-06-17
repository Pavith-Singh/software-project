import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function Account() {
  const [username, setUsername] = useState<string>('Account');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.displayName) {
          setUsername(user.displayName);
        } else if (user.email) {
          setUsername(user.email.split('@')[0]);
        }
      } else {
        setUsername('Guest');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-100 flex items-center justify-center text-xl">
        <h1 className="text-2xl">Welcome {username}</h1>
      </div>
    </div>
  );
}

export default Account;