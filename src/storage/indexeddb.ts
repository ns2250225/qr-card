// 本地草稿存储:IndexedDB,数据只存在用户浏览器
// 私密模式下 IndexedDB 可能不可用,自动回退到内存存储
import type { DraftCard } from '../types'

const DB_NAME = 'qrcard'
const DB_VERSION = 1
const STORE = 'cards'

const memory = new Map<string, DraftCard>()
let useMemory = false
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 打开失败'))
  })
  return dbPromise
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function dbListCards(): Promise<DraftCard[]> {
  try {
    if (useMemory) return [...memory.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    const all = await withStore<DraftCard[]>('readonly', (s) => s.getAll())
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    useMemory = true
    return [...memory.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

export async function dbPutCard(card: DraftCard): Promise<void> {
  try {
    if (useMemory) {
      memory.set(card.id, card)
      return
    }
    await withStore('readwrite', (s) => s.put(card))
  } catch {
    useMemory = true
    memory.set(card.id, card)
  }
}

export async function dbDeleteCard(id: string): Promise<void> {
  try {
    if (useMemory) {
      memory.delete(id)
      return
    }
    await withStore('readwrite', (s) => s.delete(id))
  } catch {
    useMemory = true
    memory.delete(id)
  }
}

export async function dbClearCards(): Promise<void> {
  try {
    if (useMemory) {
      memory.clear()
      return
    }
    await withStore('readwrite', (s) => s.clear())
  } catch {
    useMemory = true
    memory.clear()
  }
}

export function newCardId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
