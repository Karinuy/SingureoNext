export type FavoriteItem = {
  id: string
  slug: string
  createdAt: number
}

export type FavoritesExport = {
  favorites: FavoriteItem[]
}

const DB_NAME = "singureo-favorites"
const DB_VERSION = 1
const FAVORITES_STORE = "favorites"

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB 不可用")
  }
  return indexedDB
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function requestToPromise<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function hasRequiredStores(db: IDBDatabase) {
  return db.objectStoreNames.contains(FAVORITES_STORE)
}

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const req = getIndexedDb().deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error("数据库被占用，无法重建"))
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

async function openDB(retry = true): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = getIndexedDb().open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = async () => {
      const db = req.result
      if (hasRequiredStores(db)) {
        resolve(db)
        return
      }
      db.close()
      if (!retry) {
        dbPromise = null
        reject(new Error("数据库结构不完整"))
        return
      }
      try {
        await deleteDatabase()
        dbPromise = null
        const fresh = await openDB(false)
        resolve(fresh)
      } catch (err) {
        dbPromise = null
        reject(err)
      }
    }
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

export async function getFavorite(slug: string) {
  const db = await openDB()
  const tx = db.transaction(FAVORITES_STORE, "readonly")
  const store = tx.objectStore(FAVORITES_STORE)
  return requestToPromise<FavoriteItem | undefined>(store.get(slug))
}

export async function upsertFavorite(item: Omit<FavoriteItem, "id" | "createdAt">) {
  const db = await openDB()
  const tx = db.transaction(FAVORITES_STORE, "readwrite")
  const store = tx.objectStore(FAVORITES_STORE)
  const existing = (await requestToPromise<FavoriteItem | undefined>(store.get(item.slug))) ?? null
  const payload: FavoriteItem = {
    ...item,
    id: item.slug,
    createdAt: existing?.createdAt ?? Date.now(),
  }
  store.put(payload)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  return payload
}

export async function removeFavorite(slug: string) {
  const db = await openDB()
  const tx = db.transaction(FAVORITES_STORE, "readwrite")
  tx.objectStore(FAVORITES_STORE).delete(slug)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function listFavorites() {
  const db = await openDB()
  const tx = db.transaction(FAVORITES_STORE, "readonly")
  const store = tx.objectStore(FAVORITES_STORE)
  const favorites = await requestToPromise<FavoriteItem[]>(store.getAll())
  return favorites.sort((a, b) => b.createdAt - a.createdAt)
}

export async function exportFavorites(): Promise<FavoritesExport> {
  const db = await openDB()
  const tx = db.transaction([FAVORITES_STORE], "readonly")
  const favoritesStore = tx.objectStore(FAVORITES_STORE)
  const favorites = await requestToPromise<FavoriteItem[]>(favoritesStore.getAll())
  return { favorites }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function importFavorites(
  data: unknown,
  mode: "replace" | "merge" = "replace"
) {
  if (!isRecord(data) || !Array.isArray(data.favorites)) {
    throw new Error("导入数据格式不正确")
  }
  const favorites = data.favorites.filter((f) => isRecord(f) && typeof f.slug === "string") as FavoriteItem[]

  const db = await openDB()
  const tx = db.transaction([FAVORITES_STORE], "readwrite")
  const favoritesStore = tx.objectStore(FAVORITES_STORE)

  if (mode === "replace") {
    favoritesStore.clear()
  }

  const now = Date.now()
  favorites.forEach((fav) => {
    const id = fav.slug || fav.id || generateId()
    favoritesStore.put({
      id,
      slug: fav.slug,
      createdAt: fav.createdAt ?? now,
    })
  })

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

}

