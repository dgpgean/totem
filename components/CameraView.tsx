
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  deviceId: string;
  onPhotoTaken: (dataUrl: string) => void;
  countNeeded: number;
  countTaken: number;
}

export const CameraView: React.FC<CameraViewProps> = ({ deviceId, onPhotoTaken, countNeeded, countTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [streamError, setStreamError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // No mobile, se passamos deviceId, não devemos passar facingMode 'user' obrigatoriamente
        const constraints: MediaStreamConstraints = {
          video: deviceId 
            ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamError('');
      } catch (err: any) {
        console.error("Camera Error:", err);
        // Tentar fallback se falhar com restrições exatas
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
          setStreamError('');
        } catch (retryErr) {
          setStreamError('Erro ao acessar a câmera. Verifique as permissões de vídeo no navegador.');
        }
      }
    };

    if (!previewUrl) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId, previewUrl]);

  const capturePhoto = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      takeSnap();
      setCountdown(null);
    }
  }, [countdown]);

  const takeSnap = () => {
    if (!videoRef.current) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Espelhar apenas se for a câmera frontal (estimado)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(videoRef.current, 0, 0);
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onPhotoTaken(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center rounded-2xl shadow-2xl">
      {previewUrl ? (
        <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-300">
           <img src={previewUrl} className="w-full h-full object-cover" alt="Captured" />
           <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-12 backdrop-blur-sm">
              <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">Ficou boa?</h2>
              
              <div className="flex gap-8 w-full max-w-2xl px-6">
                 <button 
                   onClick={handleRetake}
                   className="flex-1 bg-amber-500 hover:bg-amber-400 text-white py-8 rounded-3xl font-black text-3xl flex flex-col items-center gap-4 transition-all active:scale-95 shadow-2xl"
                 >
                   <RefreshCw className="w-16 h-16" />
                   REPETIR
                 </button>
                 
                 <button 
                   onClick={handleConfirm}
                   className="flex-1 bg-green-600 hover:bg-green-500 text-white py-8 rounded-3xl font-black text-3xl flex flex-col items-center gap-4 transition-all active:scale-95 shadow-2xl"
                 >
                   <Check className="w-16 h-16" />
                   OK!
                 </button>
              </div>
           </div>
        </div>
      ) : (
        <>
          {streamError ? (
            <div className="text-white p-8 text-center flex flex-col items-center gap-4">
                <AlertCircle className="w-20 h-20 text-red-500" />
                <p className="text-2xl font-bold">{streamError}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-white text-black rounded-full font-bold">Tentar Novamente</button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="h-full w-full object-cover transform -scale-x-100" 
            />
          )}

          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
              <span className="text-9xl font-black text-white animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {countdown === null && !streamError && (
            <div className="absolute bottom-10 z-20 flex flex-col items-center">
                <button 
                    onClick={capturePhoto}
                    className="w-28 h-28 rounded-full border-8 border-white bg-red-600 hover:bg-red-700 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center group"
                >
                    <Camera className="w-12 h-12 text-white group-hover:animate-bounce" />
                </button>
                <p className="text-white text-center mt-6 font-black drop-shadow-md text-3xl uppercase tracking-widest">
                    SORRIA!
                </p>
            </div>
          )}
        </>
      )}

      {!previewUrl && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 px-8 py-3 rounded-full text-white font-black text-2xl backdrop-blur-md border border-white/20">
          FOTO {countTaken + 1} DE {countNeeded}
        </div>
      )}

      {flash && (
        <div className="absolute inset-0 bg-white z-50 animate-pulse" />
      )}
    </div>
  );
};
