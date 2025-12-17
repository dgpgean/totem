
import { LayoutConfig } from './types';

export const LAYOUTS: Record<string, LayoutConfig> = {
  STRIP: {
    id: 'strip',
    name: 'Tirinha 4 Fotos',
    description: 'Estilo cabine clássica vertical',
    photoCount: 4,
    aspectRatio: 1 / 3, // Very tall
  },
  INSTAGRAM: {
    id: 'instagram',
    name: 'Post Instagram',
    description: '1 Foto Principal + Perfil e Feed fixos',
    photoCount: 1,
    aspectRatio: 9 / 16, // Phone screen
  },
  GRID: {
    id: 'grid',
    name: 'Grade 2x2',
    description: '4 fotos em formato quadrado',
    photoCount: 4,
    aspectRatio: 1, // Square
  },
  POLAROID: {
    id: 'polaroid',
    name: 'Estilo Polaroid',
    description: '1 foto grande com espaço para assinatura',
    photoCount: 1,
    aspectRatio: 3.5 / 4.2, 
  },
  SIGNATURE: {
    id: 'signature',
    name: 'Recado aos Noivos',
    description: 'Foto + Espaço livre para desenhar',
    photoCount: 1,
    aspectRatio: 3.5 / 5, // Vertical card
  }
};

export const DEFAULT_CONFIG = {
  eventName: '',
  eventDate: '',
  eventLocation: '',
  backgroundUrl: null,
  instagramProfileImage: null,
  instagramFooterImages: [],
  instagramHeader: '',
  layoutId: 'instagram', 
  deviceId: '',
  primaryColor: '#6366f1'
};
