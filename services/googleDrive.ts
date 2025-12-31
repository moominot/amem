
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";

/**
 * Obté el pare (carpeta) d'un fitxer
 */
export const getFileParent = async (token: string, fileId: string): Promise<string | null> => {
  const response = await fetch(`${DRIVE_API_URL}/${fileId}?fields=parents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  return data.parents ? data.parents[0] : null;
};

/**
 * Crea una carpeta nova
 */
export const createFolder = async (token: string, name: string, parentId?: string): Promise<string> => {
  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : []
  };
  const response = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return data.id;
};

/**
 * Mou un fitxer a una carpeta
 */
export const moveFileToFolder = async (token: string, fileId: string, folderId: string) => {
  const currentParent = await getFileParent(token, fileId);
  let url = `${DRIVE_API_URL}/${fileId}?addParents=${folderId}`;
  if (currentParent) url += `&removeParents=${currentParent}`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
};

/**
 * Copia un fitxer a una carpeta nova
 */
export const copyFile = async (token: string, fileId: string, newName: string, folderId: string): Promise<string> => {
  const response = await fetch(`${DRIVE_API_URL}/${fileId}/copy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      parents: [folderId]
    })
  });
  const data = await response.json();
  return data.id;
};
