import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword, 
  sendEmailVerification, 
  signInWithPopup, 
  UserCredential 
} from 'firebase/auth';

export const doCreateUserWithEmailAndPassword = (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result;
};

export const doSignOut = (): Promise<void> => {
  return auth.signOut();
};

export const doPasswordReset = (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

export const doPasswordUpdate = (password: string): Promise<void> => {
  if (!auth.currentUser) {
    return Promise.reject(new Error("No current user"));
  }
  return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = (): Promise<void> => {
  if (!auth.currentUser) {
    return Promise.reject(new Error("No current user"));
  }
  return sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/home` });
};