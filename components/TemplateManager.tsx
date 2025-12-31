
import React from 'react';
import { Project } from '../types';

interface TemplateManagerProps {
  templates: Project[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUse: (id: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onSelect, onDelete, onUse }) => {
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Biblioteca de Plantilles</h2>
        <p className="text-sm text-gray-500 mt-1">Estructures tipus per agilitzar la redacció.</p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 sm:p-20 text-center">
          <p className="text-gray-400 italic">Encara no has creat cap plantilla.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => (
            <div 
              key={template.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col group"
            >
              <div className="p-5 sm:p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <button 
                    onClick={() => onDelete(template.id)}
                    className="text-gray-300 hover:text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all p-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
                <h3 className="text-lg font-bold mb-2 truncate">{template.name}</h3>
                <p className="text-xs text-gray-500 mb-6 h-8 line-clamp-2">{template.description || 'Estructura predefinida'}</p>
                
                <div className="space-y-1.5">
                  {template.chapters.slice(0, 3).map(c => (
                    <div key={c.id} className="text-[10px] text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div> {c.title}
                    </div>
                  ))}
                  {template.chapters.length > 3 && <div className="text-[10px] text-amber-500 font-bold">+ {template.chapters.length - 3} CAPÍTOLS MÉS</div>}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => onUse(template.id)}
                  className="flex-1 bg-black text-white text-[10px] font-black py-3 rounded-lg hover:bg-gray-800 uppercase tracking-widest shadow-sm"
                >
                  Utilitzar
                </button>
                <button 
                  onClick={() => onSelect(template.id)}
                  className="px-4 py-3 text-gray-500 hover:text-black text-[10px] font-bold border border-gray-200 rounded-lg bg-white"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-gray-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-lg">
          <h3 className="text-xl font-bold mb-4">Eficiència en cada projecte</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Les plantilles clonen l'estructura i vinculen els documents base de Google Drive. Perfecte per mantenir la coherència entre projectes.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <i className="fa-solid fa-check text-green-400 text-xs"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Sincro-link</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <i className="fa-solid fa-check text-green-400 text-xs"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Estalvi de temps</span>
            </div>
          </div>
        </div>
        <i className="fa-solid fa-copy absolute -right-12 -bottom-12 text-[240px] text-white opacity-5 rotate-12 pointer-events-none"></i>
      </div>
    </div>
  );
};

export default TemplateManager;
