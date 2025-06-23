import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
addDoc,
collection,
onSnapshot,
orderBy,
query,
serverTimestamp,
doc,
getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import { IoSend } from 'react-icons/io5';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';
import { AiOutlinePaperClip } from 'react-icons/ai';

interface UserProfile {
uid: string;
username?: string;
displayName?: string;
email?: string;
photoURL?: string;
}

interface Message {
id: string;
sender: string;
text: string;
createdAt?: { seconds: number };
}

const ChatRoom: React.FC = () => {
const params = useParams<{ type?: string; id?: string }>();
const type = (params.type as 'class' | 'friend') || 'friend';
const id = params.id || '';
if (!params.type || !params.id) {
return (
<div className="flex h-screen bg-gray-900 text-white">
<Sidebar />
<div className="flex flex-1 items-center justify-center">Invalid chat</div>
</div>
);
}
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const bottomRef = useRef<HTMLDivElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const fileRef = useRef<HTMLInputElement>(null);
const auth = getAuth();
const navigate = useNavigate();
const current = auth.currentUser;
const [colRef, setColRef] = useState<ReturnType<typeof collection> | null>(null);

useEffect(() => {
if (!current || !id) return;
const effectiveId =
type === 'friend'
? [current.uid, id].sort().join('_')
: id;
const key = `messages_${type}_${effectiveId}`;
setColRef(collection(db, key));
}, [current, type, id]);

const MAX = 5000;

const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

const [roomTitle, setRoomTitle] = useState<string>(id);
const [roomAvatar, setRoomAvatar] = useState<string | null>(null);

useEffect(() => {
if (!colRef) return;
const q = query(colRef, orderBy('createdAt'));
return onSnapshot(q, snap => {
const list: Message[] = [];
snap.forEach(d =>
list.push({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })
);
setMessages(list);
setTimeout(
() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
50
);
});
}, [colRef]);

useEffect(() => {
const missing = messages
.map(m => m.sender)
.filter(uid => !userMap[uid]);
if (missing.length === 0) return;
missing.forEach(async uid => {
const snap = await getDoc(doc(db, 'users', uid));
if (snap.exists()) {
const data = snap.data() as any;
setUserMap(prev => ({
    ...prev,
    [uid]: {
    uid,
    username: data.username,
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL
    }
}));
}
});
}, [messages, userMap]);

useEffect(() => {
(async () => {
if (!id) return;
if (type === 'class') {
const d = await getDoc(doc(db, 'classes', id));
if (d.exists()) {
    const data = d.data() as any;
    setRoomTitle(data.name || id);
    setRoomAvatar(data.bannerUrl || null);
}
} else {
const d = await getDoc(doc(db, 'users', id));
if (d.exists()) {
    const u = d.data() as any;
    const name =
    u.username ||
    u.displayName ||
    (u.email ? (u.email as string).split('@')[0] : id);
    setRoomTitle(name);
    setRoomAvatar(u.photoURL || null);
}
}
})();
}, [type, id]);

const send = async () => {
if (!current || !input.trim()) return;
if (!colRef) return;
await addDoc(colRef, {
sender: current.uid,
text: input.trim(),
createdAt: serverTimestamp()
});
setInput('');
};

const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file || !current || !colRef) return;

setMessages(prev => [
...prev,
{ id: `tmp-${Date.now()}`, sender: current.uid, text: `Uploading ${file.name} … 0 %` }
]);

const upRef = sRef(
storage,
`uploads/${current.uid}/${roomTitle}/${Date.now()}_${file.name}`
);
const task = uploadBytesResumable(upRef, file);

task.on(
'state_changed',
snap => {
    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
    setMessages(prev => {
    const clone = [...prev];
    clone[clone.length - 1] = {
        ...clone[clone.length - 1],
        text: `Uploading ${file.name} … ${pct} %`
    };
    return clone;
    });
},
console.error,
async () => {
    const url = await getDownloadURL(task.snapshot.ref);
    await addDoc(colRef, {
    sender: current.uid,
    text: `${file.name}\n${url}`,
    createdAt: serverTimestamp()
    });
}
);
};

useLayoutEffect(() => {
const ta = textareaRef.current;
if (!ta) return;
ta.style.height = 'auto';
const maxH = 160;
ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
ta.style.overflowY = ta.scrollHeight > maxH ? 'auto' : 'hidden';
}, [input]);

const resolveName = (uid: string) => {
if (uid === current?.uid) return 'You';
const u = userMap[uid];
return u
? u.username ||
u.displayName ||
(u.email ? (u.email as string).split('@')[0] : uid)
: uid;
};

const resolvePhoto = (uid: string) =>
uid === current?.uid ? current?.photoURL : userMap[uid]?.photoURL || null;

const renderContent = (m: Message) => {
const parts = m.text.split('\n');
if (parts.length === 2 && parts[1].startsWith('http')) {
const [name, url] = parts as [string, string];
if (/\.(pdf)$/i.test(name)) {
    return (
    <>
        <span className="break-words">{name}</span>
        <iframe src={url} className="w-full h-64 mt-2 rounded" title="pdf" />
    </>
    );
}
if (/\.(mp4)$/i.test(name)) {
    return (
    <>
        <span className="break-words">{name}</span>
        <video controls src={url} className="w-full h-48 mt-2 rounded" />
    </>
    );
}
}
return <span className="whitespace-pre-wrap break-words">{m.text}</span>;
};

return (
<div className="flex h-screen bg-gray-900">
<Sidebar />
<div className="flex flex-1 justify-center items-center">
<div className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center">
    <div className="bg-black text-white rounded-2xl px-10 py-8 flex flex-col w-full max-w-5xl h-180">
    <div className="flex items-center gap-3 mb-4">
        <button
        onClick={() => navigate('/home/messages')}
        className="text-white hover:text-gray-300 transition cursor-pointer"
        aria-label="Back to social"
        >
        <IoArrowBack size={22} />
        </button>
        {roomAvatar ? (
        <img src={roomAvatar} className="w-10 h-10 rounded-full object-cover" />
        ) : (
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm">
            {roomTitle.slice(0, 2).toUpperCase()}
        </div>
        )}
        <h1 className="text-lg font-semibold">{roomTitle}</h1>
    </div>

    <div className="flex-1 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 space-y-3 pr-2">
        {messages.map(m => {
        const mine = m.sender === current?.uid;
        const avatar = resolvePhoto(m.sender);
        return (
            <div
            key={m.id}
            className={`flex ${mine ? 'justify-end self-end' : 'self-start'} space-x-2`}
            >
            {!mine && (
                <img
                src={avatar || 'https://via.placeholder.com/32'}
                className="w-8 h-8 rounded-full object-cover self-start"
                />
            )}

            <div className="flex flex-col max-w-[80%]">
                <span className={`text-xs text-gray-400 mb-1 ${mine ? 'text-right' : ''}`}>
                {resolveName(m.sender)}
                </span>
                <div
                    className={`px-4 py-2 rounded-lg ${
                    mine ? 'bg-orange-100 text-gray-700 text-right' : 'bg-gray-700 text-white'
                    }`}
                >
                    {renderContent(m)}
                </div>
            </div>

            {mine && (
                <img
                src={avatar || 'https://via.placeholder.com/32'}
                className="w-8 h-8 rounded-full object-cover self-start"
                />
            )}
            </div>
        );
        })}
        <div ref={bottomRef} />
    </div>

    <form
        onSubmit={e => {
        e.preventDefault();
        send();
        }}
        className="mt-4"
    >
        <div className="flex items-center w-full border border-gray-900 rounded-full bg-black text-white px-4 py-2">
            <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mr-2"
            >
            <AiOutlinePaperClip size={22} className="cursor-pointer" />
            </button>
            <input
            ref={fileRef}
            type="file"
            accept=".pdf,.mp4"
            className="hidden"
            onChange={handleFile}
            />
        <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-[16px] placeholder-gray-500 resize-none h-10"
            placeholder=""
            maxLength={MAX}
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX))}
            onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
            }}
        />
        <button
            type="submit"
            disabled={!input.trim()}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
            <IoSend size={20} />
        </button>
        </div>
    </form>
    </div>
</div>
</div>
</div>
);
};

export default ChatRoom;
