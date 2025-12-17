import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Check, Undo, PenTool } from 'lucide-react';

interface DrawingPadProps {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const COLORS = ['#000000', '#ec4899', '#3b82f6', '#eab308', '#ef4444', '#10b981'];

export const DrawingPad: React.FC<DrawingPadProps> = ({ onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set explicit size for high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Prevent scrolling when touching canvas
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
        canvas.removeEventListener('touchstart', preventDefault);
        canvas.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoords(e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoords(e);
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleConfirm = () => {
      if (canvasRef.current) {
          onConfirm(canvasRef.current.toDataURL('image/png'));
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="bg-slate-100 p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PenTool className="w-6 h-6" />
                Deixe sua mensagem
            </h2>
            <div className="flex gap-2">
                <button onClick={clearCanvas} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Undo className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative cursor-crosshair bg-white">
            <canvas 
                ref={canvasRef}
                className="w-full h-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>

        {/* Toolbar */}
        <div className="bg-slate-100 p-4 border-t flex flex-wrap gap-4 items-center justify-between">
            
            {/* Colors */}
            <div className="flex items-center gap-3">
                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 ${color === c ? 'border-slate-800 scale-110 shadow-lg' : 'border-white'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full md:w-auto">
                <button 
                    onClick={onCancel}
                    className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300"
                >
                    Pular
                </button>
                <button 
                    onClick={handleConfirm}
                    className="flex-1 md:flex-none px-8 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                    <Check className="w-6 h-6" />
                    Concluir
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
