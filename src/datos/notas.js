// -----------------------------------------------------------------------------
// src/datos/notas.js — Capa de datos de las notas. Cada nota tiene un título, una
// descripción, una fecha automática (el día en que se crea) y un indicador de si
// debe aparecer en el calendario. Persiste en localStorage (clave 'notes'),
// independiente de las tareas. Igual que TaskStore, está aislada para poder
// sustituirla por Supabase en el futuro sin tocar los componentes.
// -----------------------------------------------------------------------------

import { hoyISO } from './fechas';

const STORAGE_KEY = 'notes';

// Lista en memoria (fuente de verdad durante la sesión)
let notes = [];
// Suscriptores: funciones que se llaman tras cualquier cambio de datos
const listeners = [];
// Suscriptores de error de guardado
const saveErrorListeners = [];

// Contador interno para ids únicos ante creaciones simultáneas
let lastGeneratedId = 0;

function notify() {
  listeners.forEach((fn) => {
    try { fn(notes); } catch (e) { console.error(e); }
  });
}

function notifySaveError(error) {
  saveErrorListeners.forEach((fn) => {
    try { fn(error); } catch (e) { console.error(e); }
  });
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('No se pudieron guardar las notas en localStorage:', error);
    notifySaveError(error);
    return false;
  }
}

// Normaliza una nota leída de localStorage. Las notas antiguas sin fecha
// reciben la fecha de hoy y showInCalendar queda en false si no venía.
function normalize(raw) {
  const note = {
    id: (typeof raw.id === 'number' || typeof raw.id === 'string') ? raw.id : lastIdFallback(),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    date: raw.date ? String(raw.date) : hoyISO(),
    createdAt: raw.createdAt ? raw.createdAt : new Date().toISOString(),
    showInCalendar: Boolean(raw.showInCalendar)
  };
  if (typeof note.id === 'number' && note.id > lastGeneratedId) {
    lastGeneratedId = note.id;
  }
  return note;
}

function lastIdFallback() {
  lastGeneratedId += 1;
  return lastGeneratedId;
}

export const NoteStore = {
  // Carga las notas desde localStorage (recupera y normaliza datos antiguos).
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        notes = [];
        return notes;
      }
      const parsed = JSON.parse(stored);
      notes = Array.isArray(parsed) ? parsed.map(normalize) : [];
    } catch (error) {
      console.error('No se pudieron recuperar las notas de localStorage:', error);
      notes = [];
    }
    return notes;
  },

  // Lista actual en memoria (ya normalizada)
  all() {
    return notes;
  },

  // Suscripción a cambios de datos. Devuelve función para cancelarla.
  subscribe(fn) {
    listeners.push(fn);
    return function () {
      const i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  },

  // Suscripción a errores al guardar. Devuelve función para cancelarla.
  onSaveError(fn) {
    saveErrorListeners.push(fn);
    return function () {
      const i = saveErrorListeners.indexOf(fn);
      if (i !== -1) saveErrorListeners.splice(i, 1);
    };
  },

  // Añade una nota. La fecha es automática (hoy) salvo que se indique otra.
  add(title, description, showInCalendar, fecha) {
    lastGeneratedId = Math.max(lastGeneratedId, notes.reduce((m, n) => Math.max(m, typeof n.id === 'number' ? n.id : 0), 0));
    const now = Date.now();
    const id = now > lastGeneratedId ? now : ++lastGeneratedId;

    const note = {
      id: id,
      title: title,
      description: String(description || ''),
      date: fecha ? String(fecha) : hoyISO(),
      createdAt: new Date(now).toISOString(),
      showInCalendar: Boolean(showInCalendar)
    };
    notes.push(note);
    save();
    notify();
    return note;
  },

  // Elimina una nota por su id
  remove(id) {
    notes = notes.filter((n) => n.id !== id);
    save();
    notify();
  },

  // Activa / desactiva la aparición de la nota en el calendario
  toggleCalendar(id) {
    notes = notes.map((n) => (n.id === id ? { ...n, showInCalendar: !n.showInCalendar } : n));
    save();
    notify();
  }
};
