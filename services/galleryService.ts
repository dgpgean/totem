
import { PhotoData, EventConfig } from '../types';

const DB_NAME = 'TotemGeniusDB';
const STORE_PHOTOS = 'EventPhotos';
const STORE_CONFIG = 'AppConfig';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Versão 2 para incluir Config
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const store = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('eventName', 'eventName', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePhotoToGallery = async (eventName: string, dataUrl: string) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = transaction.objectStore(STORE_PHOTOS);
    const photoEntry = {
      eventName,
      dataUrl,
      timestamp: new Date().toISOString()
    };
    const request = store.add(photoEntry);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const getPhotosByEvent = async (eventName: string): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PHOTOS, 'readonly');
    const store = transaction.objectStore(STORE_PHOTOS);
    const index = store.index('eventName');
    const request = index.getAll(eventName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteEventGallery = async (eventName: string) => {
  const db = await openDB();
  const photos = await getPhotosByEvent(eventName);
  const transaction = db.transaction(STORE_PHOTOS, 'readwrite');
  const store = transaction.objectStore(STORE_PHOTOS);
  photos.forEach(p => store.delete(p.id));
};

// --- CONFIGURATION PERSISTENCE ---

export const saveConfig = async (config: EventConfig) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CONFIG, 'readwrite');
    const store = transaction.objectStore(STORE_CONFIG);
    const request = store.put({ id: 'current_config', ...config });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const loadConfig = async (): Promise<EventConfig | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CONFIG, 'readonly');
    const store = transaction.objectStore(STORE_CONFIG);
    const request = store.get('current_config');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};
