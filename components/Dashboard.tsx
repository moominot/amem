
import React, { useState } from 'react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onSelect, onCreate, onDelete }) => {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName);
      setNewName('');
      setIsNewOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Panell de Projectes</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">La teva base de dades documental arquitectònica.</p>
        </div>
        <button 
          onClick={() => setIsNewOpen(true)}
          className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100"
        >
          <i className="fa-solid fa-plus text-sm"></i> Nou Projecte Sheet
        </button>
      </div>

      {isNewOpen && (
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-2xl mb-12 animate-in slide-in-from-top-6 duration-500">
          <h3 className="font-black text-xs uppercase tracking-widest text-emerald-600 mb-6">Informació Inicial</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Reforma Habitatge a Palma"
              className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-100 transition-all hover:-translate-y-1">Crear</button>
              <button type="button" onClick={() => setIsNewOpen(false)} className="px-6 py-4 text-gray-400 font-black hover:text-black transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
          </form>
          <p className="mt-4 text-[10px] text-gray-400 italic">Es crearà automàticament un nou full de Google Sheets per gestionar aquest projecte.</p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[40px] p-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
            <i className="fa-solid fa-box-open text-3xl"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sense projectes actius</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-600 hover:shadow-2xl transition-all group cursor-pointer relative"
              onClick={() => onSelect(project.id)}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                className="absolute top-6 right-6 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
              
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                <i className="fa-solid fa-file-excel text-2xl"></i>
              </div>

              <h3 className="text-xl font-black mb-2 truncate pr-10 text-gray-900 leading-tight">{project.name}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-8 h-8 font-medium">{project.description || 'Sense descripció al full de càlcul.'}</p>
              
              <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Capítols (Tabs)</span>
                   <span className="text-xs font-bold text-gray-700">{project.chapters.length}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID Full</span>
                   <span className="text-[10px] font-mono text-emerald-600 font-bold truncate max-w-[100px]">{project.sheetId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
