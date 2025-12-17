
import React, { useState, useEffect } from 'react';
import { Settings, Play, Download, RefreshCw, X } from 'lucide-react';
import { EventConfig, AppState, PhotoData } from './types';
import { DEFAULT_CONFIG, LAYOUTS } from './constants';
import { SetupScreen } from './components/SetupScreen';
import { CameraView } from './components/CameraView';
import { DrawingPad } from './components/DrawingPad';
import { createCompositeImage } from './services/canvasService';
import { savePhotoToGallery } from './services/galleryService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => {
    const saved = localStorage.getItem('totem_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawingData, setDrawingData] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('totem_config', JSON.stringify(eventConfig));
  }, [eventConfig]);

  const currentLayout = LAYOUTS[eventConfig.layoutId.toUpperCase()] || LAYOUTS.STRIP;

  const handleStartSession = () => {
    setPhotos([]);
    setFinalImage(null);
    setDrawingData(null);
    setAppState(AppState.CAPTURE);
  };

  const handlePhotoTaken = (dataUrl: string) => {
    const newPhoto: PhotoData = { id: Date.now().toString(), dataUrl };
    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);

    if (updatedPhotos.length >= currentLayout.photoCount) {
      if (currentLayout.id === 'signature' || currentLayout.id === 'instagram') {
          setAppState(AppState.DRAWING);
      } else {
          processResult(updatedPhotos);
      }
    }
  };

  const handleDrawingConfirm = (dataUrl: string) => {
      setDrawingData(dataUrl);
      processResult(photos, dataUrl);
  };

  const handleDrawingSkip = () => {
      setDrawingData(null);
      processResult(photos, null);
  };

  const processResult = async (capturedPhotos: PhotoData[], drawingUrl?: string | null) => {
    setAppState(AppState.PROCESSING);
    setIsProcessing(true);
    try {
      const result = await createCompositeImage(capturedPhotos, currentLayout, eventConfig, drawingUrl);
      
      // SALVAR NA GALERIA DO EVENTO (OFFLINE INDEXEDDB)
      await savePhotoToGallery(eventConfig.eventName, result);
      
      setFinalImage(result);
      setAppState(AppState.RESULT);
    } catch (e) {
      console.error(e);
      alert('Erro ao criar imagem');
      setAppState(AppState.START);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDownloadFilename = () => {
      const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const cleanName = eventConfig.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `totem_${cleanName}_${date}.jpg`;
  };

  if (appState === AppState.SETUP) {
    return (
      <SetupScreen 
        config={eventConfig} 
        onSave={(newConfig) => {
          setEventConfig(newConfig);
          setAppState(AppState.START);
        }} 
      />
    );
  }

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative font-sans">
      {appState === AppState.START && (
        <button 
          onClick={() => setAppState(AppState.SETUP)}
          className="absolute top-4 left-4 z-50 text-white/10 hover:text-white/50 transition-colors p-4"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      {appState === AppState.START && (
        <div className="h-full flex flex-col items-center justify-end pb-24 md:pb-32 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
             {eventConfig.backgroundUrl ? (
               <img src={eventConfig.backgroundUrl} className="w-full h-full object-cover animate-slow-zoom" alt="Event Background" />
             ) : (
               <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-slate-950" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
          </div>

          <div className="z-10 text-center space-y-10 animate-in slide-in-from-bottom-10 fade-in duration-700 px-6 max-w-5xl w-full">
            <div className="space-y-4">
                <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tight leading-none">
                  {eventConfig.eventName}
                </h1>
                <div className="flex items-center justify-center gap-4">
                   <div className="h-[1px] w-12 bg-white/50"></div>
                   <p className="text-xl md:text-2xl text-white/80 font-light tracking-[0.2em] uppercase">Toque para iniciar</p>
                   <div className="h-[1px] w-12 bg-white/50"></div>
                </div>
            </div>
            
            <button 
              onClick={handleStartSession}
              className="group relative inline-flex items-center justify-center p-8 md:p-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <div className="absolute inset-0 rounded-full border border-white/50 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
              <Play className="w-12 h-12 md:w-16 md:h-16 fill-white ml-2" />
            </button>
          </div>
        </div>
      )}

      {appState === AppState.CAPTURE && (
        <div className="h-full w-full flex flex-col bg-slate-950">
           <div className="flex-1 relative overflow-hidden bg-black">
              <CameraView 
                deviceId={eventConfig.deviceId}
                countNeeded={currentLayout.photoCount}
                countTaken={photos.length}
                onPhotoTaken={handlePhotoTaken}
              />
              <button 
                  onClick={() => setAppState(AppState.START)} 
                  className="absolute top-6 right-6 p-4 bg-black/40 text-white rounded-full hover:bg-red-500/80 transition-colors backdrop-blur-md z-50"
              >
                <X className="w-8 h-8" />
              </button>
           </div>
           {currentLayout.photoCount > 1 && (
             <div className="h-32 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 p-4 z-20">
                {Array.from({ length: currentLayout.photoCount }).map((_, i) => (
                   <div key={i} className={`relative aspect-[3/4] h-full rounded-xl border-2 overflow-hidden transition-all duration-300 ${i < photos.length ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-slate-700 bg-slate-800/50'}`}>
                      {i < photos.length ? (
                          <img src={photos[i].dataUrl} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xl">{i + 1}</div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </div>
      )}

      {appState === AppState.DRAWING && (
          <DrawingPad 
            onConfirm={handleDrawingConfirm}
            onCancel={handleDrawingSkip}
          />
      )}

      {appState === AppState.PROCESSING && (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 z-50">
          <RefreshCw className="w-24 h-24 text-indigo-400 animate-spin" />
          <h2 className="text-4xl font-bold text-white mt-8 animate-pulse">Processando...</h2>
        </div>
      )}

      {appState === AppState.RESULT && finalImage && (
        <div className="h-full flex flex-col md:flex-row bg-slate-950">
          <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
            <img src={finalImage} alt="Result" className="max-h-full max-w-full object-contain shadow-2xl rounded-sm bg-white" />
          </div>

          <div className="w-full md:w-[400px] bg-slate-900 border-l border-slate-800 p-8 flex flex-col justify-center gap-6 shadow-2xl z-20">
             <div className="text-center mb-4">
                <h3 className="text-3xl font-bold text-white mb-2">Ficou incrível!</h3>
                <p className="text-slate-400">Escaneie ou salve a foto abaixo</p>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-48 h-48 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900" style={{backgroundImage: 'radial-gradient(#000 3px, transparent 3px)', backgroundSize: '18px 18px'}}></div>
             </div>
             <div className="space-y-3 mt-8">
                <a href={finalImage} download={getDownloadFilename()} className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg">
                  <Download className="w-6 h-6" /> Salvar Foto
                </a>
                <button onClick={handleStartSession} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5" /> Tirar Outra
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
