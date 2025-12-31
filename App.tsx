
import React, { useState, useEffect } from 'react';
import { Project, AppView } from './types';
import Dashboard from './components/Dashboard';
import ProjectEditor from './components/ProjectEditor';
import PlaceholderSettings from './components/PlaceholderSettings';
import TemplateManager from './components/TemplateManager';
import ExportView from './components/ExportView';
import { fetchMasterProjects, createProjectSheet } from './services/googleSheets';

const CLIENT_ID = "416985197258-3a7kmp78pv3mqs7v02k81kl6ce0e1bh9.apps.googleusercontent.com";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_token'));
  const [masterSheetId, setMasterSheetId] = useState<string>(localStorage.getItem('master_sheet_id') || "");
  const [isLoading, setIsLoading] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  useEffect(() => {
    if (accessToken && masterSheetId) {
      loadProjectsFromSheets(accessToken, masterSheetId);
    }
  }, [accessToken, masterSheetId]);

  const handleLogin = () => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            localStorage.setItem('google_token', response.access_token);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      alert("Error iniciant login.");
    }
  };

  const loadProjectsFromSheets = async (token: string, masterId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchMasterProjects(token, masterId);
      setProjects(data);
    } catch (error: any) {
      console.error("Error carregant projectes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    if (!accessToken) return handleLogin();
    if (!masterSheetId) {
       alert("Primer configura un ID de Full Mestre a la configuració.");
       return;
    }
    
    setIsLoading(true);
    try {
      const newProjData = await createProjectSheet(accessToken, masterSheetId, name);
      const newProject: Project = {
        ...newProjData,
        description: '',
        chapters: [],
        placeholders: [],
      };
      
      // Actualitzem l'estat local i naveguem
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      setView('PROJECT_EDITOR');
      
      // Forçar recàrrega de la llista mestra per seguretat
      await loadProjectsFromSheets(accessToken, masterSheetId);
    } catch (e: any) {
      alert("Error creant el projecte: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const updateActiveProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleSetMasterId = (id: string) => {
    setMasterSheetId(id);
    localStorage.setItem('master_sheet_id', id);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('DASHBOARD')}>
          <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center rounded-xl shadow-lg shadow-emerald-100">
            <i className="fa-solid fa-table-list text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">ARCHISHEETS</h1>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Memòries d'Arquitectura</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 mr-6 border-r border-gray-100 pr-6">
            <button onClick={() => setView('DASHBOARD')} className={`text-xs font-black uppercase tracking-widest ${view === 'DASHBOARD' ? 'text-emerald-600' : 'text-gray-400'}`}>Projectes</button>
            <button onClick={() => setView('TEMPLATE_LIBRARY')} className={`text-xs font-black uppercase tracking-widest ${view === 'TEMPLATE_LIBRARY' ? 'text-emerald-600' : 'text-gray-400'}`}>Plantilles</button>
          </nav>

          {!accessToken ? (
            <button onClick={handleLogin} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">
              Connectar Google
            </button>
          ) : (
            <div className="flex items-center gap-3">
               <div className="text-right">
                 <span className="block text-[8px] font-black text-emerald-600 uppercase">Sessió Activa</span>
                 <button onClick={() => { setAccessToken(null); localStorage.removeItem('google_token'); }} className="text-[10px] font-bold text-gray-400 hover:text-red-500">Sortir</button>
               </div>
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                 <i className="fa-solid fa-user"></i>
               </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black text-emerald-900 uppercase tracking-widest animate-pulse">Sincronitzant...</p>
          </div>
        )}

        {view === 'DASHBOARD' && (
          <Dashboard 
            projects={projects.filter(p => !p.isTemplate)} 
            onSelect={(id) => { setActiveProjectId(id); setView('PROJECT_EDITOR'); }}
            onCreate={handleCreateProject}
            onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
            masterId={masterSheetId}
            onSetMasterId={handleSetMasterId}
          />
        )}
        
        {view === 'PROJECT_EDITOR' && activeProject && (
          <ProjectEditor 
            project={activeProject} 
            updateProject={updateActiveProject}
            onOpenPlaceholders={() => setView('PLACEHOLDER_EDITOR')}
            onFinalize={() => setView('EXPORT_VIEW')}
            accessToken={accessToken}
          />
        )}

        {view === 'PLACEHOLDER_EDITOR' && activeProject && (
          <PlaceholderSettings project={activeProject} updateProject={updateActiveProject} onBack={() => setView('PROJECT_EDITOR')} />
        )}

        {view === 'EXPORT_VIEW' && activeProject && (
          <ExportView project={activeProject} onBack={() => setView('PROJECT_EDITOR')} />
        )}

        {view === 'TEMPLATE_LIBRARY' && (
          <TemplateManager 
            templates={projects.filter(p => p.isTemplate)}
            onSelect={(id) => { setActiveProjectId(id); setView('PROJECT_EDITOR'); }}
            onDelete={() => {}}
            onUse={(id) => {
              const name = window.prompt('Nom del nou projecte:');
              if (name) handleCreateProject(name);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
