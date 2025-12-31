
import React, { useState, useEffect } from 'react';
import { Project, AppView, AppSettings } from './types';
import Dashboard from './components/Dashboard';
import ProjectEditor from './components/ProjectEditor';
import PlaceholderSettings from './components/PlaceholderSettings';
import TemplateManager from './components/TemplateManager';
import ExportView from './components/ExportView';
import { fetchMasterProjects, createProjectSheet, MASTER_SHEET_ID } from './services/googleSheets';

// IMPORTANT: Aquest CLIENT_ID ha d'estar configurat a la teva Google Cloud Console
const CLIENT_ID = "416985197258-3a7kmp78pv3mqs7v02k81kl6ce0e1bh9.apps.googleusercontent.com";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_token'));
  const [isLoading, setIsLoading] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  useEffect(() => {
    // Log per ajudar a l'usuari a configurar l'Authorized Origin
    console.log("Configuració Google Auth:");
    console.log("1. Origen actual (afegeix-lo a Google Cloud Console):", window.location.origin);
    console.log("2. Client ID:", CLIENT_ID);
    
    if (accessToken) {
      loadProjectsFromSheets(accessToken);
    }
  }, [accessToken]);

  const handleLogin = () => {
    try {
      if (!(window as any).google) {
        alert("La llibreria de Google no s'ha carregat correctament. Revisa la connexió.");
        return;
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            console.error("Error OAuth:", response.error);
            alert(`Error d'autenticació: ${response.error_description || response.error}`);
            return;
          }
          if (response.access_token) {
            console.log("Token obtingut correctament");
            setAccessToken(response.access_token);
            localStorage.setItem('google_token', response.access_token);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("Error iniciant login:", e);
      alert("No s'ha pogut iniciar el procés de login.");
    }
  };

  const loadProjectsFromSheets = async (token: string) => {
    setIsLoading(true);
    try {
      const data = await fetchMasterProjects(token);
      const mapped = data.map(p => ({
        ...p,
        description: '',
        chapters: [],
        placeholders: []
      }));
      setProjects(mapped);
    } catch (error: any) {
      console.error("Auth error or sheet access error:", error);
      // Si el token ha expirat o és invàlid
      if (error.message && error.message.includes('401')) {
        setAccessToken(null);
        localStorage.removeItem('google_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    if (!accessToken) return handleLogin();
    
    setIsLoading(true);
    try {
      const sheet = await createProjectSheet(accessToken, name);
      await loadProjectsFromSheets(accessToken);
      // Busquem el nou projecte pel seu sheetId
      const newProj = projects.find(p => p.sheetId === sheet.spreadsheetId);
      if (newProj) {
        setActiveProjectId(newProj.id);
        setView('PROJECT_EDITOR');
      } else {
        // Si encara no ha aparegut a la llista (per latència de l'API), forcem recàrrega o avisem
        alert("Projecte creat al Full de Càlcul. Torna a llistar per veure'l.");
      }
    } catch (e: any) {
      alert("Error creant el projecte: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const updateActiveProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
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
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Connectat a Google Drive</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 mr-6 border-r border-gray-100 pr-6">
            <button onClick={() => setView('DASHBOARD')} className={`text-xs font-black uppercase tracking-widest transition-colors ${view === 'DASHBOARD' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>Projectes</button>
            <button onClick={() => setView('TEMPLATE_LIBRARY')} className={`text-xs font-black uppercase tracking-widest transition-colors ${view === 'TEMPLATE_LIBRARY' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>Plantilles</button>
          </nav>

          {!accessToken ? (
            <button 
              onClick={handleLogin}
              className="px-5 py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 shadow-sm"
            >
              <i className="fa-brands fa-google"></i>
              Connectar amb Google
            </button>
          ) : (
            <div className="flex items-center gap-3">
               <div className="text-right">
                 <span className="block text-[8px] font-black text-emerald-600 uppercase">Sessió Activa</span>
                 <button onClick={() => { setAccessToken(null); localStorage.removeItem('google_token'); }} className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">Sortir</button>
               </div>
               <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                 <i className="fa-solid fa-user text-sm"></i>
               </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
            <p className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em] animate-pulse">Sincronitzant amb Google...</p>
          </div>
        )}

        {view === 'DASHBOARD' && (
          <Dashboard 
            projects={projects.filter(p => !p.isTemplate)} 
            onSelect={(id) => { setActiveProjectId(id); setView('PROJECT_EDITOR'); }}
            onCreate={handleCreateProject}
            onDelete={() => {
              if (window.confirm("Aquesta acció només el treurà de la llista Master de l'estudi. El fitxer continuarà a Google Drive.")) {
                // Implementació futura: Remove row from MASTER_SHEET_ID
              }
            }}
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
          <PlaceholderSettings 
            project={activeProject}
            updateProject={updateActiveProject}
            onBack={() => setView('PROJECT_EDITOR')}
          />
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
      
      {!accessToken && view === 'DASHBOARD' && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white px-8 py-6 rounded-[32px] shadow-2xl border border-emerald-100 flex flex-col items-center gap-4 z-50 animate-in slide-in-from-bottom-12 duration-700">
          <p className="text-sm font-bold text-gray-900">Necessites connectar el teu compte per gestionar projectes</p>
          <button 
            onClick={handleLogin}
            className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
          >
            Iniciar Sessió ara
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
