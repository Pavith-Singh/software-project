import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { MdDownload } from "react-icons/md";
import { getAuth } from 'firebase/auth';


declare global {
  interface Window {
    Desmos: any;
  }
}

function GraphingCalculator() {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const desmosCalc = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (window.Desmos && calculatorRef.current) {
      const calculator = window.Desmos.GraphingCalculator(calculatorRef.current, {
        expressions: true,
        keypad: true,
      });
      desmosCalc.current = calculator;

      const auth = getAuth();
      const userId = auth.currentUser?.uid ?? 'guest';
      const storageKey = `desmos_state_${userId}`;

      setTimeout(() => {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          try {
            calculator.setState(JSON.parse(savedState));
          } catch (err) {
            console.error('Failed to load Desmos state:', err);
          }
        }
      }, 100);

      calculator.observeEvent('change', () => {
        try {
          const state = calculator.getState();
          localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (err) {
          console.error('Failed to save Desmos state:', err);
        }
      });

      return () => calculator.destroy();
    }
  }, []);

  const screenshot = () => {
    if (desmosCalc.current) {
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      const image = desmosCalc.current.screenshot({ width: 1920, height: 1200 });
      const link = document.createElement('a');
      link.href = image;
      link.download = `StudentWorld_Desmos_${now}.png`;
      link.click();
    }
  };

  const fullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      if (containerRef.current) {
        containerRef.current.requestFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
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

  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <div
        ref={containerRef}
        className="ml-16 flex-1 bg-white relative"
      >
        <button
          onClick={fullscreen}
          className="cursor-pointer absolute bottom-4 right-4 z-10 p-2 rounded opacity-75 bg-black text-white hover:bg-gray-800 hover:opacity-60"
        >
          {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
        </button>
        <button
          onClick={screenshot}
          className="cursor-pointer opacity-75 absolute bottom-4 right-16 z-10 p-2 rounded bg-black text-white hover:bg-gray-800 hover:opacity-60"
        >
          <MdDownload size={24} />
        </button>
        <div
          ref={calculatorRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    </div>
  );
}

export default GraphingCalculator;