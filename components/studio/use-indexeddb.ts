"use client";

const DB_NAME = "epicstage_epic_studio_v3";
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("projects"))
        db.createObjectStore("projects", { keyPath: "projectId" });
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "key" });
      if (!db.objectStoreNames.contains("images"))
        db.createObjectStore("images", { keyPath: "id" });
    };
    req.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export async function saveProject(data: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
}

export async function loadProject(projectId: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly");
    const req = tx.objectStore("projects").get(projectId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function listProjects(): Promise<Array<{ id: string; name: string; lastModifiedAt: number; step: number; versionCount: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly");
    const req = tx.objectStore("projects").getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(
        all
          .map((p: any) => ({
            id: p.projectId,
            name: p.versions?.[0]?.guideline?.event_summary?.name || p.eventInfo?.substring(0, 30) || "(무제)",
            lastModifiedAt: p.lastModifiedAt || 0,
            step: p.step || 1,
            versionCount: p.versions?.length || 0,
          }))
          .sort((a: any, b: any) => b.lastModifiedAt - a.lastModifiedAt)
      );
    };
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").delete(projectId);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
}

export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
}

export async function loadSetting(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const req = tx.objectStore("settings").get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function saveImage(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    tx.objectStore("images").put({ id, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
}

export async function loadImage(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readonly");
    const req = tx.objectStore("images").get(id);
    req.onsuccess = () => resolve(req.result?.dataUrl ?? null);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}
