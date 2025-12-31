
const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Obté les dades del full mestre (Llista de projectes)
 */
export const fetchMasterProjects = async (token: string, masterId: string): Promise<any[]> => {
  if (!masterId) return [];
  try {
    const response = await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A2:E`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn("No s'ha trobat la pestanya 'PROJECTES'. Intentant crear-la...");
        await setupMasterSheet(token, masterId);
        return [];
      }
      throw new Error(`Error llegint el full mestre: ${response.status}`);
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
    throw e;
  }
};

/**
 * Configura l'estructura inicial del Full Mestre si és nou
 */
export const setupMasterSheet = async (token: string, masterId: string) => {
  await fetch(`${BASE_URL}/${masterId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { addSheet: { properties: { title: "PROJECTES" } } }
      ]
    })
  });
  
  await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A1:E1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [["ID", "NOM", "SHEET_ID", "CREAT_EL", "ES_PLANTILLA"]]
    })
  });
};

/**
 * Crea un nou full de càlcul per a un projecte i el registra
 */
export const createProjectSheet = async (token: string, masterId: string, projectName: string) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: `ARCHI - ${projectName}` },
      sheets: [
        { properties: { title: "CONFIG" } },
        { properties: { title: "ESTRUCTURA" } }
      ]
    })
  });

  if (!response.ok) throw new Error("No s'ha pogut crear el full de càlcul");
  const data = await response.json();
  
  const newProject = {
    id: Date.now().toString(),
    name: projectName,
    sheetId: data.spreadsheetId,
    createdAt: new Date().toISOString(),
    isTemplate: false
  };

  // Registrar el projecte al Master
  if (masterId) {
    await registerProjectInMaster(token, masterId, newProject);
  }

  return newProject;
};

const registerProjectInMaster = async (token: string, masterId: string, project: any) => {
  await fetch(`${BASE_URL}/${masterId}/values/PROJECTES!A:E:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[project.id, project.name, project.sheetId, project.createdAt, project.isTemplate]]
    })
  });
};

/**
 * Sincronitza dades i CREA PESTANYES
 */
export const syncProjectData = async (token: string, project: any) => {
  const metaResponse = await fetch(`${BASE_URL}/${project.sheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const metaData = await metaResponse.json();
  const existingSheetTitles = metaData.sheets.map((s: any) => s.properties.title);

  const requests: any[] = [];
  project.chapters.forEach((chapter: any) => {
    const tabName = chapter.sheetTabName || chapter.title.substring(0, 30);
    if (!existingSheetTitles.includes(tabName)) {
      requests.push({ addSheet: { properties: { title: tabName } } });
    }
  });

  if (requests.length > 0) {
    await fetch(`${BASE_URL}/${project.sheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  const configValues = project.placeholders.map((p: any) => [p.key, p.value, p.description]);
  const estructuraValues = project.chapters.map((c: any) => [c.title, c.sheetTabName, c.documents.length]);

  const dataUpdates = [
    { range: "CONFIG!A1:C", values: [["CLAU", "VALOR", "DESCRIPCIO"], ...configValues] },
    { range: "ESTRUCTURA!A1:C", values: [["TITOL", "PESTANYA", "DOCS"], ...estructuraValues] }
  ];

  project.chapters.forEach((c: any) => {
    const tabName = c.sheetTabName || c.title.substring(0, 30);
    dataUpdates.push({
      range: `${tabName}!A1:B`,
      values: [["NOM DOCUMENT", "URL DRIVE"], ...c.documents.map((d: any) => [d.title, d.url])]
    });
  });

  const response = await fetch(`${BASE_URL}/${project.sheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: dataUpdates
    })
  });

  if (!response.ok) throw new Error("Error sincronitzant dades de les pestanyes");
  return await response.json();
};
