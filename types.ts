
export enum DocType {
  GOOGLE_DOC = 'DOC',
  GOOGLE_SHEET = 'SHEET',
  PDF = 'PDF',
  OTHER = 'OTHER'
}

export interface DriveDocument {
  id: string;
  title: string;
  url: string;
  type: DocType;
}

export interface Chapter {
  id: string;
  title: string;
  documents: DriveDocument[];
  sheetTabName?: string; // Nom de la pestanya vinculada al full de càlcul
}

export interface Placeholder {
  key: string;
  value: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[];
  placeholders: Placeholder[];
  isTemplate: boolean;
  createdAt: string;
  sheetId?: string; // ID del full de càlcul específic del projecte
}

export interface AppSettings {
  masterSheetId?: string;
  lastSync?: string;
}

export type AppView = 'DASHBOARD' | 'PROJECT_EDITOR' | 'PLACEHOLDER_EDITOR' | 'TEMPLATE_LIBRARY' | 'EXPORT_VIEW' | 'SETTINGS';
