import React, { useEffect, useRef, useState } from 'react';

type CalculatorProps = {
  onClose: () => void;
};

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ x: window.innerWidth - 540, y: window.innerHeight - 480 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        let newX = e.clientX - offset.x;
        let newY = e.clientY - offset.y;

        newX = Math.max(0, Math.min(window.innerWidth - 500, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 420, newY));

        setPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.body.style.userSelect = "";
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const DesmosAPI = (window as any).Desmos;
    let calculator: any = null;
    if (DesmosAPI && calculatorRef.current) {
      calculator = DesmosAPI.ScientificCalculator(calculatorRef.current, {
        keypad: true,
        showMenuBar: false,
      });
    }
    return () => {
      if (calculator) calculator.destroy();
    };
  }, []);

  return (
    <div
      style={{
        left: pos.x,
        top: pos.y,
        width: 500,
        height: 420,
      }}
      className="fixed z-50"
    >
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        className="cursor-move flex items-center justify-between bg-gray-900 rounded-t-xl px-4 py-2 select-none"
        style={{ userSelect: 'none' }}
      >
        <span className="font-semibold text-white">Scientific Calculator</span>
        <button
          className="text-lg cursor-pointer text-blue-500 hover:text-red-500"
          onClick={onClose}
          aria-label="Close Calculator"
        >
          ×
        </button>
      </div>
      <div className="relative bg-gray-900 rounded-b-xl shadow-2xl p-2 w-full h-[372px] flex flex-col border border-gray-200">
        <div ref={calculatorRef} className="flex-1 w-full h-full" />
      </div>
    </div>
  );
};

export default Calculator;