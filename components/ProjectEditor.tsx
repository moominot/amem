
import React, { useState, useEffect, useCallback } from 'react';
import { Project, Chapter, DriveDocument, DocType } from '../types';
import { syncProjectData, fetchProjectDetailsFromSheet } from '../services/googleSheets';

interface ProjectEditorProps {
  project: Project;
  updateProject: (p: Project) => void;
  onOpenPlaceholders: () => void;
  onFinalize: () => void;
  accessToken: string | null;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, updateProject, onOpenPlaceholders, onFinalize, accessToken }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // --- AUTO-DESAT ---
  useEffect(() => {
    if (!accessToken) return;
    
    const timeout = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await syncProjectData(accessToken, project);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        setSyncStatus('error');
      }
    }, 2000); // Espera 2 segons d'inactivitat per desar

    return () => clearTimeout(timeout);
  }, [project, accessToken]);

  // --- CARREGA BIDIRECCIONAL (Sincronitza des de Sheets a l'App) ---
  const handleRefreshFromSheets = async () => {
    if (!accessToken) return;
    setSyncStatus('syncing');
    try {
      const remoteData = await fetchProjectDetailsFromSheet(accessToken, project.sheetId!);
      if (remoteData) {
        updateProject({
          ...project,
          chapters: remoteData.chapters.length > 0 ? remoteData.chapters : project.chapters,
          placeholders: remoteData.placeholders.length > 0 ? remoteData.placeholders : project.placeholders
        });
      }
      setSyncStatus('saved');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const cleanTabName = newChapterTitle.toUpperCase().replace(/[\[\]\?\*\/\\\:]/g, '').replace(/\s+/g, '_').substring(0, 30);
    const newChapter: Chapter = { id: `c_${Date.now()}`, title: newChapterTitle, documents: [], sheetTabName: cleanTabName };
    updateProject({ ...project, chapters: [...project.chapters, newChapter] });
    setNewChapterTitle('');
    setShowChapterForm(false);
  };

  const addDocumentToChapter = (chapterId: string) => {
    const title = window.prompt("Títol del document:");
    const url = window.prompt("URL del document de Google Drive:");
    if (!title || !url) return;

    const newDoc: DriveDocument = {
      id: `d_${Date.now()}`,
      title,
      url,
      type: url.includes('spreadsheets') ? DocType.GOOGLE_SHEET : DocType.GOOGLE_DOC
    };

    const updatedChapters = project.chapters.map(c => 
      c.id === chapterId ? { ...c, documents: [...c.documents, newDoc] } : c
    );
    updateProject({ ...project, chapters: updatedChapters });
  };

  const removeDocument = (chapterId: string, docId: string) => {
    const updatedChapters = project.chapters.map(c => 
      c.id === chapterId ? { ...c, documents: c.documents.filter(d => d.id !== docId) } : c
    );
    updateProject({ ...project, chapters: updatedChapters });
  };

  const deleteChapter = (id: string) => {
    if (window.confirm("Segur que vols esborrar aquest capítol? (No s'esborrarà la pestanya del full de càlcul)")) {
      updateProject({ ...project, chapters: project.chapters.filter(c => c.id !== id) });
    }
  };

  const selectedChapter = project.chapters.find(c => c.id === selectedChapterId);

  return (
    <div className="max-w-5xl mx-auto pb-20 px-2 sm:px-0 animate-in fade-in duration-500">
      {/* Header Projecte */}
      <div className="bg-emerald-900 rounded-[32px] p-8 mb-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
              <i className="fa-solid fa-file-excel text-emerald-400 text-3xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : syncStatus === 'saved' ? 'bg-green-500' : 'bg-emerald-500'}`}>
                  {syncStatus === 'syncing' ? 'Sincronitzant...' : syncStatus === 'saved' ? 'Desat a Sheets' : 'Sincro Activa'}
                </span>
                <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              </div>
              <p className="text-xs text-emerald-300/70 font-mono">ID: {project.sheetId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefreshFromSheets} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Sincronitza canvis fets manualment a Sheets">
              <i className="fa-solid fa-rotate"></i>
            </button>
            <a href={`https://docs.google.com/spreadsheets/d/${project.sheetId}`} target="_blank" className="px-6 py-3 bg-white text-emerald-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2">
              <i className="fa-solid fa-external-link"></i> OBRIR SHEETS
            </a>
          </div>
        </div>
      </div>

      {/* Toolbar */}
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
              <span className="text-xs font-bold text-gray-700 uppercase">EXPORTAR</span>
            </div>
          </button>
        </div>
        <button onClick={() => setShowChapterForm(true)} className="px-6 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Nou Capítol
        </button>
      </div>

      {/* Modal / Editor de Documents d'un Capítol */}
      {selectedChapterId && selectedChapter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Editor de Capítol</span>
                <h3 className="text-xl font-black text-gray-900">{selectedChapter.title}</h3>
              </div>
              <button onClick={() => setSelectedChapterId(null)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Documents vinculats ({selectedChapter.documents.length})</h4>
                <button onClick={() => addDocumentToChapter(selectedChapter.id)} className="text-xs font-bold text-emerald-600 hover:underline">+ Afegir Document</button>
              </div>
              
              {selectedChapter.documents.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-gray-400 text-sm">Aquest capítol encara no té documents.</p>
                </div>
              ) : (
                selectedChapter.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.type === DocType.GOOGLE_DOC ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <i className={`fa-solid ${doc.type === DocType.GOOGLE_DOC ? 'fa-file-lines' : 'fa-file-excel'}`}></i>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{doc.title}</p>
                        <a href={doc.url} target="_blank" className="text-[10px] text-gray-400 hover:text-emerald-600 truncate block max-w-xs">{doc.url}</a>
                      </div>
                    </div>
                    <button onClick={() => removeDocument(selectedChapter.id, doc.id)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white transition-all"><i className="fa-solid fa-trash"></i></button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button onClick={() => deleteChapter(selectedChapter.id)} className="text-xs font-bold text-red-400 hover:text-red-600">Esborrar Capítol</button>
              <button onClick={() => setSelectedChapterId(null)} className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Fet</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulari Nou Capítol */}
      {showChapterForm && (
        <div className="bg-white border-2 border-black rounded-3xl p-6 mb-8 shadow-2xl animate-in zoom-in duration-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Nom del nou capítol</h3>
          <form onSubmit={handleAddChapter} className="flex gap-3">
            <input type="text" value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} placeholder="Ex: 01 Memòria Descriptiva" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-bold text-gray-700" autoFocus />
            <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all">Afegir</button>
            <button type="button" onClick={() => setShowChapterForm(false)} className="px-4 text-gray-400 hover:text-black transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
          </form>
        </div>
      )}

      {/* Grid de Capítols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.chapters.length === 0 ? (
          <div className="lg:col-span-3 bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-24 text-center">
            <i className="fa-solid fa-sheet-plastic text-gray-100 text-6xl mb-6"></i>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Encara no has definit capítols</p>
          </div>
        ) : (
          project.chapters.map((chapter) => (
            <div key={chapter.id} className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-500 transition-all group relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <i className="fa-solid fa-table-cells"></i>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-black text-gray-300 uppercase">Pestanya Sheet</span>
                    <span className="text-[10px] font-bold text-emerald-600">{chapter.sheetTabName}</span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-900 transition-colors mb-2">{chapter.title}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6 font-black">{chapter.documents.length} Documents</p>
              </div>
              <button 
                onClick={() => setSelectedChapterId(chapter.id)} 
                className="w-full py-3 bg-gray-50 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Gestiona Contingut
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
