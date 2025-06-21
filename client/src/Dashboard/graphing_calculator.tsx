import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { MdFullscreen, MdFullscreenExit, MdDownload } from "react-icons/md";
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
        settingsMenu: false,
        invertedColors: true,
      });
      desmosCalc.current = calculator;

      const auth = getAuth();
      const userId = auth.currentUser?.uid ?? 'guest';
      const storageKey = `desmos_state_${userId}`;

      setTimeout(() => {
        // 🔧 FIX: prevent Desmos canvas from blocking top-left clicks
        const bgCanvas = calculatorRef.current?.querySelector('#bg') as HTMLCanvasElement;
        if (bgCanvas) {
          bgCanvas.style.pointerEvents = 'none';
        }

        // Load saved state
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          try {
            calculator.setState(JSON.parse(savedState));
          } catch (err) {
            console.error('Failed to load Desmos state:', err);
          }
        }
      }, 200);

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
    if (!desmosCalc.current) return;

    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const img = new Image();
    img.src = desmosCalc.current.screenshot({ width: 1920, height: 1200 });

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];         // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
      }

      ctx.putImageData(imageData, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `StudentWorld_Desmos_${now}_inverted.png`;
      link.click();
    };
  };

  const fullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
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
  }, [isFullscreen]);

  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <div
        ref={containerRef}
        className="ml-16 flex-1 bg-gray-900 relative"
      >
        <button
          onClick={fullscreen}
          className="cursor-pointer absolute bottom-4 right-4 z-10 p-2 rounded opacity-75 bg-white text-black hover:bg-gray-200 hover:opacity-60"
        >
          {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
        </button>
        <button
          onClick={screenshot}
          className="cursor-pointer opacity-75 absolute bottom-4 right-16 z-10 p-2 rounded bg-white text-black hover:bg-gray-200 hover:opacity-60"
        >
          <MdDownload size={24} />
        </button>
        <div
          ref={calculatorRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ pointerEvents: 'auto' }}
        />
      </div>
    </div>
  );
}

export default GraphingCalculator;