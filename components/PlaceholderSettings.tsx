
import React, { useState, useRef, useEffect } from 'react';
import { Project, Placeholder } from '../types';
import { suggestPlaceholderValues } from '../services/gemini';

interface PlaceholderSettingsProps {
  project: Project;
  updateProject: (p: Project) => void;
  onBack: () => void;
}

const PlaceholderSettings: React.FC<PlaceholderSettingsProps> = ({ project, updateProject, onBack }) => {
  const [placeholders, setPlaceholders] = useState<Placeholder[]>(project.placeholders);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Estats per al nou formulari d'afegir clau
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const save = () => {
    setSaveStatus('saving');
    updateProject({ ...project, placeholders });
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onBack();
      }, 800);
    }, 500);
  };

  const handleAISuggest = async () => {
    if (placeholders.length === 0) {
      alert("Primer afegeix algunes claus (ex: CLIENT_NOM) per poder suggerir valors.");
      return;
    }
    
    setIsSuggesting(true);
    const keys = placeholders.map(p => p.key);
    const suggestions = await suggestPlaceholderValues(project.name, project.description, keys);
    
    if (suggestions) {
      const updated = placeholders.map(p => ({
        ...p,
        value: suggestions[p.key] || p.value
      }));
      setPlaceholders(updated);
    } else {
      alert("No s'han pogut generar suggeriments. Revisa la connexió.");
    }
    setIsSuggesting(false);
  };

  const handleAddPlaceholder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const cleanKey = newKey.trim().toUpperCase().replace(/\s+/g, '_');
    
    if (!cleanKey) {
      setIsAdding(false);
      return;
    }

    if (placeholders.find(p => p.key === cleanKey)) {
      alert("Aquesta clau ja existeix.");
      return;
    }

    setPlaceholders([{ key: cleanKey, value: '', description: '' }, ...placeholders]);
    setNewKey('');
    setIsAdding(false);
  };

  const updatePlaceholder = (index: number, field: keyof Placeholder, value: string) => {
    const updated = [...placeholders];
    updated[index] = { ...updated[index], [field]: value };
    setPlaceholders(updated);
  };

  const removePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Camps Personalitzats</h2>
            <p className="text-xs text-gray-500">Variables automàtiques per als documents de {project.name}.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAISuggest} 
            disabled={isSuggesting || placeholders.length === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <i className={`fa-solid ${isSuggesting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            <span className="hidden xs:inline">Sugerir valors</span>
            <span className="xs:hidden">IA</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)} 
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>CLAU</span>
          </button>
          <button 
            onClick={save} 
            disabled={saveStatus !== 'idle'}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
              saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {saveStatus === 'saving' ? <i className="fa-solid fa-spinner fa-spin"></i> : 
             saveStatus === 'saved' ? <i className="fa-solid fa-check"></i> : null}
            <span>{saveStatus === 'saved' ? 'DESAT' : 'GUARDAR'}</span>
          </button>
        </div>
      </div>

      {/* Formulari d'alta de clau integrat */}
      {isAdding && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 mb-6 shadow-xl animate-in zoom-in duration-200">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4">Nom de la nova clau</h3>
          <form onSubmit={handleAddPlaceholder} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-gray-400 font-bold">{"{{"}</span>
               <input 
                 ref={inputRef}
                 type="text"
                 value={newKey}
                 onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                 placeholder="EX: CLIENT_ADRECA"
                 className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-gray-400 font-bold">{"}}"}</span>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="flex-1 sm:flex-none bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800"
              >
                Crear
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setNewKey(''); }} 
                className="px-4 py-3 text-gray-400 hover:text-black font-bold"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </form>
          <p className="mt-3 text-[10px] text-gray-400 italic">No cal que posis les claus {"{{ }}"}, l'aplicació les afegirà automàticament.</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Taula Desktop */}
        <div className="hidden sm:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Etiqueta</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor de dades</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripció / Notes</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {placeholders.map((p, idx) => (
                <tr key={p.key} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold border border-indigo-100">
                      {`{{${p.key}}}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={p.value}
                      onChange={(e) => updatePlaceholder(idx, 'value', e.target.value)}
                      placeholder="Introdueix el valor..."
                      className="w-full bg-transparent text-sm focus:outline-none font-semibold text-gray-800 placeholder:text-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={p.description}
                      onChange={(e) => updatePlaceholder(idx, 'description', e.target.value)}
                      placeholder="Per a què serveix?"
                      className="w-full bg-transparent text-sm text-gray-400 focus:outline-none placeholder:text-gray-200"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removePlaceholder(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2 transition-all">
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Llista Mobile */}
        <div className="sm:hidden divide-y divide-gray-100">
          {placeholders.map((p, idx) => (
            <div key={p.key} className="p-4 space-y-3 relative group">
              <button onClick={() => removePlaceholder(idx)} className="absolute top-4 right-4 text-gray-300 p-2 active:text-red-500">
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded w-fit font-bold border border-indigo-100">
                  {`{{${p.key}}}`}
                </span>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-tighter ml-1">Valor</label>
                  <input 
                    type="text" 
                    value={p.value}
                    onChange={(e) => updatePlaceholder(idx, 'value', e.target.value)}
                    placeholder="Valor..."
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <input 
                  type="text" 
                  value={p.description}
                  onChange={(e) => updatePlaceholder(idx, 'description', e.target.value)}
                  placeholder="Notes..."
                  className="w-full px-1 text-xs text-gray-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {placeholders.length === 0 && !isAdding && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
              <i className="fa-solid fa-tag text-gray-200 text-xl"></i>
            </div>
            <p className="text-gray-400 font-medium mb-4">No hi ha camps configurats.</p>
            <button onClick={() => setIsAdding(true)} className="text-xs font-bold text-indigo-600 hover:underline">CREAR EL PRIMER CAMP</button>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
             <i className="fa-solid fa-bolt text-indigo-300"></i>
          </div>
          <div className="text-xs leading-relaxed">
            <p className="font-black uppercase tracking-widest mb-2 text-indigo-200">Automatització de documents</p>
            <p className="text-indigo-100/80">
              Quan redactis els teus documents a Google Docs, utilitza les etiquetes definides a dalt (ex: <code className="bg-white/10 px-1 rounded text-white font-bold">{"{{CLIENT_NOM}}"}</code>). 
              L'aplicació cercarà aquestes cadenes i les substituirà pels valors reals, evitant errors i estalviant hores de revisió.
            </p>
          </div>
        </div>
        <i className="fa-solid fa-code absolute -right-8 -bottom-8 text-[120px] text-white/5 rotate-12 pointer-events-none"></i>
      </div>
    </div>
  );
};

export default PlaceholderSettings;
