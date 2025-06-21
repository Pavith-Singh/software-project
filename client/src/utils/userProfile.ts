import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { User } from 'firebase/auth';

export const syncUserProfile = async (u: User | null) => {
  if (!u) return;
  await setDoc(
    doc(db, 'users', u.uid),
    {
      displayName: u.displayName || '',
      photoURL: u.photoURL || '',
      email: u.email || '',
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};