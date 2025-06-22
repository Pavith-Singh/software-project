import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { db } from '../firebase/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaUserPlus } from 'react-icons/fa';
import Fuse from 'fuse.js';

const API_BASE = 'http://localhost:9000';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  code: string;
  bannerUrl?: string;
  teacherName: string;
  teacherId: string;
  memberIds: string[];
  limit: number | null;
}

interface UserProfile {
  uid: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

const initials = (name?: string) =>
  name
    ? name
        .split(' ')
        .map(p => p[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : '';

const Dashboard: React.FC = () => {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [tab, setTab] = useState<'classes' | 'people'>('classes');
  const [search, setSearch] = useState('');
  const [classList, setClassList] = useState<Classroom[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    if (!copyMsg) return;
    const t = setTimeout(() => setCopyMsg(''), 3000);
    return () => clearTimeout(t);
  }, [copyMsg]);

  useEffect(() => {
    (async () => {
      const classSnap = await getDocs(query(collection(db, 'classes')));
      const cls: Classroom[] = [];
      classSnap.forEach(d => cls.push({ id: d.id, ...(d.data() as Omit<Classroom, 'id'>) }));
      setClassList(cls);

      const userSnap = await getDocs(query(collection(db, 'users')));
      const usr: UserProfile[] = [];
      userSnap.forEach(d => usr.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
      setPeople(usr);
    })();
  }, []);

  useEffect(() => onAuthStateChanged(getAuth(), u => setCurrentUid(u?.uid || null)), []);

  const fuseClass = useMemo(
    () => new Fuse(classList, { keys: ['name', 'subject', 'code', 'teacherName'], threshold: 0.35 }),
    [classList]
  );
  const fusePeople = useMemo(
    () => new Fuse(people, { keys: ['username', 'displayName', 'email'], threshold: 0.35 }),
    [people]
  );

  const shownClasses =
    tab === 'classes'
      ? search.trim()
        ? fuseClass.search(search).map(r => r.item)
        : classList
      : [];

  const shownPeople =
    tab === 'people'
      ? (search.trim() ? fusePeople.search(search).map(r => r.item) : people).filter(
          p => p.uid !== currentUid
        )
      : [];

  const copyClassCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() =>
        setCopyMsg('Class code copied! Open “Join” in Classes and paste it.')
      )
      .catch(() => setCopyMsg(`Copy failed. Class code: ${code}`));
  };

  const sendFriend = (uid: string) => {
    if (!currentUid) return;
    fetch(`${API_BASE}/friend-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_uid: currentUid, requested_uid: uid })
    }).then(() => setCopyMsg('Friend request sent!'));
  };

  const studentsCount = (c: Classroom) => c.memberIds.filter(id => id !== c.teacherId).length;

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="ml-16 flex-1 p-6 overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('classes')}
            className={`px-3 py-1 rounded ${tab === 'classes' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'} cursor-pointer`}
          >
            Classes
          </button>
          <button
            onClick={() => setTab('people')}
            className={`px-3 py-1 rounded ${tab === 'people' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'} cursor-pointer`}
          >
            People
          </button>
        </div>

        <input
          type="text"
          placeholder={tab === 'classes' ? 'Search classes' : 'Search people'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-700 px-4 py-2 rounded mb-8 focus:outline-none"
        />

        {tab === 'classes' &&
          (shownClasses.length === 0 ? (
            <p className="text-gray-400">No classes found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shownClasses.map(room => {
                const students = studentsCount(room);
                const full = room.limit ? students >= room.limit : false;
                const isMember = room.memberIds.includes(currentUid || '');
                return (
                  <div key={room.id} className="bg-gray-800 rounded shadow p-4 space-y-2">
                    {room.bannerUrl && (
                      <img
                        src={room.bannerUrl}
                        alt={room.name}
                        className="w-full h-28 object-cover rounded"
                      />
                    )}
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-300">{room.subject}</p>
                    <p className="text-xs text-gray-400">Teacher: {room.teacherName}</p>
                    <p className="text-xs text-gray-500">
                      {students} / {room.limit ?? '∞'} students
                    </p>
                    {!isMember && !full ? (
                      <button
                        className="w-full py-1 rounded bg-blue-600 hover:bg-blue-700 cursor-pointer text-sm"
                        onClick={() => copyClassCode(room.code)}
                      >
                        Copy Code
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {isMember ? 'Enrolled' : 'Full'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        {tab === 'people' &&
          (shownPeople.length === 0 ? (
            <p className="text-gray-400">No people found.</p>
          ) : (
            <div className="flex flex-col space-y-2">
              {shownPeople.map(user => (
                <div key={user.uid} className="bg-gray-800 rounded p-2 flex items-center space-x-4">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-sm">
                        {initials(user.username || user.displayName || user.email)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-sm">
                    {user.username ||
                      user.displayName ||
                      (user.email ? user.email.split('@')[0] : user.uid)}
                  </span>
                  <FaUserPlus
                    className="text-red-500 cursor-pointer ml-auto"
                    size={18}
                    onClick={() => sendFriend(user.uid)}
                  />
                </div>
              ))}
            </div>
          ))}

        {copyMsg && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
            {copyMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;