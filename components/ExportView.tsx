
import React, { useState } from 'react';
import { Project } from '../types';
import { generateExecutiveSummary } from '../services/gemini';

interface ExportViewProps {
  project: Project;
  onBack: () => void;
}

const ExportView: React.FC<ExportViewProps> = ({ project, onBack }) => {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set(
    project.chapters.flatMap(c => c.documents.map(d => d.id))
  ));
  const [isCompiling, setIsCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocs(next);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const text = await generateExecutiveSummary(project);
    setSummary(text);
    setIsGeneratingSummary(false);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    const steps = [
      "Substituint claus {{...}} en Google Docs",
      "Calculant numeració de pàgines i capítols",
      "Sincronitzant taules des de Google Sheets",
      "Generant índex general del projecte",
      "Fusionant capítols en PDF final",
      "Comprimint memòria per a lliurament"
    ];

    for (let i = 0; i < steps.length; i++) {
      setStatus(steps[i]);
      await new Promise(r => setTimeout(r, 1200));
      setProgress(((i + 1) / steps.length) * 100);
    }
    
    setStatus("Memòria generada correctament!");
    setTimeout(() => {
      alert("En un entorn real, aquí s'enllaçaria amb la carpeta 'FINAL' de Google Drive amb tots els PDFs combinats.");
      setIsCompiling(false);
      setProgress(0);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold">Consola d'Exportació</h2>
          <p className="text-sm text-gray-500">Prepara el lliurament final del projecte.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Selecció de Contingut */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Contingut a exportar</h3>
              <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded">{selectedDocs.size} SELECCIONATS</span>
            </div>
            <div className="p-4 space-y-4">
              {project.chapters.map(chapter => (
                <div key={chapter.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <i className="fa-solid fa-folder text-gray-300 text-xs"></i>
                    <h4 className="font-bold text-xs text-gray-900">{chapter.title}</h4>
                  </div>
                  <div className="space-y-1 ml-4">
                    {chapter.documents.map(doc => (
                      <label key={doc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedDocs.has(doc.id)} 
                            onChange={() => toggleDoc(doc.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-black">{doc.title}</span>
                        </div>
                        <i className={`fa-solid ${doc.type === 'DOC' ? 'fa-file-lines text-blue-400' : 'fa-file-excel text-emerald-400'} text-xs opacity-50`}></i>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Introducció IA */}
          <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-indigo-900">Introducció de la Memòria (IA)</h3>
                  <button 
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <i className={`fa-solid ${isGeneratingSummary ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                    GENERAR AMB GEMINI
                  </button>
                </div>
                {summary ? (
                  <div className="bg-white/60 p-4 rounded-xl text-sm text-indigo-900 leading-relaxed font-serif whitespace-pre-wrap">
                    {summary}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-400 italic">Encara no has generat cap text d'introducció per a aquest projecte.</p>
                )}
             </div>
             <i className="fa-solid fa-quote-right absolute -right-4 -bottom-4 text-8xl text-indigo-200/20 rotate-12"></i>
          </section>
        </div>

        {/* Panell lateral d'Acció */}
        <div className="space-y-6">
          <div className="bg-black text-white rounded-2xl p-6 shadow-xl sticky top-8">
            <h3 className="font-bold text-lg mb-6">Finalitzar Projecte</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <i className="fa-solid fa-circle-check text-green-400"></i>
                Capítols estructurats
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <i className="fa-solid fa-circle-check text-green-400"></i>
                Camps definits ({project.placeholders.length})
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <i className={`fa-solid ${selectedDocs.size > 0 ? 'fa-circle-check text-green-400' : 'fa-circle-xmark text-gray-600'}`}></i>
                Contingut seleccionat
              </div>
            </div>

            <button 
              onClick={handleCompile}
              disabled={isCompiling || selectedDocs.size === 0}
              className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isCompiling ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
              Generar PDF Final
            </button>
            
            <p className="text-[9px] text-gray-500 mt-4 text-center leading-tight">
              Aquesta acció crearà una còpia final dels documents substituint les etiquetes pels valors actuals del projecte.
            </p>
          </div>

          {isCompiling && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-in zoom-in">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progrés</span>
                <span className="text-xs font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-black transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-medium text-gray-600 animate-pulse flex items-center gap-2">
                <i className="fa-solid fa-gear fa-spin"></i> {status}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportView;
