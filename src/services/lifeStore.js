// Local-first storage layer for Life Command Centre.
// Core app data stays on-device; AI is never required for CRUD/tracking.

const PREFIX = "life-centre:";

function key(name) {
  return `${PREFIX}${name}`;
}

export function readJSON(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[LifeStore] Could not read ${name}; using fallback.`, error);
    return fallback;
  }
}

export function writeJSON(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[LifeStore] Could not write ${name}.`, error);
    return false;
  }
}

export function remove(name) {
  try {
    localStorage.removeItem(key(name));
    return true;
  } catch (error) {
    console.warn(`[LifeStore] Could not remove ${name}.`, error);
    return false;
  }
}

export function exportLifeData() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const storageKey = localStorage.key(i);
      if (!storageKey?.startsWith(PREFIX)) continue;
      const name = storageKey.slice(PREFIX.length);
      data[name] = readJSON(name, null);
    }
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
  } catch (error) {
    console.warn("[LifeStore] Export failed.", error);
    return { schemaVersion: 1, exportedAt: new Date().toISOString(), data: {} };
  }
}

export function importLifeData(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || !snapshot.data || typeof snapshot.data !== "object") {
    throw new Error("Invalid Life Centre backup file.");
  }

  Object.entries(snapshot.data).forEach(([name, value]) => {
    if (!name || name.length > 100) return;
    writeJSON(name, value);
  });
}
