// -----------------------------------------------------------------------------
// datos/almacenamiento.js — Capa de datos compartida entre la página "Tareas" y
// "Calendario". Usa exclusivamente localStorage del navegador (sin servicios
// externos). Expone un objeto global TaskStore con las operaciones CRUD y un
// mecanismo mínimo de suscripción para que ambas páginas se mantengan al día.
// -----------------------------------------------------------------------------

(function (global) {
  'use strict';

  const STORAGE_KEY = 'tasks';

  // Lista en memoria (fuente de verdad durante la sesión)
  let tasks = [];
  // Suscriptores: funciones que se llaman tras cualquier cambio de datos
  const listeners = [];
  // Suscriptores de error de guardado: se llaman si localStorage falla al guardar
  const saveErrorListeners = [];

  // Contador interno para ids únicos ante creaciones simultáneas
  let lastGeneratedId = 0;

  function notify() {
    listeners.forEach((fn) => {
      try { fn(tasks); } catch (e) { console.error(e); }
    });
  }

  function notifySaveError(error) {
    saveErrorListeners.forEach((fn) => {
      try { fn(error); } catch (e) { console.error(e); }
    });
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('No se pudieron guardar las tareas en localStorage:', error);
      notifySaveError(error);
      return false;
    }
  }

  // Normaliza una tarea leída de localStorage:
  //  - tareas antiguas sin createdAt -> se les asigna la fecha de migración
  //  - tareas antiguas sin dueDate -> dueDate queda null (sin fecha límite)
  function normalize(raw) {
    const task = {
      id: (typeof raw.id === 'number' || typeof raw.id === 'string') ? raw.id : lastIdFallback(),
      text: String(raw.text || ''),
      completed: Boolean(raw.completed),
      createdAt: raw.createdAt ? raw.createdAt : new Date().toISOString(),
      dueDate: raw.dueDate ? String(raw.dueDate) : null
    };
    if (typeof task.id === 'number' && task.id > lastGeneratedId) {
      lastGeneratedId = task.id;
    }
    return task;
  }

  function lastIdFallback() {
    lastGeneratedId += 1;
    return lastGeneratedId;
  }

  const TaskStore = {
    // Carga las tareas desde localStorage (recupera y normaliza datos antiguos).
    load: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          tasks = [];
          return tasks;
        }
        const parsed = JSON.parse(stored);
        tasks = Array.isArray(parsed) ? parsed.map(normalize) : [];
      } catch (error) {
        console.error('No se pudieron recuperar las tareas de localStorage:', error);
        tasks = [];
      }
      return tasks;
    },

    // Lista actual en memoria (ya normalizada)
    all: function () {
      return tasks;
    },

    // Suscripción a cambios de datos. Devuelve función para cancelarla.
    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i !== -1) listeners.splice(i, 1);
      };
    },

    // Suscripción a errores al guardar (localStorage no disponible/lleno).
    // Devuelve función para cancelarla.
    onSaveError: function (fn) {
      saveErrorListeners.push(fn);
      return function () {
        const i = saveErrorListeners.indexOf(fn);
        if (i !== -1) saveErrorListeners.splice(i, 1);
      };
    },

    // Añade una tarea. dueDate debe ser 'YYYY-MM-DD' o null.
    add: function (text, dueDate) {
      lastGeneratedId = Math.max(lastGeneratedId, tasks.reduce((m, t) => Math.max(m, typeof t.id === 'number' ? t.id : 0), 0));
      const now = Date.now();
      const id = now > lastGeneratedId ? now : ++lastGeneratedId;

      const task = {
        id: id,
        text: text,
        completed: false,
        createdAt: new Date(now).toISOString(),
        dueDate: dueDate ? String(dueDate) : null
      };
      tasks.push(task);
      save();
      notify();
      return task;
    },

    // Marca / desmarca una tarea como completada
    toggle: function (id) {
      tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      save();
      notify();
    },

    // Elimina una tarea por su id
    remove: function (id) {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      notify();
    },

    // Formatea una fecha 'YYYY-MM-DD' como "10 de septiembre de 2026"
    formatDueDate: function (dueDate) {
      if (!dueDate) return '';
      const m = String(dueDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return String(dueDate);
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    }
  };

  global.TaskStore = TaskStore;
})(window);
