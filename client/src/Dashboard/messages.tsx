import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import Sidebar from '../components/Nav/Sidebar';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';



interface Classroom {
  id: string;
  name: string;
  subject: string;
  code: string;
  teacherName: string;
  memberIds: string[];
}

interface UserProfile {
  uid: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

const getInitials = (name?: string) =>
  name
    ? name
        .split(' ')
        .map(p => p[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : '';

const resolveName = (users: UserProfile[], uid: string) => {
  const u = users.find(x => x.uid === uid);
  return u ? u.username || u.displayName || (u.email ? u.email.split('@')[0] : uid) : uid;
};

function Messages() {
  const [tab, setTab] = useState<'classes' | 'friends'>('classes');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myClasses, setMyClasses] = useState<Classroom[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => onAuthStateChanged(getAuth(), u => setCurrentUser(u)), []);

  const fetchFriends = useCallback((uid: string) => {
    fetch(`${import.meta.env.VITE_API_URL}/friends/${uid}`)
      .then(res => res.json())
      .then(data => setFriends(data.friends as string[]))
      .catch(console.error);
  }, []);

  const fetchClasses = useCallback(async (uid: string) => {
    const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', uid));
    const snap = await getDocs(q);
    const list: Classroom[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<Classroom, 'id'>) }));
    setMyClasses(list);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchClasses(currentUser.uid);
    fetchFriends(currentUser.uid);
  }, [currentUser, fetchClasses, fetchFriends]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => list.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
      setUsers(list);
    })();
  }, []);

  const goToChat = (type: 'class' | 'friend', id: string) => {
    navigate(`/home/messages/${type}/${id}`);
  };

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="ml-16 flex-1 p-6 overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <button
            className={`px-3 py-1 rounded cursor-pointer ${tab === 'classes' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setTab('classes')}
          >
            Classes
          </button>
          <button
            className={`px-3 py-1 rounded cursor-pointer ${tab === 'friends' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setTab('friends')}
          >
            Friends
          </button>
        </div>

        {tab === 'classes' ? (
          myClasses.length === 0 ? (
            <p className="text-gray-400">No classes available</p>
          ) : (
            <div className="flex flex-col space-y-2">
              {myClasses.map(cls => (
                <div
                  key={cls.id}
                  className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700"
                  onClick={() => goToChat('class', cls.id)}
                >
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-xs text-gray-400">{cls.subject}</p>
                </div>
              ))}
            </div>
          )
        ) : friends.length === 0 ? (
          <p className="text-gray-400">No friends yet.</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {friends.map(uid => {
              const p = users.find(u => u.uid === uid);
              return (
                <div
                  key={uid}
                  className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 flex items-center space-x-4"
                  onClick={() => goToChat('friend', uid)}
                >
                  {p?.photoURL ? (
                    <img src={p.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-sm">{getInitials(resolveName(users, uid))}</span>
                    </div>
                  )}
                  <span className="font-medium text-sm">{resolveName(users, uid)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;