
export const MASTER_SHEET_ID = "1IhGtDSEOe4oXmtc2W02HqBldKS_OBNdmLDfOYNGSvCA";
const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Obté les dades del full mestre (Llista de projectes)
 */
export const fetchMasterProjects = async (token: string): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/${MASTER_SHEET_ID}/values/PROJECTES!A2:E`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 404) throw new Error("No s'ha trobat la pestanya 'PROJECTES' al full mestre.");
    throw new Error("Error llegint el full mestre");
  }
  
  const data = await response.json();
  if (!data.values) return [];
  
  return data.values.map((row: any) => ({
    id: row[0],
    name: row[1],
    sheetId: row[2],
    createdAt: row[3],
    isTemplate: row[4] === 'TRUE'
  }));
};

/**
 * Crea un nou full de càlcul per a un projecte amb l'estructura base
 */
export const createProjectSheet = async (token: string, projectName: string) => {
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
  
  // Registrar el projecte al Master
  await registerProjectInMaster(token, {
    id: Date.now().toString(),
    name: projectName,
    sheetId: data.spreadsheetId,
    createdAt: new Date().toISOString(),
    isTemplate: false
  });

  return data;
};

const registerProjectInMaster = async (token: string, project: any) => {
  await fetch(`${BASE_URL}/${MASTER_SHEET_ID}/values/PROJECTES!A:E:append?valueInputOption=USER_ENTERED`, {
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
 * Sincronitza dades i CREA PESTANYES per a cada capítol si no existeixen
 */
export const syncProjectData = async (token: string, project: any) => {
  // 1. Obtenir metadades del full per veure quines pestanyes ja existeixen
  const metaResponse = await fetch(`${BASE_URL}/${project.sheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const metaData = await metaResponse.json();
  const existingSheetTitles = metaData.sheets.map((s: any) => s.properties.title);

  // 2. Identificar capítols que necessiten una pestanya nova
  const requests: any[] = [];
  project.chapters.forEach((chapter: any) => {
    const tabName = chapter.sheetTabName || chapter.title.substring(0, 30);
    if (!existingSheetTitles.includes(tabName)) {
      requests.push({
        addSheet: {
          properties: { title: tabName }
        }
      });
    }
  });

  // 3. Crear les pestanyes que faltin en un sol batch
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

  // 4. Preparar dades per a totes les pestanyes
  const configValues = project.placeholders.map((p: any) => [p.key, p.value, p.description]);
  const estructuraValues = project.chapters.map((c: any) => [c.title, c.sheetTabName, c.documents.length]);

  const dataUpdates = [
    { range: "CONFIG!A1:C", values: [["CLAU", "VALOR", "DESCRIPCIO"], ...configValues] },
    { range: "ESTRUCTURA!A1:C", values: [["TITOL", "PESTANYA", "DOCS"], ...estructuraValues] }
  ];

  // Afegir dades buides o capçaleres per a cada pestanya de capítol
  project.chapters.forEach((c: any) => {
    const tabName = c.sheetTabName || c.title.substring(0, 30);
    dataUpdates.push({
      range: `${tabName}!A1:B`,
      values: [["NOM DOCUMENT", "URL DRIVE"], ...c.documents.map((d: any) => [d.title, d.url])]
    });
  });

  // 5. Enviar totes les actualitzacions de valors
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
