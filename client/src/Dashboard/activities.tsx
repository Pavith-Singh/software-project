import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Sidebar from '../components/Nav/Sidebar';

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const authUser = getAuth().currentUser!;
  const uid = authUser.uid;
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const incompleteActivities = activities.filter(act => {
    const sub = (act as any).submissions?.[uid];
    const isNotComplete = !sub || sub.status !== 'complete';
    const isNotAssignedByMe = (act as any).teacherId !== uid;
    return isNotComplete && isNotAssignedByMe;
  });

  useEffect(() => {
    if (!uid) return;
    const classesRef = collection(db, 'classes');
    const classesQuery = query(classesRef, where('memberIds', 'array-contains', uid));
    const unsubClasses = onSnapshot(classesQuery, async classSnap => {
      const allActs: any[] = [];
      for (const clsDoc of classSnap.docs) {
        const clsData = clsDoc.data();
        const classId = clsDoc.id;
        const className = (clsData as any).name || 'Class';
        const teacherId = (clsData as any).teacherId;
        const actsSnap = await getDocs(collection(db, 'classes', classId, 'activities'));
        actsSnap.forEach(actDoc => {
          allActs.push({
            classId,
            className,
            teacherId,
            id: actDoc.id,
            ...(actDoc.data() as any)
          });
        });
      }
      setActivities(allActs);
      setLoading(false);
    });
    return () => { unsubClasses(); };
  }, [uid]);

  return (
    <div className="flex h-screen w-full dark">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-900 text-gray-100 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl mb-4">Incomplete Activities</h1>
            {incompleteActivities.length === 0 ? (
              <p className="text-gray-400">No Incomplete or unsubmitted activities 🙂</p>
            ) : (
              <ul className="space-y-4">
                {incompleteActivities.map(act => (
                  <li key={`${act.classId}-${act.id}`}>
                    <button
                      onClick={() => navigate(`/home/classroom/${act.classId}`)}
                      className="w-full text-left px-4 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                    >
                      <div className="font-semibold">{act.title}</div>
                      <div className="text-sm text-gray-400">Class: {act.className}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Activities;