
import { Project, DocType } from './types';

export const DEFAULT_PLACEHOLDERS = [
  { key: 'PROJ_NOM', value: 'Edifici Plurifamiliar', description: 'Nom oficial del projecte' },
  { key: 'PROJ_ADRECA', value: 'Carrer Major, 1', description: 'Ubicació de l\'obra' },
  { key: 'CLIENT_NOM', value: 'Joan Marc', description: 'Nom del promotor' },
  { key: 'ARQUITECTE', value: 'Arquitectura Estudi SLP', description: 'Equip redactor' },
  { key: 'DATA_PROJECTE', value: 'Maig 2024', description: 'Data de l\'edició' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Habitatge Unifamiliar a Palma',
    description: 'Projecte executiu per a un habitatge aïllat amb piscina.',
    isTemplate: false,
    createdAt: new Date().toISOString(),
    placeholders: [...DEFAULT_PLACEHOLDERS],
    chapters: [
      {
        id: 'c1',
        title: '01 Memòria Descriptiva',
        documents: [
          { id: 'd1', title: '01.01 Objecte del projecte', url: 'https://docs.google.com/document/d/1', type: DocType.GOOGLE_DOC },
          { id: 'd2', title: '01.02 Emplaçament i entorn', url: 'https://docs.google.com/document/d/2', type: DocType.GOOGLE_DOC },
        ]
      },
      {
        id: 'c2',
        title: '02 Memòria Constructiva',
        documents: [
          { id: 'd3', title: '02.01 Fonamentació', url: 'https://docs.google.com/document/d/3', type: DocType.GOOGLE_DOC },
          { id: 'd4', title: '02.02 Estructura', url: 'https://docs.google.com/document/d/4', type: DocType.GOOGLE_DOC },
        ]
      }
    ]
  },
  {
    id: 't1',
    name: 'PLANTILLA: Projecte Bàsic Estàndard',
    description: 'Estructura base per a projectes bàsics segons CTE.',
    isTemplate: true,
    createdAt: new Date().toISOString(),
    placeholders: [...DEFAULT_PLACEHOLDERS],
    chapters: [
      {
        id: 'tc1',
        title: 'A. Memòria',
        documents: [
          { id: 'td1', title: 'A.1 Dades Generals', url: 'https://docs.google.com/document/template1', type: DocType.GOOGLE_DOC },
        ]
      }
    ]
  }
];
