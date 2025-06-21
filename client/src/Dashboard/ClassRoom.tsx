import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
doc,
getDoc,
onSnapshot,
updateDoc,
arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Sidebar from '../components/Nav/Sidebar';

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

const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
const [studentList, setStudentList] = useState<StudentInfo[]>([]);
useEffect(() => {
if (!id) return;

const unsubscribe = onSnapshot(doc(db, 'classes', id), async snap => {
    if (!snap.exists()) return;

    const data = snap.data() as Omit<ClassInfo, 'id'>;
    const info: ClassInfo = { id: snap.id, ...data };
    setClassInfo(info);

    const ids = info.memberIds.filter(uid => uid !== info.teacherId);
    const students = await Promise.all(
    ids.map(async uid => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const user = userDoc.exists() ? userDoc.data() : {};

        const isSelf = uid === authUser?.uid;

        return {
        uid,
        name:
            (user.displayName as string | undefined) ||
            (user.email ? (user.email as string).split('@')[0] : '') ||
            (isSelf ? authUser?.displayName || '' : '') ||
            uid.slice(0, 8),
        photo:
            (user.photoURL as string | undefined) ||
            (isSelf ? authUser?.photoURL || null : null),
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
    <div className="ml-16 flex-1 bg-gray-900 text-gray-100 p-6">
    <h1 className="text-3xl font-semibold mb-2">{classInfo.name}</h1>
    <p className="text-gray-400">{classInfo.subject}</p>

    {authUser?.uid !== classInfo.teacherId && (
        <p className="text-sm text-gray-400 mb-1">
        Teacher: {classInfo.teacherName}
        </p>
    )}

    {authUser?.uid === classInfo.teacherId && (
        <p className="text-sm text-gray-400 mb-4">
        Join code: {classInfo.code}
        </p>
    )}

    <p className="mb-4">{classInfo.description || 'No description.'}</p>

    <h2 className="text-xl font-medium mb-2">Students</h2>
    {studentList.length === 0 ? (
        <p className="text-sm text-gray-400">No students yet.</p>
    ) : (
        <ol className="list-decimal list-inside space-y-1">
        {studentList.map(s => (
            <li key={s.uid}>
            <div className="flex items-center gap-2">
                <img
                src={
                    s.photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    s.name
                    )}&background=444&color=fff&size=64`
                }
                alt={s.name}
                className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm text-gray-300">{s.name}</span>
            </div>
            </li>
        ))}
        </ol>
    )}

    <button
        onClick={exitClass}
        className="mt-6 px-4 py-2 rounded bg-red-600 hover:bg-red-700 cursor-pointer"
    >
        {authUser?.uid === classInfo.teacherId ? 'Delete Class' : 'Leave Class'}
    </button>
    </div>
</div>
);
};

export default ClassRoom;