
import React, { useEffect, useState } from 'react';
import { Settings, Image as ImageIcon, Save, Upload, Instagram, Wifi, WifiOff, LayoutGrid, FolderHeart, Trash2, Download } from 'lucide-react';
import { EventConfig, LayoutId } from '../types';
import { LAYOUTS } from '../constants';
import { getPhotosByEvent, deleteEventGallery } from '../services/galleryService';

interface SetupScreenProps {
  config: EventConfig;
  onSave: (config: EventConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<EventConfig>(config);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'config' | 'gallery'>('config');
  const [eventPhotos, setEventPhotos] = useState<any[]>([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs.filter(d => d.kind === 'videoinput'));
    });

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
      if (activeTab === 'gallery') {
          loadGallery();
      }
  }, [activeTab, localConfig.eventName]);

  const loadGallery = async () => {
      const photos = await getPhotosByEvent(localConfig.eventName);
      setEventPhotos(photos.reverse());
  };

  const handleDeleteGallery = async () => {
      if (confirm(`Tem certeza que deseja apagar todas as fotos do evento "${localConfig.eventName}"?`)) {
          await deleteEventGallery(localConfig.eventName);
          loadGallery();
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundUrl' | 'instagramProfileImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFooterUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFooterImages = [...(localConfig.instagramFooterImages || [])];
        newFooterImages[index] = reader.result as string;
        setLocalConfig(prev => ({ ...prev, instagramFooterImages: newFooterImages }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isInstagram = localConfig.layoutId === 'instagram';

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans">
      
      {/* Header Fixo */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg">
                  <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                  <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black tracking-tight text-white">Painel de Controle</h1>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {isOnline ? <><Wifi className="w-3 h-3"/> Online</> : <><WifiOff className="w-3 h-3"/> Offline</>}
                      </span>
                  </div>
                  <div className="flex gap-4 mt-2">
                      <button 
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                      >
                        <LayoutGrid className="w-4 h-4" /> Configuração
                      </button>
                      <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                      >
                        <FolderHeart className="w-4 h-4" /> Galeria do Evento
                      </button>
                  </div>
              </div>
          </div>
          <button 
              onClick={() => onSave(localConfig)}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 shadow-xl transition-transform hover:scale-105"
          >
              <Save className="w-6 h-6" />
              Salvar e Iniciar Totem
          </button>
      </header>

      {/* Conteúdo Scrolável */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-6xl mx-auto pb-20">
          
          {activeTab === 'config' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-7 space-y-8">
                {/* 1. Layout */}
                <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                        1. Escolha o Layout
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.values(LAYOUTS).map(layout => (
                            <button
                                key={layout.id}
                                onClick={() => setLocalConfig({...localConfig, layoutId: layout.id as LayoutId})}
                                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${localConfig.layoutId === layout.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}
                            >
                                <div className="w-full aspect-[2/3] rounded border border-dashed border-slate-600 bg-slate-900" />
                                <span className={`text-xs font-bold text-center ${localConfig.layoutId === layout.id ? 'text-indigo-400' : 'text-slate-500'}`}>{layout.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. Detalhes */}
                <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                        2. Detalhes do Evento
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Evento</label>
                            <input type="text" value={localConfig.eventName} onChange={e => setLocalConfig({...localConfig, eventName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Local</label>
                                <input type="text" value={localConfig.eventLocation || ''} onChange={e => setLocalConfig({...localConfig, eventLocation: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Data</label>
                                <input type="text" value={localConfig.eventDate} onChange={e => setLocalConfig({...localConfig, eventDate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Instagram Settings */}
                {isInstagram && (
                    <section className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-3xl p-8 border border-pink-500/30 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 text-pink-400 flex items-center gap-2">
                            <Instagram className="w-6 h-6" /> 3. Configuração Instagram
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Título do Cabeçalho</label>
                                <input type="text" value={localConfig.instagramHeader || ''} onChange={e => setLocalConfig({...localConfig, instagramHeader: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-lg text-white" />
                            </div>
                            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-600 flex-shrink-0 group">
                                    {localConfig.instagramProfileImage ? <img src={localConfig.instagramProfileImage} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 m-auto mt-8 text-slate-500" />}
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'instagramProfileImage')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <h3 className="font-bold text-white text-lg">Foto de Perfil</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[0, 1, 2].map(idx => (
                                    <div key={idx} className="relative aspect-square rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 overflow-hidden hover:border-pink-500 transition-colors">
                                        {localConfig.instagramFooterImages?.[idx] ? <img src={localConfig.instagramFooterImages[idx]} className="w-full h-full object-cover" /> : <Upload className="w-8 h-8 m-auto mt-1/3 text-slate-500" />}
                                        <input type="file" accept="image/*" onChange={(e) => handleFooterUpload(e, idx)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. Hardware */}
                <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 text-indigo-400">4. Hardware</h2>
                    <select value={localConfig.deviceId} onChange={e => setLocalConfig({...localConfig, deviceId: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg">
                        <option value="">Câmera Padrão</option>
                        {devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label || `Câmera ${device.deviceId.slice(0,4)}`}</option>)}
                    </select>
                </section>
                </div>

                <div className="lg:col-span-5 flex flex-col h-full">
                {!isInstagram && (
                    <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl flex-1 flex flex-col sticky top-6">
                        <h2 className="text-xl font-bold mb-6 text-indigo-400">Fundo do Totem</h2>
                        <div className="flex-1 min-h-[400px] relative group w-full bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors">
                            {localConfig.backgroundUrl ? (
                                <div className="relative w-full h-full">
                                    <img src={localConfig.backgroundUrl} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <p className="text-white font-bold">Alterar Imagem</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-600">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Subir Background</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'backgroundUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </section>
                )}
                </div>
            </div>
          ) : (
            /* ABA DE GALERIA */
            <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-white">Galeria: {localConfig.eventName}</h2>
                        <p className="text-slate-400 mt-2">{eventPhotos.length} fotos capturadas neste evento.</p>
                    </div>
                    <button 
                        onClick={handleDeleteGallery}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-red-500/50"
                    >
                        <Trash2 className="w-5 h-5" /> Limpar Galeria do Evento
                    </button>
                </div>

                {eventPhotos.length === 0 ? (
                    <div className="bg-slate-900 rounded-3xl p-20 text-center border border-slate-800 border-dashed">
                        <ImageIcon className="w-20 h-20 mx-auto text-slate-700 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-500">Nenhuma foto ainda</h3>
                        <p className="text-slate-600 mt-2">Inicie o totem para começar a capturar memórias!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {eventPhotos.map((photo, i) => (
                            <div key={photo.id} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-all shadow-lg">
                                <img src={photo.dataUrl} className="w-full aspect-[3/4] object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                    <a 
                                        href={photo.dataUrl} 
                                        download={`foto_${localConfig.eventName.replace(/ /g,'_')}_${i+1}.jpg`}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-xl"
                                    >
                                        <Download className="w-6 h-6" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
