
import { createFolder, getFileParent, moveFileToFolder, copyFile } from './googleDrive';

const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

export const fetchMasterProjects = async (token: string, masterId: string): Promise<any[]> => {
  if (!masterId) return [];
  try {
    const response = await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A2:E`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        await setupMasterSheet(token, masterId);
        return [];
      }
      return [];
    }
    
    const data = await response.json();
    if (!data.values) return [];
    
    return data.values.map((row: any) => ({
      id: row[0],
      name: row[1],
      sheetId: row[2],
      createdAt: row[3],
      isTemplate: row[4] === 'TRUE',
      chapters: [],
      placeholders: [],
      description: ''
    }));
  } catch (e) {
    console.error("fetchMasterProjects error:", e);
    return [];
  }
};

export const fetchProjectDetailsFromSheet = async (token: string, sheetId: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/${sheetId}/values:batchGet?ranges=CONFIG!A2:C&ranges=ESTRUCTURA!A2:C`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    if (!data.valueRanges) return null;

    const configRows = data.valueRanges[0].values || [];
    const estructuraRows = data.valueRanges[1].values || [];

    const placeholders = configRows.map((r: any) => ({
      key: r[0],
      value: r[1] || '',
      description: r[2] || ''
    }));

    const chapters = [];
    for (const row of estructuraRows) {
      const title = row[0];
      const tabName = row[1];
      
      const docResponse = await fetch(`${BASE_URL}/${sheetId}/values/${tabName}!A2:C`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docData = await docResponse.json();
      const docRows = docData.values || [];

      chapters.push({
        id: `c_${Math.random().toString(36).substr(2, 9)}`,
        title,
        sheetTabName: tabName,
        documents: docRows.map((dr: any, idx: number) => ({
          id: `d_${idx}`,
          title: dr[0],
          url: dr[1],
          type: dr[1]?.includes('spreadsheets') ? 'SHEET' : 'DOC'
        }))
      });
    }

    return { placeholders, chapters };
  } catch (e) {
    return null;
  }
};

export const registerProjectInMaster = async (token: string, masterId: string, project: any) => {
  if (!masterId) return;
  try {
    await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A:E:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [[project.id, project.name, project.sheetId, project.createdAt, project.isTemplate]]
      })
    });
  } catch (e) {}
};

export const syncProjectData = async (token: string, project: any) => {
  if (!project.sheetId) return;

  try {
    const metaResponse = await fetch(`${BASE_URL}/${project.sheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const metaData = await metaResponse.json();
    const existingTitles = metaData.sheets.map((s: any) => s.properties.title);

    const requests: any[] = [];
    if (!existingTitles.includes("CONFIG")) requests.push({ addSheet: { properties: { title: "CONFIG" } } });
    if (!existingTitles.includes("ESTRUCTURA")) requests.push({ addSheet: { properties: { title: "ESTRUCTURA" } } });

    project.chapters.forEach((chapter: any) => {
      const tabName = chapter.sheetTabName;
      if (tabName && !existingTitles.includes(tabName)) {
        requests.push({ addSheet: { properties: { title: tabName } } });
      }
    });

    if (requests.length > 0) {
      await fetch(`${BASE_URL}/${project.sheetId}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });
    }

    const configValues = [["CLAU", "VALOR", "DESCRIPCIO"], ...project.placeholders.map((p: any) => [p.key, p.value, p.description])];
    const estructuraValues = [["TITOL", "PESTANYA", "DOCS"], ...project.chapters.map((c: any) => [c.title, c.sheetTabName, c.documents.length])];

    const dataUpdates = [
      { range: "CONFIG!A1:C", values: configValues },
      { range: "ESTRUCTURA!A1:C", values: estructuraValues }
    ];

    project.chapters.forEach((c: any) => {
      if (c.sheetTabName) {
        dataUpdates.push({
          range: `${c.sheetTabName}!A1:B`,
          values: [["NOM DOCUMENT", "URL DRIVE"], ...c.documents.map((d: any) => [d.title, d.url])]
        });
      }
    });

    await fetch(`${BASE_URL}/${project.sheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataUpdates
      })
    });
  } catch (e) {}
};

export const setupMasterSheet = async (token: string, masterId: string) => {
  try {
    await fetch(`${BASE_URL}/${masterId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: "PROJECTES" } } }]
      })
    });
    await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A1:E1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [["ID", "NOM", "SHEET_ID", "CREAT_EL", "ES_PLANTILLA"]] })
    });
  } catch (e) {}
};

/**
 * Crea un nou projecte, opcionalment des d'una plantilla
 */
export const createProjectFromTemplate = async (token: string, masterId: string, projectName: string, template?: any) => {
  // 1. Trobar carpeta pare del Master Sheet
  const parentFolderId = await getFileParent(token, masterId);
  
  // 2. Crear carpeta de projecte
  const projectFolderId = await createFolder(token, projectName, parentFolderId || undefined);

  // 3. Crear el full de càlcul del projecte
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: `ARCHI - ${projectName}` },
      sheets: [{ properties: { title: "CONFIG" } }, { properties: { title: "ESTRUCTURA" } }]
    })
  });
  const sheetData = await response.json();
  const sheetId = sheetData.spreadsheetId;

  // 4. Moure el full a la carpeta
  await moveFileToFolder(token, sheetId, projectFolderId);

  // 5. Si hi ha plantilla, clonar estructura i fitxers
  let finalChapters = [];
  let finalPlaceholders = template?.placeholders || [];

  if (template && template.chapters) {
    for (const chapter of template.chapters) {
      const clonedDocs = [];
      for (const doc of chapter.documents) {
        // Obtenir ID de l'URL del document de la plantilla
        const match = doc.url.match(/[-\w]{25,}/);
        if (match) {
          const originalFileId = match[0];
          // Copiar el fitxer a la nova carpeta de projecte
          const newFileId = await copyFile(token, originalFileId, `${projectName} - ${doc.title}`, projectFolderId);
          const newUrl = doc.url.replace(originalFileId, newFileId);
          clonedDocs.push({ ...doc, id: `d_${Date.now()}_${Math.random()}`, url: newUrl });
        } else {
          clonedDocs.push({ ...doc });
        }
      }
      finalChapters.push({
        ...chapter,
        id: `c_${Date.now()}_${Math.random()}`,
        documents: clonedDocs
      });
    }
  }

  const newProject = {
    id: Date.now().toString(),
    name: projectName,
    sheetId: sheetId,
    folderId: projectFolderId,
    createdAt: new Date().toISOString(),
    isTemplate: false,
    chapters: finalChapters,
    placeholders: finalPlaceholders,
    description: template?.description || ''
  };

  // Registrar al mestre i fer la primera sincronització de dades
  await registerProjectInMaster(token, masterId, newProject);
  await syncProjectData(token, newProject);

  return newProject;
};

// Re-exportem per compatibilitat
export const createProjectSheet = (token: string, masterId: string, projectName: string) => 
  createProjectFromTemplate(token, masterId, projectName);
