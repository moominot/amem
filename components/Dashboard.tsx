
import React, { useState } from 'react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  masterId: string;
  onSetMasterId: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onSelect, onCreate, onDelete, masterId, onSetMasterId }) => {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!masterId);
  const [newName, setNewName] = useState('');
  const [tempMasterId, setTempMasterId] = useState(masterId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName);
      setNewName('');
      setIsNewOpen(false);
    }
  };

  const handleSaveMasterId = (e: React.FormEvent) => {
    e.preventDefault();
    onSetMasterId(tempMasterId);
    setIsSettingsOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Projectes de l'Estudi</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Gestiona les memòries vinculades als teus Fulls de Càlcul.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-4 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-emerald-600 transition-all shadow-sm"
            title="Configuració del Full Mestre"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
          <button 
            onClick={() => setIsNewOpen(true)}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-100"
          >
            <i className="fa-solid fa-plus"></i> Nou Projecte
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-2xl mb-12 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-emerald-600">Configuració Base de Dades (Master Sheet)</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-black"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Aquesta aplicació necessita un Full de Càlcul de Google com a "Índex" per guardar la llista dels teus projectes. 
            Crea un full buit a Google Sheets i <strong>copia l'ID de l'URL</strong> (el codi llarg entre /d/ i /edit).
          </p>
          <form onSubmit={handleSaveMasterId} className="flex gap-3">
            <input 
              type="text" 
              value={tempMasterId}
              onChange={(e) => setTempMasterId(e.target.value)}
              placeholder="Ex: 1IhGtDSEOe4oXmtc2W02HqBldKS..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
            />
            <button type="submit" className="bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Connectar Base de Dades</button>
          </form>
        </div>
      )}

      {isNewOpen && (
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-2xl mb-12 animate-in slide-in-from-top-6">
          <h3 className="font-black text-xs uppercase tracking-widest text-emerald-600 mb-6">Nou Projecte</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom del projecte (ex: Reforma a Inca)"
              className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold"
              autoFocus
            />
            <button type="submit" className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Crear ara</button>
            <button type="button" onClick={() => setIsNewOpen(false)} className="px-4 text-gray-400 font-bold hover:text-black">Cancel·lar</button>
          </form>
        </div>
      )}

      {!masterId ? (
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[40px] p-24 text-center">
          <i className="fa-solid fa-database text-emerald-200 text-5xl mb-6"></i>
          <h4 className="text-emerald-900 font-black uppercase tracking-widest text-sm mb-2">Falta la Base de Dades</h4>
          <p className="text-emerald-600/70 text-xs mb-8 max-w-sm mx-auto">Configura un Full Mestre de Google Sheets per començar a llistar els teus projectes d'arquitectura.</p>
          <button onClick={() => setIsSettingsOpen(true)} className="text-xs font-black bg-emerald-600 text-white px-8 py-3 rounded-xl uppercase tracking-widest">Configurar ara</button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[40px] p-24 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
            <i className="fa-solid fa-folder-open text-2xl"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sense projectes registrats en aquest Master Sheet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-600 hover:shadow-xl transition-all group cursor-pointer relative"
              onClick={() => onSelect(project.id)}
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <i className="fa-solid fa-file-excel text-xl"></i>
              </div>
              <h3 className="text-lg font-black mb-1 truncate text-gray-900">{project.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono mb-4 truncate">{project.sheetId}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                 <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Registrat: {new Date(project.createdAt).toLocaleDateString()}</span>
                 <i className="fa-solid fa-chevron-right text-gray-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
