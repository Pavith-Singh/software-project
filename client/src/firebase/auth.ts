import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { syncUserProfile } from '../utils/userProfile';

export const doCreateUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await syncUserProfile(cred.user);
  return cred;
};

export const doSignInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await syncUserProfile(cred.user);
  return cred;
};

export const doSignInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await syncUserProfile(cred.user);
  return cred;
};

export const doSignOut = (): Promise<void> => auth.signOut();

export const doPasswordReset = (email: string): Promise<void> =>
  sendPasswordResetEmail(auth, email);

export const doPasswordUpdate = (password: string): Promise<void> => {
  if (!auth.currentUser) return Promise.reject(new Error('No current user'));
  return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = (): Promise<void> => {
  if (!auth.currentUser) return Promise.reject(new Error('No current user'));
  return sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`,
  });
};