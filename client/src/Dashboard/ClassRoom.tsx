import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
doc,
getDoc,
onSnapshot,
updateDoc,
arrayRemove,
collection,
addDoc
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/firebase';
import Sidebar from '../components/Nav/Sidebar';
import { FaTrashAlt } from 'react-icons/fa';
import { IoCopyOutline } from 'react-icons/io5';

interface ClassInfo {
id: string;
name: string;
description: string;
subject: string;
code: string;
teacherId: string;
teacherName: string;
memberIds: string[];
limit: number | null;
bannerUrl?: string;
}

interface StudentInfo {
uid: string;
name: string;
photo: string | null;
}

const ClassRoom: React.FC = () => {
const { id } = useParams<{ id: string }>();
const navigate = useNavigate();
const authUser = getAuth().currentUser;
const storage = getStorage();

if (!authUser) {
  return (
    <div className="flex h-screen w-full dark">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-900 text-gray-100 flex items-center justify-center">
        <p>You must be signed in to view this page.</p>
      </div>
    </div>
  );
}
const uid = authUser.uid;

const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
const [studentList, setStudentList] = useState<StudentInfo[]>([]);
const [copied, setCopied] = useState(false);
const [activities, setActivities] = useState<any[]>([]);

const visibleActivities = activities.filter(act => {
  const sub = (act.submissions as any)?.[uid];
  return !sub || sub.status !== 'complete';
});

const [newActivityTitle, setNewActivityTitle] = useState('');
const [newActivityFile, setNewActivityFile] = useState<File | null>(null);

const newActivityInputRef = useRef<HTMLInputElement>(null);
const submissionInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
if (!id) return;

const unsubscribe = onSnapshot(doc(db, 'classes', id), async (snap) => {
    if (!snap.exists()) return;

    const data = snap.data() as Omit<ClassInfo, 'id'>;
    const info: ClassInfo = { id: snap.id, ...data };
    setClassInfo(info);

    const ids = info.memberIds.filter((uid) => uid !== info.teacherId);
    const students = await Promise.all(
    ids.map(async (uid) => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const user = userDoc.exists() ? userDoc.data() : {};
        const self = uid === authUser?.uid;

        return {
        uid,
        name:
            (user.displayName as string | undefined) ||
            (user.email ? (user.email as string).split('@')[0] : '') ||
            (self ? authUser?.displayName || '' : '') ||
            uid.slice(0, 8),
        photo:
            (user.photoURL as string | undefined) ||
            (self ? authUser?.photoURL || null : null),
        } as StudentInfo;
    })
    );

    students.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    setStudentList(students);
});

return unsubscribe;
}, [id, authUser]);

useEffect(() => {
  if (!id) return;
  const colRef = collection(db, 'classes', id, 'activities');
  const unsubActs = onSnapshot(colRef, snap => {
    const acts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setActivities(acts);
  });
  return () => { unsubActs(); };
}, [id]);

const removeStudent = async (uid: string) => {
if (!classInfo) return;
await updateDoc(doc(db, 'classes', classInfo.id), {
    memberIds: arrayRemove(uid),
});
};

const exitClass = async () => {
if (!classInfo || !authUser) return;

const ref = doc(db, 'classes', classInfo.id);

if (authUser.uid === classInfo.teacherId) {
    await updateDoc(ref, { memberIds: [] });
} else {
    await updateDoc(ref, { memberIds: arrayRemove(authUser.uid) });
}
navigate('/home/classes');
};

const assignActivity = async () => {
  if (!id || !newActivityFile || !newActivityTitle) return;
  const pdfRef = storageRef(storage, `classes/${id}/activities/${Date.now()}_${newActivityFile.name}`);
  await uploadBytes(pdfRef, newActivityFile);
  const pdfUrl = await getDownloadURL(pdfRef);
  await addDoc(collection(db, 'classes', id, 'activities'), {
    title: newActivityTitle,
    pdfUrl,
    createdAt: Date.now(),
    submissions: {} 
  });
  setNewActivityTitle('');
  setNewActivityFile(null);
};

const submitActivity = async (activityId: string, file: File) => {
  if (!id || !authUser) return;
  const subRef = storageRef(storage, `classes/${id}/activities/${activityId}/submissions/${authUser.uid}_${file.name}`);
  await uploadBytes(subRef, file);
  const subUrl = await getDownloadURL(subRef);
  const actDoc = doc(db, 'classes', id, 'activities', activityId);
  await updateDoc(actDoc, {
    [`submissions.${authUser.uid}`]: { pdfUrl: subUrl, status: 'incomplete' }
  });
};

const markStatus = async (activityId: string, studentUid: string, status: 'complete' | 'incomplete') => {
  if (!id) return;
  const actDoc = doc(db, 'classes', id, 'activities', activityId);
  await updateDoc(actDoc, {
    [`submissions.${studentUid}.status`]: status
  });
};

if (!classInfo) {
return (
    <div className="flex h-screen w-full dark">
    <Sidebar />
    <div className="ml-16 flex-1 bg-gray-900 text-gray-100 flex items-center justify-center">
        Loading…
    </div>
    </div>
);
}

return (
<div className="flex h-screen w-full dark">
    <Sidebar />
    <div className="ml-16 flex-1 bg-gray-900 text-gray-100 overflow-y-auto">
    {classInfo.bannerUrl && (
        <div className="relative h-48 w-full">
        <img
            src={classInfo.bannerUrl}
            alt="banner"
            className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center px-6">
            <div>
            <h1 className="text-3xl font-bold">{classInfo.name}</h1>
            <p className="text-gray-300">{classInfo.subject}</p>
            </div>
        </div>
        </div>
    )}

    <div className="p-6 space-y-4">
        {!classInfo.bannerUrl && (
        <div>
            <h1 className="text-3xl font-bold mb-1">{classInfo.name}</h1>
            <p className="text-gray-400">{classInfo.subject}</p>
        </div>
        )}

        {authUser?.uid !== classInfo.teacherId && (
        <p className="text-sm text-gray-400">
            Teacher: {classInfo.teacherName}
        </p>
        )}

        {authUser?.uid === classInfo.teacherId && (
        <div className="flex items-center gap-2">
            <span className="text-sm bg-gray-700 px-3 py-1 rounded">
            Code: {classInfo.code}
            </span>
            <button
            onClick={() => {
                navigator.clipboard.writeText(classInfo.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="p-1 rounded hover:bg-gray-700 cursor-pointer"
            >
            <IoCopyOutline size={18} />
            </button>
            {copied && (
            <span className="text-xs text-green-400">copied!</span>
            )}
        </div>
        )}

        <p>{classInfo.description || 'No description.'}</p>

        <h2 className="text-xl font-medium">
        Students ({studentList.length})
        </h2>

        {studentList.length === 0 ? (
        <p className="text-sm text-gray-400">No students yet.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {studentList.map((s) => (
            <div
                key={s.uid}
                className="bg-gray-800 rounded p-3 flex items-center gap-3"
            >
                <img
                src={
                    s.photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    s.name,
                    )}&background=444&color=fff&size=64`
                }
                alt={s.name}
                className="w-10 h-10 rounded-full object-cover"
                />
                <span className="flex-1 text-sm">
                {s.name}
                {s.uid === authUser?.uid && ' (me)'}
                </span>
                {authUser?.uid === classInfo.teacherId &&
                s.uid !== authUser.uid && (
                    <button
                    onClick={() => removeStudent(s.uid)}
                    className="text-red-500 hover:text-red-300 cursor-pointer"
                    title="Remove"
                    >
                    <FaTrashAlt size={14} />
                    </button>
                )}
            </div>
            ))}
        </div>
        )}

<div className="mt-8 p-4 bg-gray-800 rounded">
    <h2 className="text-xl font-medium mb-2">Activities</h2>
    {authUser?.uid === classInfo.teacherId && (
    <div className="space-y-2 mb-4">
        <input
        type="text"
        placeholder="Activity title"
        value={newActivityTitle}
        onChange={e => setNewActivityTitle(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 text-gray-200"
        />
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={newActivityInputRef}
            onChange={e => setNewActivityFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => newActivityInputRef.current?.click()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white cursor-pointer"
          >
            Choose PDF
          </button>
          {newActivityFile && <span className="text-sm">{newActivityFile.name}</span>}
        </div>
        <button
        onClick={assignActivity}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white cursor-pointer"
        >
        Assign Activity
        </button>
    </div>
    )}
    {visibleActivities.length === 0 ? (
      <p className="text-gray-400">No incomplete or unsubmitted activities.</p>
    ) : (
    visibleActivities.map(act => (
    <div key={act.id} className="mb-4 p-3 bg-gray-900 rounded">
        <h3 className="font-semibold">{act.title}</h3>
        <a href={act.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400">
        Download PDF
        </a>
        {authUser?.uid === classInfo.teacherId ? (
        <div className="mt-2 space-y-1">
            {studentList.map(s => {
            const sub = act.submissions?.[s.uid];
            return (
                <div key={s.uid} className="flex items-center justify-between">
                <span>{s.name}</span>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => markStatus(act.id, s.uid, 'complete')}
                    className="px-2 py-1 bg-green-600 rounded cursor-pointer"
                    >
                    Complete
                    </button>
                    <button
                    onClick={() => markStatus(act.id, s.uid, 'incomplete')}
                    className="px-2 py-1 bg-red-600 rounded cursor-pointer"
                    >
                    Incomplete
                    </button>
                    <span className="ml-2">
                    {sub?.status || 'not submitted'}
                    </span>
                    {sub?.pdfUrl && (
                      <a
                        href={sub.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline ml-2"
                      >
                        View Submission
                      </a>
                    )}
                </div>
                </div>
            );
            })}
        </div>
        ) : (
        <div className="mt-2">
            {act.submissions?.[uid] ? (
            <span>{act.submissions?.[uid]?.status || 'not submitted'}</span>
            ) : (
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={submissionInputRef}
                onChange={e => e.target.files && submitActivity(act.id, e.target.files[0])}
              />
              <button
                onClick={() => submissionInputRef.current?.click()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white cursor-pointer"
              >
                Submit PDF
              </button>
            </div>
            )}
        </div>
        )}
    </div>
    ))
    )}
</div>

        <button
        onClick={exitClass}
        className="mt-6 px-4 py-2 rounded bg-red-600 hover:bg-red-700 cursor-pointer"
        >
        {authUser?.uid === classInfo.teacherId ? 'Delete Class' : 'Leave Class'}
        </button>
    </div>
    </div>
</div>
);
};

export default ClassRoom;