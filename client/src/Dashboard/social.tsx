import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { FaUserPlus, FaTrash } from 'react-icons/fa';
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
  const [activeTab, setActiveTab] = useState<'find' | 'requests' | 'friends'>('find');
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingTargets, setPendingTargets] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchAllUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach(d => list.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, u => setCurrentUid(u?.uid || null));
  }, []);

  const fetchFriends = useCallback((uid: string) => {
    fetch(`${API_BASE}/friends/${uid}`)
      .then(res => res.json())
      .then(data => setFriends(data.friends as string[]))
      .then(fetchAllUsers)
      .catch(console.error);
  }, [fetchAllUsers]);

  useEffect(() => {
    if (activeTab === 'requests' && currentUid) {
      fetch(`${API_BASE}/friend-requests/${currentUid}`)
        .then(res => res.json())
        .then(data => {
          const { sent, received } = data as { sent: FriendRequest[]; received: FriendRequest[] };
          const pending = [...sent, ...received].filter(r => r.status === 'pending');
          setFriendRequests(pending);
          setPendingTargets(
            pending.map(r => (r.requester_uid === currentUid ? r.requested_uid : r.requester_uid))
          );
        })
        .catch(console.error);
    }
    if (activeTab === 'friends' && currentUid) fetchFriends(currentUid);
  }, [activeTab, currentUid, fetchFriends]);

  useEffect(() => {
    if (!currentUid) return;
    // preload pending requests for correct icons on reload
    fetch(`${API_BASE}/friend-requests/${currentUid}`)
      .then(res => res.json())
      .then((data: { sent: FriendRequest[]; received: FriendRequest[] }) => {
        const pending = [...data.sent, ...data.received].filter(r => r.status === 'pending');
        setPendingTargets(pending.map(r => (r.requester_uid === currentUid ? r.requested_uid : r.requester_uid)));
      })
      .catch(console.error);
    // preload friends
    fetchFriends(currentUid);
  }, [currentUid, fetchFriends]);

  const sendRequest = (targetUid: string) => {
    if (!currentUid) return;
    fetch(`${API_BASE}/friend-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_uid: currentUid, requested_uid: targetUid })
    })
      .then(() => {
        setToast('Friend request sent!');
        setPendingTargets(prev => [...prev, targetUid]);
      })
      .catch(console.error);
  };

  const respondRequest = async (id: number, status: 'accepted' | 'rejected') => {
    const req = friendRequests.find(r => r.id === id);
    await fetch(`${API_BASE}/friend-request/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setFriendRequests(prev => prev.filter(r => r.id !== id));
    if (req) {
      const otherUid = req.requester_uid === currentUid ? req.requested_uid : req.requester_uid;
      setPendingTargets(prev => prev.filter(uid => uid !== otherUid));
    }
    if (status === 'accepted' && currentUid) fetchFriends(currentUid);
    setToast(`Request ${status}`);
  };

  const cancelRequest = (id: number) => {
    respondRequest(id, 'rejected');
  };

  const removeFriend = async (uid: string) => {
    if (!currentUid) return;
    try {
      await fetch(`${API_BASE}/friend/${currentUid}/${uid}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f !== uid));
      setToast('Friend removed');
    } catch (err) {
      console.error('Error removing friend:', err);
      setToast('Could not remove friend');
    }
  };

  const getInitials = (name?: string) =>
    name
      ? name
          .split(' ')
          .map(p => p[0]?.toUpperCase())
          .slice(0, 2)
          .join('')
      : '';

  const fuse = useMemo(
    () => new Fuse(users, { keys: ['username', 'displayName', 'uid'], threshold: 0.4 }),
    [users]
  );

  const filteredUsers = (searchTerm ? fuse.search(searchTerm).map(r => r.item) : users).filter(
    u => u.uid !== currentUid
  );

  const resolveName = (uid: string) => {
    const u = users.find(x => x.uid === uid);
    return u
      ? u.username || u.displayName || (u.email ? u.email.split('@')[0] : uid)
      : uid;
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
          {(['find', 'requests', 'friends'] as const).map(k => (
            <button
              key={k}
              className={`px-4 py-2 rounded cursor-pointer ${
                activeTab === k ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setActiveTab(k)}
            >
              {k === 'find' ? 'Find Friends' : k === 'requests' ? 'Friend Requests' : 'Friends'}
            </button>
          ))}
        </div>

        {activeTab === 'find' && (
          <>
            <input
              type="text"
              placeholder="Search Friends"
              className="w-full p-2 mb-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="flex flex-col space-y-2">
              {filteredUsers.map(u => (
                <div
                  key={u.uid}
                  className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4"
                >
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-sm">
                        {getInitials(u.username || u.displayName || u.email || u.uid)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-sm">
                    {u.username ||
                      u.displayName ||
                      (u.email ? u.email.split('@')[0] : u.uid)}
                  </span>
                  {!friends.includes(u.uid) && !pendingTargets.includes(u.uid) ? (
                    <FaUserPlus
                      className="text-red-500 cursor-pointer"
                      size={18}
                      onClick={() => sendRequest(u.uid)}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">
                      {friends.includes(u.uid) ? 'Friend' : 'Pending'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-2">
            {friendRequests.map(r => (
              <div
                key={r.id}
                className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4"
              >
                <span className="text-sm">
                  {r.requester_uid === currentUid ? 'To:' : 'From:'}{' '}
                  {resolveName(
                    r.requester_uid === currentUid ? r.requested_uid : r.requester_uid
                  )}
                </span>
                {r.status === 'pending' && (
                  r.requester_uid === currentUid ? (
                    <button
                      className="ml-auto px-2 py-1 bg-yellow-600 rounded cursor-pointer"
                      onClick={() => cancelRequest(r.id)}
                    >
                      Cancel
                    </button>
                  ) : r.requested_uid === currentUid ? (
                    <>
                      <button
                        className="ml-auto px-2 py-1 bg-green-600 rounded cursor-pointer"
                        onClick={() => respondRequest(r.id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 rounded cursor-pointer"
                        onClick={() => respondRequest(r.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  ) : null
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-2">
            {friends.map(uid => {
              const p = users.find(x => x.uid === uid);
              return (
                <div key={uid} className="bg-gray-800 shadow rounded p-2 flex items-center space-x-4">
                  {p?.photoURL ? (
                    <img src={p.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-sm">{getInitials(resolveName(uid))}</span>
                    </div>
                  )}
                  <span className="font-medium text-sm">{resolveName(uid)}</span>
                  <FaTrash
                    className="ml-auto cursor-pointer text-red-500"
                    size={16}
                    onClick={() => removeFriend(uid)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

export default Social;