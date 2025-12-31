
import React, { useState } from 'react';
import { Project, Chapter } from '../types';
import { syncProjectData } from '../services/googleSheets';

interface ProjectEditorProps {
  project: Project;
  updateProject: (p: Project) => void;
  onOpenPlaceholders: () => void;
  onFinalize: () => void;
  accessToken: string | null;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, updateProject, onOpenPlaceholders, onFinalize, accessToken }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const handleSync = async () => {
    if (!accessToken) {
      alert("Necessites connectar el teu compte de Google primer.");
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Creant pestanyes...');
    try {
      await syncProjectData(accessToken, project);
      setSyncStatus('Dades actualitzades!');
      setTimeout(() => setSyncStatus(''), 2000);
    } catch (e) {
      alert("Error en la sincronització: " + e);
      setSyncStatus('Error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    
    // Netejar el nom per a que sigui vàlid com a pestanya d'Excel (sense caràcters prohibits i max 31 caràcters)
    const cleanTabName = newChapterTitle
      .toUpperCase()
      .replace(/[\[\]\?\*\/\\\:]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const newChapter: Chapter = {
      id: `c_${Date.now()}`,
      title: newChapterTitle,
      documents: [],
      sheetTabName: cleanTabName
    };
    
    updateProject({ ...project, chapters: [...project.chapters, newChapter] });
    setNewChapterTitle('');
    setShowChapterForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-2 sm:px-0 animate-in fade-in duration-500">
      <div className="bg-emerald-900 rounded-[32px] p-8 mb-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
              <i className="fa-solid fa-file-excel text-emerald-400 text-3xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">Sincronització Activa</span>
                <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              </div>
              <p className="text-xs text-emerald-300/70 font-mono">ID Full: {project.sheetId}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <a 
                href={`https://docs.google.com/spreadsheets/d/${project.sheetId}`} 
                target="_blank" 
                className="px-6 py-3 bg-white text-emerald-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-external-link"></i> OBRIR SHEETS
              </a>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                {isSyncing ? 'SINCRONITZANT...' : 'SINCRO ARA'}
              </button>
            </div>
            {syncStatus && <span className="text-[10px] font-black uppercase text-emerald-400 animate-pulse">{syncStatus}</span>}
          </div>
        </div>
        <i className="fa-solid fa-table-cells absolute -right-10 -bottom-10 text-[200px] text-white/5 rotate-12 pointer-events-none"></i>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-6">
          <button onClick={onOpenPlaceholders} className="flex items-center gap-3 group text-left">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-all">
               <i className="fa-solid fa-sliders text-sm"></i>
            </div>
            <div className="hidden sm:block">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pestanya</span>
              <span className="text-xs font-bold text-gray-700 uppercase">CONFIG</span>
            </div>
          </button>
          <div className="w-px h-10 bg-gray-200"></div>
          <button onClick={onFinalize} className="flex items-center gap-3 group text-left">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-all">
               <i className="fa-solid fa-file-pdf text-sm"></i>
            </div>
            <div className="hidden sm:block">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Sortida</span>
              <span className="text-xs font-bold text-gray-700 uppercase">EXPORTAR PDF</span>
            </div>
          </button>
        </div>
        <button 
          onClick={() => setShowChapterForm(true)}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Nou Capítol (Pestanya)
        </button>
      </div>

      {showChapterForm && (
        <div className="bg-white border-2 border-black rounded-3xl p-6 mb-8 shadow-2xl animate-in zoom-in duration-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Nom del nou capítol</h3>
          <form onSubmit={handleAddChapter} className="flex gap-3">
            <input 
              type="text" 
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Ex: 01 Memòria Descriptiva"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-bold text-gray-700"
              autoFocus
            />
            <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all">Afegir</button>
            <button type="button" onClick={() => setShowChapterForm(false)} className="px-4 text-gray-400 hover:text-black transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
          </form>
          <p className="mt-3 text-[10px] text-gray-400 italic">Es crearà una nova pestanya al full de càlcul quan facis clic a 'SINCRO'.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.chapters.length === 0 ? (
          <div className="lg:col-span-3 bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-24 text-center">
            <i className="fa-solid fa-sheet-plastic text-gray-100 text-6xl mb-6"></i>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Encara no has definit capítols per a aquest projecte</p>
          </div>
        ) : (
          project.chapters.map((chapter) => (
            <div key={chapter.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-500 transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <i className="fa-solid fa-table-cells"></i>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black text-gray-300 uppercase">Pestanya Sheet</span>
                  <span className="text-[10px] font-bold text-emerald-600">{chapter.sheetTabName}</span>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-900 transition-colors mb-4">{chapter.title}</h3>
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{chapter.documents.length} Fitxers</span>
                <button className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100">Gestionar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
