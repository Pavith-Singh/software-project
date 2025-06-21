import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  getDocs,
} from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import { AiOutlinePlus, AiOutlineUserAdd } from 'react-icons/ai';
import Fuse from 'fuse.js';
import { suggestions } from '../components/Nav/Nav';
import { useNavigate } from 'react-router-dom';

type Classroom = {
  id: string;
  name: string;
  description: string;
  subject: string;
  code: string;
  bannerUrl?: string;
  teacherId: string;
  teacherName: string;
  memberIds: string[];
  limit: number | null;
  createdAt?: { seconds: number };
};

const fuse = new Fuse(suggestions, { threshold: 0.4 });

function randomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const Classes: React.FC = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectMatches, setSubjectMatches] = useState<string[]>([]);
  const [seatLimit, setSeatLimit] = useState<number | ''>('');
  const [codeInput, setCodeInput] = useState('');
  const [alert, setAlert] = useState('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, u => setCurrentUser(u)), []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', currentUser.uid));
    return onSnapshot(q, snap => {
      const list: Classroom[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<Classroom, 'id'>) }));
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setClassrooms(list);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!subjectInput) return setSubjectMatches([]);
    setSubjectMatches(fuse.search(subjectInput).map(r => r.item));
  }, [subjectInput]);

  const createClassroom = async () => {
    if (!title.trim() || !subjectInput.trim()) return;
    try {
      let bannerUrl = '';
      if (bannerFile) {
        const fileRef = sRef(
          storage,
          `class_banners/${currentUser?.uid}/${Date.now()}_${bannerFile.name}`
        );
        await uploadBytes(fileRef, bannerFile);
        bannerUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'classes'), {
        name: title.trim(),
        description: summary.trim(),
        subject: subjectInput.trim(),
        bannerUrl,
        code: randomCode(),
        teacherId: currentUser?.uid,
        teacherName: currentUser?.displayName || currentUser?.email || 'Unknown',
        memberIds: [currentUser?.uid],
        limit: seatLimit === '' ? null : Number(seatLimit),
        createdAt: serverTimestamp(),
      });

      setTitle('');
      setSummary('');
      setSubjectInput('');
      setSeatLimit('');
      setBannerFile(null);
      setBannerPreview(null);
      setCreateOpen(false);
    } catch {
      setAlert('Could not create class.');
    }
  };

  const joinClassroom = async () => {
    if (!codeInput.trim() || !currentUser) return;
    try {
      const q = query(collection(db, 'classes'), where('code', '==', codeInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) return setAlert('Class not found.');
      const docRef = snap.docs[0];
      const data = docRef.data() as Classroom;
      const students = data.memberIds.filter(id => id !== data.teacherId).length;
      if (data.limit && students >= data.limit) return setAlert('Class is full.');
      if (data.memberIds.includes(currentUser.uid)) return setAlert('Already enrolled.');
      await updateDoc(doc(db, 'classes', docRef.id), { memberIds: arrayUnion(currentUser.uid) });
      setCodeInput('');
      setJoinOpen(false);
    } catch {
      setAlert('Could not join class.');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full dark">
        <Sidebar />
        <div className="ml-16 flex-1 bg-gray-900 text-gray-100 flex items-center justify-center">
          Please sign in to view your classes.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full dark">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-900 text-gray-100 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">My Classes</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setJoinOpen(true)}
              className="px-4 py-2 flex items-center gap-2 text-sm rounded text-black opacity-75 bg-white  hover:bg-gray-200 hover:opacity-60 cursor-pointer"
            >
              <AiOutlineUserAdd /> Join
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 flex items-center gap-2 text-sm rounded text-black opacity-75 bg-white  hover:bg-gray-200 hover:opacity-60 cursor-pointer"
            >
              <AiOutlinePlus /> 
            </button>
          </div>
        </div>

        {alert && <div className="mb-4 p-3 rounded bg-red-700 text-sm">{alert}</div>}

        {classrooms.length === 0 ? (
          <p>No classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(room => (
              <div
                key={room.id}
                className="bg-gray-800 rounded shadow cursor-pointer hover:ring-2 hover:ring-red-500 transition"
                onClick={() => navigate(`/home/classroom/${room.id}`)}
              >
                {room.bannerUrl && (
                  <img
                    src={room.bannerUrl}
                    alt={room.name}
                    className="w-full h-32 object-cover rounded-t"
                  />
                )}
                <div className="p-4">
                  <h2 className="text-xl font-medium">{room.name}</h2>
                  <p className="text-sm text-gray-300 mb-1">{room.subject}</p>
                  <p className="text-xs text-gray-400">Teacher: {room.teacherName}</p>
                  <p className="text-xs text-gray-500">
                    {room.memberIds.filter(id => id !== room.teacherId).length}{' '}
                    student{room.memberIds.filter(id => id !== room.teacherId).length !== 1 && 's'}
                    {room.limit ? ` / ${room.limit}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {createOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-gray-800 rounded p-6 w-full max-w-md space-y-3">
              <h2 className="text-lg font-semibold">Create New Class</h2>

              <input
                className="w-full bg-gray-700 border px-3 py-2 rounded"
                placeholder="Class Name"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />

              <textarea
                className="w-full bg-gray-700 border px-3 py-2 rounded"
                placeholder="Description"
                value={summary}
                onChange={e => setSummary(e.target.value)}
              />

              <div className="relative">
                <input
                  className="w-full bg-gray-700 border px-3 py-2 rounded"
                  placeholder="Subject..."
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onBlur={() => setTimeout(() => setSubjectMatches([]), 100)}
                  onFocus={() => {
                    if (subjectInput)
                      setSubjectMatches(fuse.search(subjectInput).map(r => r.item));
                  }}
                />
                {subjectMatches.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-700 border rounded max-h-48 overflow-y-auto z-10">
                    {subjectMatches.map(item => (
                      <li
                        key={item}
                        className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-sm"
                        onMouseDown={() => {
                          setSubjectInput(item);
                          setSubjectMatches([]);
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                type="number"
                min={1}
                className="w-full bg-gray-700 border px-3 py-2 rounded"
                placeholder="Student limit (optional)"
                value={seatLimit}
                onChange={e => setSeatLimit(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setBannerFile(file);
                    setBannerPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer p-2 rounded opacity-75 bg-white text-black hover:bg-gray-200 hover:opacity-60"
                >
                  {bannerFile ? 'Change Banner' : 'Upload Banner'}
                </button>
                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="preview"
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setCreateOpen(false);
                    setBannerFile(null);
                    setBannerPreview(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={createClassroom}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {joinOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-gray-800 rounded p-6 w-full max-w-md space-y-4">
              <h2 className="text-lg font-semibold">Join a Class</h2>
              <input
                className="w-full bg-gray-700 border px-3 py-2 rounded"
                placeholder="Class Code"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setJoinOpen(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={joinClassroom}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;