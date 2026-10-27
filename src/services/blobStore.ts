/**
 * 큰 파일(영상) 보관함 — 이 브라우저의 IndexedDB.
 * localStorage 는 5MB 안팎이라 영상을 못 담아서, Supabase 를 안 쓸 때(시연·개발용)만 사용.
 */
const DB_NAME = 'hkc-blobs';
const STORE = 'blobs';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => (db.close(), resolve(req.result));
    tx.onerror = tx.onabort = () => (db.close(), reject(tx.error ?? req.error));
  });
}

export const putBlob = (key: string, blob: Blob) => run('readwrite', (s) => s.put(blob, key)).then(() => undefined);
export const getBlob = (key: string) => run<Blob | undefined>('readonly', (s) => s.get(key));
export const deleteBlob = (key: string) => run('readwrite', (s) => s.delete(key)).then(() => undefined);
