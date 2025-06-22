import React, { useEffect, useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { FaUserPlus } from 'react-icons/fa';
import Sidebar from '../components/Nav/Sidebar';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const API_BASE = 'http://localhost:9000';

interface UserProfile {
  uid: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface FriendRequest {
  id: number;
  requester_uid: string;
  requested_uid: string;
  status: 'pending' | 'accepted' | 'rejected';
}

function Social() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'find'|'requests'|'friends'>('find');
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingTargets, setPendingTargets] = useState<string[]>([]);

  const fetchAllUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...(doc.data() as Omit<UserProfile, 'uid'>)
      }));
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, user => {
      setCurrentUid(user?.uid || null);
    });
  }, []);

  const fetchFriends = (uid: string) => {
    fetch(`${API_BASE}/friends/${uid}`)
      .then(res => res.json())
      .then(data => setFriends(data.friends as string[]))
      .then(fetchAllUsers) 
      .catch(console.error);
  };

  useEffect(() => {
    if (activeTab === 'requests' && currentUid) {
      fetch(`${API_BASE}/friend-requests/${currentUid}`)
        .then(res => res.json())
        .then(data => {
          const { sent, received } = data as { sent: FriendRequest[]; received: FriendRequest[] };
          setFriendRequests([...sent, ...received].filter(r => r.status === 'pending'));
          setPendingTargets(sent.filter(r => r.status === 'pending').map(r => r.requested_uid));
        })
        .catch(console.error);
    }
    if (activeTab === 'friends' && currentUid) {
      fetchFriends(currentUid);
    }
  }, [activeTab, currentUid]);

  const sendRequest = (targetUid: string) => {
    if (!currentUid) return;
    fetch(`${API_BASE}/friend-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_uid: currentUid, requested_uid: targetUid })
    })
      .then(() => alert('Request sent'))
      .then(() => setPendingTargets(prev => [...prev, targetUid]))
      .catch(console.error);
  };

  const respondRequest = (id: number, status: 'accepted'|'rejected') => {
    fetch(`${API_BASE}/friend-request/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(() => setFriendRequests(prev => prev.filter(r => r.id !== id)))
      .then(() => {
        if (status === 'accepted' && currentUid) fetchFriends(currentUid);
      })
      .catch(console.error);
  };

  const getInitials = (name?: string): string => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  };

  const fuse = useMemo(() => new Fuse(users, {
    keys: ['username','displayName','uid'],
    threshold: 0.4
  }), [users]);

  const filteredUsers = (searchTerm
    ? fuse.search(searchTerm).map(r => r.item)
    : users
  ).filter(u => u.uid !== currentUid);

  const resolveName = (uid: string): string => {
    const prof = users.find(u => u.uid === uid);
    if (!prof) return uid;
    return prof.username || prof.displayName || (prof.email ? prof.email.split('@')[0] : uid);
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-gray-900">
        <Sidebar />
        <div className="ml-16 flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-gray-900">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-900 text-white p-6 overflow-y-auto">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded cursor-pointer ${activeTab==='find'?'bg-red-500 text-white':'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveTab('find')}
          >Find Friends</button>
          <button
            className={`px-4 py-2 rounded cursor-pointer ${activeTab==='requests'?'bg-red-500 text-white':'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveTab('requests')}
          >Friend Requests</button>
          <button
            className={`px-4 py-2 rounded cursor-pointer ${activeTab==='friends'?'bg-red-500 text-white':'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveTab('friends')}
          >Friends</button>
        </div>

        {activeTab==='find' && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search Friends"
                className="w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              {filteredUsers.map(user => (
                <div key={user.uid} className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    : <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-white text-sm">{getInitials(user.username||user.displayName||user.email||user.uid)}</span>
                      </div>}
                  <span className="font-medium text-sm">
                    {user.username||user.displayName||(user.email?user.email.split('@')[0]:user.uid)||user.uid}
                  </span>
                  {!friends.includes(user.uid) && !pendingTargets.includes(user.uid) ? (
                    <FaUserPlus
                      className="text-red-500 cursor-pointer ml-auto"
                      size={18}
                      onClick={() => sendRequest(user.uid)}
                    />
                  ) : (
                    <span className="ml-auto text-xs text-gray-400">
                      {friends.includes(user.uid) ? 'Friend' : 'Pending'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab==='requests' && (
          <div className="space-y-2">
            {friendRequests.map(r => (
              <div key={r.id} className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4">
                <span className="text-sm">
                  {r.requester_uid === currentUid ? 'To:' : 'From:'}{' '}
                  {resolveName(r.requester_uid === currentUid ? r.requested_uid : r.requester_uid)}
                </span>
                {r.status==='pending' && r.requested_uid===currentUid && (
                  <>
                    <button className="ml-auto px-2 py-1 bg-green-600 rounded cursor-pointer" onClick={() => respondRequest(r.id,'accepted')}>Accept</button>
                    <button className="px-2 py-1 bg-red-600 rounded cursor-pointer" onClick={() => respondRequest(r.id,'rejected')}>Reject</button>
                  </>
                )}
                {r.status!=='pending' && (
                  <span className="ml-auto text-sm">{r.status}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab==='friends' && (
          <div className="space-y-2">
            {friends.map(uid => {
              const prof = users.find(u => u.uid === uid);
              return (
                <div key={uid} className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4">
                  {prof?.photoURL ? (
                    <img src={prof.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-sm">{getInitials(resolveName(uid))}</span>
                    </div>
                  )}
                  <span className="font-medium text-sm">{resolveName(uid)}</span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default Social;