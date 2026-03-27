import { VinylRecord } from '../types';

const STORAGE_KEY = 'vinylverse-crate';
const MAX_ITEMS = 200;

function readCrate(): VinylRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCrate(items: VinylRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCrate(): VinylRecord[] {
  return readCrate();
}

export function addToCrate(vinyl: VinylRecord): void {
  const crate = readCrate();
  if (crate.some(v => v.id === vinyl.id)) return;
  crate.unshift(vinyl);
  if (crate.length > MAX_ITEMS) crate.length = MAX_ITEMS;
  writeCrate(crate);
}

export function removeFromCrate(id: string): void {
  const crate = readCrate().filter(v => v.id !== id);
  writeCrate(crate);
}

export function isInCrate(id: string): boolean {
  return readCrate().some(v => v.id === id);
}

// --- Vinyl Condition Persistence ---
const CONDITION_KEY = 'vinylverse-conditions';

function readConditions(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CONDITION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getCondition(id: string): number {
  return readConditions()[id] ?? 0.3;
}

export function improveCondition(id: string): number {
  const conditions = readConditions();
  const current = conditions[id] ?? 0.3;
  const next = Math.min(1, current + 0.2);
  conditions[id] = next;
  localStorage.setItem(CONDITION_KEY, JSON.stringify(conditions));
  return next;
}
