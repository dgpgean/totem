export type LayoutId = 'strip' | 'grid' | 'polaroid' | 'signature' | 'instagram';

export interface LayoutConfig {
  id: LayoutId;
  name: string;
  description: string;
  photoCount: number;
  aspectRatio: number; // width / height
}

export interface EventConfig {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  backgroundUrl: string | null;
  // New fields for Instagram specific assets
  instagramProfileImage: string | null;
  instagramFooterImages: string[]; // Expecting 3 images
  instagramHeader?: string; // Custom header text
  layoutId: LayoutId;
  deviceId: string;
  primaryColor: string;
}

export interface PhotoData {
  id: string;
  dataUrl: string;
}

export enum AppState {
  SETUP = 'SETUP',
  START = 'START',
  CAPTURE = 'CAPTURE',
  DRAWING = 'DRAWING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}