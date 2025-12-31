
import React, { useState, useEffect } from 'react';
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
    if (!accessToken || !project.sheetId) return;
    
    const timeout = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await syncProjectData(accessToken, project);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        console.error(e);
        setSyncStatus('error');
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [project, accessToken]);

  // --- CARREGA DETALLS SI NO N'HI HA ---
  useEffect(() => {
    if (accessToken && project.sheetId && project.chapters.length === 0) {
      handleRefreshFromSheets();
    }
  }, []);

  const handleRefreshFromSheets = async () => {
    if (!accessToken || !project.sheetId) return;
    setSyncStatus('syncing');
    try {
      const remote = await fetchProjectDetailsFromSheet(accessToken, project.sheetId);
      if (remote) {
        updateProject({
          ...project,
          chapters: remote.chapters.length > 0 ? remote.chapters : project.chapters,
          placeholders: remote.placeholders.length > 0 ? remote.placeholders : project.placeholders
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
    const tabName = newChapterTitle.substring(0, 30).toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const newChapter: Chapter = { 
      id: `c_${Date.now()}`, 
      title: newChapterTitle, 
      documents: [], 
      sheetTabName: tabName 
    };
    updateProject({ ...project, chapters: [...project.chapters, newChapter] });
    setNewChapterTitle('');
    setShowChapterForm(false);
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newChapters = [...project.chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    updateProject({ ...project, chapters: newChapters });
  };

  const addDocument = (chapterId: string) => {
    const title = window.prompt("Títol del document:");
    const url = window.prompt("URL de Drive (Google Doc o Sheet):");
    if (!title || !url) return;

    const newDoc: DriveDocument = {
      id: `d_${Date.now()}`,
      title,
      url,
      type: url.includes('spreadsheets') ? DocType.GOOGLE_SHEET : DocType.GOOGLE_DOC
    };

    updateProject({
      ...project,
      chapters: project.chapters.map(c => c.id === chapterId ? { ...c, documents: [...c.documents, newDoc] } : c)
    });
  };

  const removeDoc = (chapterId: string, docId: string) => {
    updateProject({
      ...project,
      chapters: project.chapters.map(c => c.id === chapterId ? { ...c, documents: c.documents.filter(d => d.id !== docId) } : c)
    });
  };

  const deleteChapter = (id: string) => {
    if (confirm("Esborrar aquest capítol de l'estructura?")) {
      updateProject({ ...project, chapters: project.chapters.filter(c => c.id !== id) });
    }
  };

  const selectedChapter = project.chapters.find(c => c.id === selectedChapterId);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* HEADER DINÀMIC */}
      <div className="bg-emerald-900 rounded-[40px] p-10 mb-10 text-white relative shadow-2xl overflow-hidden border-b-4 border-emerald-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 backdrop-blur-xl">
              <i className="fa-solid fa-file-invoice text-emerald-400 text-4xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                   {syncStatus === 'syncing' ? 'Sincronitzant...' : 'Connectat'}
                </span>
                <h2 className="text-3xl font-black tracking-tight">{project.name}</h2>
              </div>
              <p className="text-sm text-emerald-300/60 font-medium">Full de càlcul: {project.sheetId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefreshFromSheets} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all" title="Forçar refresc de Sheets">
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
            <a href={`https://docs.google.com/spreadsheets/d/${project.sheetId}`} target="_blank" className="bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              Obrir Sheets
            </a>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex gap-4">
          <button onClick={onOpenPlaceholders} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-100 hover:border-emerald-500 transition-all shadow-sm group">
            <i className="fa-solid fa-sliders text-gray-400 group-hover:text-emerald-600"></i>
            <span className="text-xs font-black uppercase text-gray-700">Dades Globales</span>
          </button>
          <button onClick={onFinalize} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-100 hover:border-emerald-500 transition-all shadow-sm group">
            <i className="fa-solid fa-file-pdf text-gray-400 group-hover:text-emerald-600"></i>
            <span className="text-xs font-black uppercase text-gray-700">Exportar</span>
          </button>
        </div>
        <button onClick={() => setShowChapterForm(true)} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-3 shadow-lg">
          <i className="fa-solid fa-plus"></i> Nou Capítol
        </button>
      </div>

      {/* FORMULARI NOU CAPÍTOL */}
      {showChapterForm && (
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 mb-10 shadow-2xl animate-in zoom-in duration-200">
          <h3 className="text-xs font-black uppercase text-emerald-600 mb-4 tracking-widest">Estructura de la memòria</h3>
          <form onSubmit={handleAddChapter} className="flex gap-4">
            <input 
              type="text" 
              value={newChapterTitle} 
              onChange={(e) => setNewChapterTitle(e.target.value)} 
              placeholder="Ex: 03 Memòria Constructiva"
              className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all"
              autoFocus
            />
            <button type="submit" className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Afegir</button>
            <button type="button" onClick={() => setShowChapterForm(false)} className="px-4 text-gray-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-2xl"></i></button>
          </form>
        </div>
      )}

      {/* LLISTAT DE CAPÍTOLS (RECUPERAT I MILLORAT) */}
      <div className="space-y-4">
        {project.chapters.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-24 text-center">
            <i className="fa-solid fa-layer-group text-gray-100 text-6xl mb-6"></i>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">L'estructura d'aquesta memòria està buida</p>
          </div>
        ) : (
          project.chapters.map((chapter, index) => (
            <div key={chapter.id} className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-500 transition-all group flex items-center justify-between gap-6 shadow-sm hover:shadow-md">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveChapter(index, 'up')} disabled={index === 0} className="text-gray-300 hover:text-emerald-500 disabled:opacity-0"><i className="fa-solid fa-chevron-up"></i></button>
                  <button onClick={() => moveChapter(index, 'down')} disabled={index === project.chapters.length - 1} className="text-gray-300 hover:text-emerald-500 disabled:opacity-0"><i className="fa-solid fa-chevron-down"></i></button>
                </div>
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                  <i className="fa-solid fa-folder-tree text-xl"></i>
                </div>
                <div>
                   <h3 className="font-bold text-gray-900 text-lg">{chapter.title}</h3>
                   <div className="flex gap-4 mt-1">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pestanya: {chapter.sheetTabName}</span>
                     <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{chapter.documents.length} documents</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                >
                  Gestiona
                </button>
                <button 
                  onClick={() => deleteChapter(chapter.id)}
                  className="w-12 h-12 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL GESTIONA DOCUMENTS */}
      {selectedChapterId && selectedChapter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Editor de contingut</span>
                   <h3 className="text-2xl font-black text-gray-900">{selectedChapter.title}</h3>
                </div>
                <button onClick={() => setSelectedChapterId(null)} className="w-12 h-12 rounded-full hover:bg-white flex items-center justify-center transition-all shadow-sm"><i className="fa-solid fa-xmark text-xl"></i></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-4">
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Documents vinculats de Drive</h4>
                   <button onClick={() => addDocument(selectedChapter.id)} className="text-xs font-bold text-emerald-600 hover:underline px-4 py-2 bg-emerald-50 rounded-lg">+ Nou Document</button>
                </div>
                {selectedChapter.documents.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[32px]">
                     <p className="text-gray-400 font-medium">No hi ha documents en aquest capítol.</p>
                  </div>
                ) : (
                  selectedChapter.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl group border border-transparent hover:border-emerald-100 transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.type === DocType.GOOGLE_SHEET ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                             <i className={`fa-solid ${doc.type === DocType.GOOGLE_SHEET ? 'fa-file-excel' : 'fa-file-word'}`}></i>
                          </div>
                          <div>
                             <p className="font-bold text-gray-900">{doc.title}</p>
                             <a href={doc.url} target="_blank" className="text-[10px] text-gray-400 hover:text-emerald-600 font-mono truncate block max-w-xs">{doc.url}</a>
                          </div>
                       </div>
                       <button onClick={() => removeDoc(selectedChapter.id, doc.id)} className="w-10 h-10 rounded-lg text-gray-300 hover:text-red-500 transition-all"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  ))
                )}
             </div>
             <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button onClick={() => setSelectedChapterId(null)} className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Guardar i Tancar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
