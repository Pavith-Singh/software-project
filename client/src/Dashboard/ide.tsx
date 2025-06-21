// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { Editor } from '@monaco-editor/react';
import { MdFullscreen, MdFullscreenExit, MdDownload, MdPlayArrow, MdLightbulb } from 'react-icons/md';


const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL || '';
const JUDGE0_RAPIDAPI_HOST = import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST || '';
const JUDGE0_RAPIDAPI_KEY = import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
];

const extMap: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  java: 'java',
};

const judge0LangIds: Record<string, number> = {
  c: 50,
  cpp: 54,
  csharp: 51,
  java: 62,
};

function IDE() {
  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [pyodide, setPyodide] = useState<any>(null);
  const [loadingPy, setLoadingPy] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (language === 'python' && !pyodide) {
      setLoadingPy(true);
      (async () => {
        // @ts-ignore
        const pyodideModule = await import(
          'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs'
        );
        const py = await pyodideModule.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
        });
        setPyodide(py);
        setLoadingPy(false);
      })();
    }
  }, [language, pyodide]);

  useEffect(() => {
    setCode('');
    setOutput('');
  }, [language]);

  const runCode = async () => {
    setOutput('');
    if (language === 'python') {
      if (loadingPy || !pyodide) {
        setOutput('Loading Python runtime...');
        return;
      }
      try {
        const wrapped = `import sys\nfrom io import StringIO\nbuf=StringIO()\nsys.stdout=buf\n${code}\nsys.stdout=sys.__stdout__\nbuf.getvalue()`;
        const result = await pyodide.runPythonAsync(wrapped);
        setOutput(String(result));
      } catch (e: any) {
        setOutput(e.toString());
      }
      return;
    }
    if (['javascript', 'typescript'].includes(language)) {
      try {
        const logs: string[] = [];
        const orig = console.log;
        console.log = (...args: any[]) => logs.push(args.join(' '));
        eval(code);
        console.log = orig;
        setOutput(logs.join('\n'));
      } catch (e: any) {
        setOutput(e.message || String(e));
      }
      return;
    }
    if (['c', 'cpp', 'csharp', 'java'].includes(language)) {
      if (!JUDGE0_URL || !JUDGE0_RAPIDAPI_HOST || !JUDGE0_RAPIDAPI_KEY) {
        setOutput(
          'Judge0 API is not configured. Please set VITE_JUDGE0_URL, VITE_JUDGE0_RAPIDAPI_HOST, and VITE_JUDGE0_RAPIDAPI_KEY.'
        );
        return;
      }
      try {
        const resp = await fetch(
          `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Host': JUDGE0_RAPIDAPI_HOST,
              'X-RapidAPI-Key': JUDGE0_RAPIDAPI_KEY,
            },
            body: JSON.stringify({ source_code: code, language_id: judge0LangIds[language] }),
          }
        );
        const text = await resp.text();
        if (!text) throw new Error('Empty response');
        const data = JSON.parse(text);
        setOutput(
          data.stdout || data.stderr || data.compile_output || data.message || ''
        );
      } catch (e: any) {
        setOutput(`Error: ${e.message}`);
      }
      return;
    }
    setOutput(`Run not supported for ${language}`);
  };

  const downloadCode = () => {
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `student_project.${ext}`;
    link.click();
  };

  const fullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };
  useEffect(() => {
    const tab_key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'tab') {
        event.preventDefault();
        fullscreen();
    }
  };
  window.addEventListener('keydown', tab_key);
  return () => {
    window.removeEventListener('keydown', tab_key);
  };
  }, [fullscreen]);

  const suggestCode = async () => {
    if (!OPENAI_API_KEY) {
      setOutput('Missing OpenAI API key');
      return;
    }

    setOutput('Thinking...');
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert coding assistant who can work out issues in existing the users program. Your name is CodeRed and you will always start your response off with CodeRed: {response}',
            },
            {
              role: 'user',
              content: `Here is my code:\n\n${code}\n\nWhat should I do next?`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      const suggestion = data.choices?.[0]?.message?.content;
      setOutput(suggestion || 'No suggestions received.');
    } catch (err: any) {
      setOutput(`AI Error: ${err.message}`);
    }
  };

  return (
    <div ref={containerRef} className="flex w-screen h-screen bg-gray-900 text-gray-100">
      {!isFullscreen && <Sidebar />}
      <div className={`flex flex-col flex-1 p-4 ${!isFullscreen ? 'ml-16' : ''}`}>
        <div className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2">
          <span className="font-bold">student_project.{extMap[language]}</span>
          <div className="flex gap-2 items-center">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-gray-700 text-gray-100 p-1 rounded cursor-pointer"
            >
              {languageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={suggestCode} className="cursor-pointer p-2 rounded opacity-75 bg-yellow-300 text-black hover:bg-yellow-100 hover:opacity-60">
              <MdLightbulb size={24} />
            </button>
            <button onClick={runCode} className="cursor-pointer p-2 rounded opacity-75 bg-white text-black hover:bg-gray-200 hover:opacity-60">
              <MdPlayArrow size={24} />
            </button>
            <button onClick={downloadCode} className="cursor-pointer p-2 rounded opacity-75 bg-white text-black hover:bg-gray-200 hover:opacity-60">
              <MdDownload size={24} />
            </button>
            <button onClick={fullscreen} className="cursor-pointer p-2 rounded opacity-75 bg-white text-black hover:bg-gray-200 hover:opacity-60">
              {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
            </button>
          </div>
        </div>
        <div className="flex flex-1 gap-2">
          <div className="w-2/3 border-gray-700 border rounded overflow-hidden">
            <Editor
              height="90vh"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>
          <div className="w-1/3 bg-gray-800 p-4 rounded overflow-auto">
            <div className="font-bold mb-2">Output</div>
            <pre className="whitespace-pre-wrap font-mono text-sm">{output || ''}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IDE;