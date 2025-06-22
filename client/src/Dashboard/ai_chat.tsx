import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, storage } from '../firebase/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  orderBy,
  query,
} from 'firebase/firestore';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AiOutlinePaperClip, AiOutlinePlus } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';

type Message = { sender: 'user' | 'ai'; text: string };
type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
type ChatMeta = { id: string; title: string };

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function fetchAIReply(history: ChatMessage[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'gpt-4o', messages: history }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data: { choices: { message: { content: string } }[] } = await response.json();
  return data.choices[0].message.content;
}

function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_LENGTH = 10000;
  const auth = getAuth();
  const navigate = useNavigate();

  const createChat = async () => {
    const u = auth.currentUser;
    if (!u) return;
    const ref = doc(collection(db, 'users', u.uid, 'chats'));
    await setDoc(ref, {
      title: 'New chat',
      messages: [],
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
    setChats(prev => [{ id: ref.id, title: 'New chat' }, ...prev]);
    setChatId(ref.id);
    setMessages([]);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      if (!u) return;
      setUserPhoto(u.photoURL || null);
      const q = query(collection(db, 'users', u.uid, 'chats'), orderBy('lastUpdated', 'desc'));
      const unsubChats = onSnapshot(q, snap => {
        const list: ChatMeta[] = snap.docs.map(d => ({
          id: d.id,
          title: (d.data().title as string) || 'New chat',
        }));
        setChats(list);
        if (!chatId && list.length) loadChat(list[0].id);
      });
      return () => unsubChats();
    });
    return () => unsubAuth();
  }, []);

  const loadChat = async (id: string) => {
    const u = auth.currentUser;
    if (!u) return;
    const d = await getDoc(doc(db, 'users', u.uid, 'chats', id));
    setChatId(id);
    setMessages((d.data()?.messages as Message[]) || []);
  };

  const persist = async (newMsgs: Message[], titleSeed: string) => {
    const u = auth.currentUser;
    if (!u) return;
    if (!chatId) {
      const ref = doc(collection(db, 'users', u.uid, 'chats'));
      await setDoc(ref, {
        title: titleSeed.slice(0, 50),
        messages: newMsgs,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
      setChatId(ref.id);
    } else {
      await updateDoc(doc(db, 'users', u.uid, 'chats', chatId), {
        messages: newMsgs,
        lastUpdated: serverTimestamp(),
      });
    }
  };

  const sendMessage = async (text: string) => {
    const next = [...messages, { sender: 'user', text } as Message];
    setMessages(next);
    persist(next, text);
    const history: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful educational assistant called NSWEduChat. You help students learn by explaining clearly and adapting to their level of understanding. Be encouraging and friendly. Do not use special characters. Help other students, but do not baby them around, just help them learn without doing everything for them.',
      } as ChatMessage,
      ...next.map(
        m =>
          ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          } as ChatMessage)
      ),
    ];
    try {
      const aiText = await fetchAIReply(history);
      const final = [...next, { sender: 'ai', text: aiText } as Message];
      setMessages(final);
      persist(final, text);
    } catch {
      const err = [...next, { sender: 'ai', text: 'Error reaching AI.' } as Message];
      setMessages(err);
      persist(err, text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleSuggestion = (text: string) => sendMessage(text);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const u = auth.currentUser;
    if (!u || !chatId) return;
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Uploading ${file.name}… 0 %` } as Message,
    ]);
    const upRef = sRef(storage, `uploads/${u.uid}/${chatId}/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(upRef, file);
    task.on(
      'state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setMessages(prev => {
          const clone = [...prev];
          clone[clone.length - 1] = {
            sender: 'user',
            text: `Uploading ${file.name}… ${pct} %`,
          } as Message;
          return clone;
        });
      },
      () => {},
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setMessages(prev => {
          const clone = [...prev];
          clone[clone.length - 1] = {
            sender: 'user',
            text: `Uploaded file: ${file.name}`,
          } as Message;
          return clone;
        });
        sendMessage(`${file.name}\n${url}`);
      }
    );
  };

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 160;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  const renderContent = (m: Message) => {
    const parts = m.text.split('\n');
    if (parts.length === 2 && parts[1].startsWith('http')) {
      const [name, url] = parts as [string, string];
      if (/\.pdf$/i.test(name)) {
        return (
          <>
            <span className="break-words">{name}</span>
            <iframe src={url} className="w-full h-64 mt-2 rounded" title="pdf" />
          </>
        );
      }
      if (/\.mp4$/i.test(name)) {
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

  const quickActions = [
    'Rephrase',
    'Make simpler',
    'Summarise',
    'Expand',
    'New topic',
    'Translate to English',
    'Translate to Arabic',
    'Translate to Tamil',
    'Translate to Hindi',
    'Translate to Vietnamese',
    'Translate to Urdu',
    'Translate to Bengali',
    'Translate to Mandarin',
    'Translate to Gujarati',
    'Translate to Japanese',
    'Translate to Samoan',
    'Translate to Korean',
    'Translate to Punjabi',
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="bg-black text-white rounded-2xl px-12 py-10 flex flex-col" style={{ minHeight: 540 }}>
            <div className="flex items-center gap-4 mb-6">
              <img src={userPhoto || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full" />
              <select value={chatId || ''} onChange={e => loadChat(e.target.value)} className="border px-2 py-1 rounded cursor-pointer">
                {chats.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button onClick={createChat} className="bg-[#1769e0] hover:bg-[#1357b3] text-white p-1 rounded">
                <AiOutlinePlus size={18} className="cursor-pointer" />
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.mp4" className="hidden" onChange={handleFile} />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden mb-6">
              {messages.length === 0 ? (
                <>
                  <div className="mb-12">
                    <div className="font-semibold text-[19px] mb-4 text-white">A few tips for a great experience:</div>
                    <ol className="list-decimal list-inside space-y-2 text-[16px] text-white">
                      <li>
                        <span className="font-semibold">Converse naturally:</span> NSWEduChat thrives on full sentences and clear questions.
                      </li>
                      <li>
                        <span className="font-semibold">Avoid ambiguity:</span> Provide details for better responses.
                      </li>
                      <li>
                        <span className="font-semibold">Explore and experiment:</span> Ask follow-up questions or dive deep into topics.
                      </li>
                      <li>
                        <span className="font-semibold">Feedback is gold:</span> Provide feedback or ask how a response was generated.
                      </li>
                    </ol>
                    <div className="mt-6 text-[15px] text-gray-400">If you don’t know where to start, try picking a suggestion from the buttons below.</div>
                  </div>
                  <div className="flex gap-3 mb-10">
                    {[
                      { title: 'Help with a subject', body: 'Hi. I need some help with a specific subject. What do you need to know to help me out?' },
                      { title: 'Prepare an exam', body: 'Hi. I need to prepare for an important exam. What information do you need from me to understand more about it so that you can help me.' },
                      { title: 'Multimodal task', body: 'Hi. I have to do a multimodal assessment task. Explain what it is.' },
                    ].map(({ title, body }) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => handleSuggestion(body)}
                        className="flex-1 bg-[#1769e0] hover:bg-[#1357b3] cursor-pointer text-white rounded-lg px-4 py-3 font-semibold text-[16px] text-left leading-tight"
                        style={{ minWidth: 0 }}
                      >
                        <div className="font-bold">{title}</div>
                        <div className="text-[14px] font-normal leading-snug mt-1 whitespace-nowrap truncate">{body}</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-4 max-h-[350px] overflow-y-auto overflow-x-hidden">
                  {messages.map((m, i) =>
                    m.sender === 'user' ? (
                      <div key={i} className="flex items-end justify-end space-x-2 self-end">
                        <img src={userPhoto || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full" />
                        <div className="max-w-[80%] px-4 py-2 rounded-lg bg-orange-100 text-gray-700 text-right">{renderContent(m)}</div>
                      </div>
                    ) : (
                      <div key={i} className="max-w-[80%] px-4 py-2 rounded-lg bg-gray-700 text-white self-start">{renderContent(m)}</div>
                    )
                  )}
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <div className="mb-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
                <div className="flex gap-4">
                  {quickActions.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleSuggestion(a)}
                      className="bg-[#1769e0] hover:bg-[#1357b3] cursor-pointer text-white rounded-lg px-4 py-2 font-semibold text-[15px] whitespace-nowrap"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-auto">
              <div className="flex items-center w-full border border-gray-900 rounded-lg bg-black text-white px-4 py-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="mr-2">
                  <AiOutlinePaperClip size={22} className="cursor-pointer" />
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.mp4" className="hidden" onChange={handleFile} />
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-[16px] placeholder-gray-500 resize-none h-10"
                  maxLength={MAX_LENGTH}
                  value={input}
                  onChange={e => setInput(e.target.value.slice(0, MAX_LENGTH))}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-[16px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Send
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  Responses may not be accurate. If your query is related to a policy or procedure, use appropriate terms (
                  <a href="https://www.education.nsw.gov.au/" className="underline" target="_blank" rel="noopener noreferrer">
                    see guidelines
                  </a>
                  ).
                </span>
                <span className="tabular-nums">
                  {input.length}/{MAX_LENGTH}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;