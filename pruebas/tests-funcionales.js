// Pruebas funcionales completas: tareas + calendario con localStorage.
// Simula un navegador mínimo (DOM + localStorage) en Node. Sin dependencias.
// Ejecutar: node tests-funcionales.js
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// ------------------- Entorno simulado -------------------
function makeElement(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    attributes: {},
    listeners: {},
    _text: '',
    _classes: [],
    checked: false,
    value: '',
    hidden: false,
    className: '',
    type: ''
  };
  Object.defineProperty(el, 'textContent', {
    get() { return el._text; },
    set(v) { el._text = String(v); }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return ''; },
    set(v) { if (v === '') { el.children = []; el._text = ''; } }
  });
  el.classList = {
    add(...cs) { cs.forEach((c) => { if (el._classes.indexOf(c) === -1) el._classes.push(c); }); el.className = el._classes.join(' '); },
    remove(...cs) { cs.forEach((c) => { const i = el._classes.indexOf(c); if (i !== -1) el._classes.splice(i, 1); }); el.className = el._classes.join(' '); },
    contains(c) { return el._classes.indexOf(c) !== -1; }
  };
  el.querySelectorAll = () => [];
  el.appendChild = (c) => { el.children.push(c); return c; };
  el.setAttribute = (k, v) => { el.attributes[k] = v; };
  el.getAttribute = (k) => el.attributes[k];
  el.removeAttribute = (k) => { delete el.attributes[k]; };
  el.addEventListener = (ev, fn) => { el.listeners[ev] = fn; };
  el.dispatch = (ev, arg) => { if (el.listeners[ev]) el.listeners[ev](arg); };
  el.focus = () => {};
  el.blur = () => {};
  return el;
}

function buildDom(ids) {
  const els = {};
  ids.forEach((id) => {
    const el = makeElement();
    el.id = id; // replica el atributo id real de cada elemento
    els[id] = el;
  });
  const body = makeElement('body');
  return {
    document: {
      body,
      getElementById(id) { return els[id] || null; },
      createElement(tag) { return makeElement(tag); },
      createTextNode(text) {
        const n = makeElement('#text');
        n._text = String(text);
        n.isTextNode = true;
        return n;
      }
    },
    els
  };
}

// Ejecuta varios scripts en el MISMO contexto global (como en el navegador).
function runScripts(filenames, sandbox) {
  const sb = Object.assign({
    console,
    setTimeout,
    clearTimeout,
    window: null
  }, sandbox);
  sb.window = sb;
  vm.createContext(sb);
  filenames.forEach((f) => {
    const code = fs.readFileSync(path.join(__dirname, f), 'utf8');
    vm.runInContext(code, sb, { filename: f });
  });
  return sb;
}

let fails = 0;
function check(cond, msg) {
  if (cond) console.log('  OK:', msg);
  else { fails++; console.error('  FALLO:', msg); }
}

function freshStoreSandbox(seed) {
  const storage = new Map();
  if (seed) storage.set('tasks', seed);
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
    _map: storage
  };
  return { localStorageMock, storage };
}

// ============================================================================
// STORE (datos/almacenamiento.js)
// ============================================================================
console.log('\n=== Store: persistencia y migración ===');
{
  const { localStorageMock, storage } = freshStoreSandbox();
  const sb = runScripts(['../datos/almacenamiento.js'], { localStorage: localStorageMock });
  const store = sb.TaskStore;

  store.load();
  check(store.all().length === 0, 'carga inicial sin datos -> lista vacía');

  const t1 = store.add('Tirar la basura', '2026-09-10');
  check(store.all().length === 1, 'añadir tarea funciona');
  check(t1.text === 'Tirar la basura' && t1.dueDate === '2026-09-10' && t1.completed === false,
    'la tarea guarda text, dueDate, completed');
  check(t1.createdAt && typeof t1.createdAt === 'string', 'la tarea guarda createdAt');
  const raw = JSON.parse(localStorageMock.getItem('tasks'));
  check(raw.length === 1 && raw[0].dueDate === '2026-09-10', 'se persiste en localStorage con dueDate');
  check(['id', 'text', 'completed', 'createdAt', 'dueDate'].every((k) => k in raw[0]),
    'los campos id, text, completed, createdAt, dueDate están en localStorage');

  store.add('Tarea A día 10', '2026-09-10');
  store.add('Tarea del día 25', '2026-09-25');
  check(store.all().length === 3, 'se añaden varias tareas');

  const firstId = store.all()[0].id;
  store.toggle(firstId);
  check(store.all()[0].completed === true, 'toggle marca completada');
  check(JSON.parse(localStorageMock.getItem('tasks'))[0].completed === true, 'toggle persiste en localStorage');
  store.toggle(firstId);
  check(store.all()[0].completed === false, 'toggle desmarca');

  store.remove(firstId);
  check(store.all().length === 2, 'eliminar tarea funciona');
  check(JSON.parse(localStorageMock.getItem('tasks')).length === 2, 'eliminar persiste en localStorage');

  let notified = 0;
  const unsub = store.subscribe(() => { notified++; });
  store.add('Notificar', '2026-09-10');
  check(notified === 1, 'subscribe notifica al añadir');
  store.toggle(store.all()[2].id);
  check(notified === 2, 'subscribe notifica al completar');
  unsub();
  store.add('Sin notificar', '2026-09-10');
  check(notified === 2, 'unsubscribe detiene notificaciones');
}

console.log('\n=== Store: migración de tareas antiguas ===');
{
  const oldData = JSON.stringify([
    { id: 1, text: 'Tarea vieja', completed: false },
    { id: 2, text: 'Vieja completada', completed: true }
  ]);
  const { localStorageMock } = freshStoreSandbox(oldData);
  const sb = runScripts(['../datos/almacenamiento.js'], { localStorage: localStorageMock });
  const store = sb.TaskStore;
  store.load();
  const tasks = store.all();
  check(tasks.length === 2, 'las tareas antiguas NO se eliminan al migrar');
  check(tasks[0].text === 'Tarea vieja' && tasks[0].dueDate === null, 'dueDate = null en tareas antiguas');
  check(tasks[0].createdAt && typeof tasks[0].createdAt === 'string', 'se asigna createdAt en la migración');
  check(tasks[1].completed === true, 'se conserva el estado completed');
}

{
  const { localStorageMock } = freshStoreSandbox('{invalid json!!');
  const sb = runScripts(['../datos/almacenamiento.js'], { localStorage: localStorageMock });
  const store = sb.TaskStore;
  store.load();
  check(store.all().length === 0, 'JSON inválido -> carga sin errores');
}

// ============================================================================
// PÁGINA TAREAS (app.js)
// ============================================================================
console.log('\n=== Página Tareas: formulario y render ===');

function loadTasksPage(seed) {
  const storage = new Map();
  if (seed) storage.set('tasks', seed);
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    _map: storage
  };
  const ids = ['task-form', 'task-input', 'due-date-input', 'task-list', 'empty-state', 'task-input-error', 'due-date-input-error'];
  const { document, els } = buildDom(ids);
  runScripts(['../datos/almacenamiento.js', '../tareas/tareas.js'], { localStorage: localStorageMock, document });
  const form = els['task-form'];
  const submit = (text, date) => {
    els['task-input'].value = text;
    els['due-date-input'].value = date || '';
    form.dispatch('submit', { preventDefault() {} });
  };
  return { storage, localStorageMock, els, submit };
}

{
  const page = loadTasksPage();
  page.submit('Tarea sin fecha', '');
  check(page.storage.get('tasks') === undefined, 'submit sin fecha límite NO crea tarea');
  check(page.els['task-list'].children.length === 0, 'no se renderiza nada sin fecha límite');
  page.submit('', '2026-09-10');
  check(page.storage.get('tasks') === undefined, 'submit con fecha pero sin texto NO crea tarea');
  page.submit('Comprar leche', '2026-09-15');
  check(page.storage.get('tasks') !== undefined, 'submit válido crea la tarea');
  const saved = JSON.parse(page.storage.get('tasks'));
  check(saved[0].text === 'Comprar leche' && saved[0].dueDate === '2026-09-15',
    'la tarea guarda texto y fecha límite correctamente');
  check(page.els['task-list'].children.length === 1, 'la tarea aparece en la lista');
  check(page.els['empty-state'].style.display === 'none', 'el estado vacío se oculta con tareas');

  const page2 = loadTasksPage(page.storage.get('tasks'));
  check(page2.els['task-list'].children.length === 1, 'tras recargar la página la tarea sigue');
}

{
  const oldData = JSON.stringify([{ id: 77, text: 'Legacy sin fecha', completed: false }]);
  const page = loadTasksPage(oldData);
  check(page.els['task-list'].children.length === 1, 'una tarea antigua sin dueDate se muestra en Tareas');
}

// Validación accesible: mensajes + aria-invalid / aria-describedby
console.log('\n=== Página Tareas: validación accesible ===');
{
  const page = loadTasksPage();

  // Fecha vacía -> error en el campo de fecha
  page.submit('Tarea de prueba', '');
  const fecha = page.els['due-date-input'];
  const fechaError = page.els['due-date-input-error'];
  check(fecha.getAttribute('aria-invalid') === 'true', 'sin fecha -> el campo de fecha marca aria-invalid="true"');
  check(fecha.getAttribute('aria-describedby') === 'due-date-input-error', 'sin fecha -> aria-describedby apunta al mensaje');
  check(fechaError.hidden === false, 'sin fecha -> el mensaje de error se muestra');
  check(fechaError.textContent !== '', 'sin fecha -> el mensaje de error tiene texto');

  // Texto vacío -> error en el campo de texto
  page.submit('', '2026-09-10');
  const texto = page.els['task-input'];
  const textoError = page.els['task-input-error'];
  check(texto.getAttribute('aria-invalid') === 'true', 'sin texto -> el campo de texto marca aria-invalid="true"');
  check(texto.getAttribute('aria-describedby') === 'task-input-error', 'sin texto -> aria-describedby apunta al mensaje');
  check(textoError.hidden === false && textoError.textContent !== '', 'sin texto -> el mensaje de error se muestra');

  // Al corregir la fecha, el estado de error se limpia
  page.els['due-date-input'].dispatch('change');
  check(fecha.getAttribute('aria-invalid') === undefined, 'al corregir -> se elimina aria-invalid');
  check(fecha.getAttribute('aria-describedby') === undefined, 'al corregir -> se elimina aria-describedby');
  check(fechaError.hidden === true, 'al corregir -> el mensaje de error se oculta');

  // Al escribir el texto, el estado de error se limpia
  page.els['task-input'].dispatch('input');
  check(texto.getAttribute('aria-invalid') === undefined, 'al escribir -> se elimina aria-invalid');
  check(texto.getAttribute('aria-describedby') === undefined, 'al escribir -> se elimina aria-describedby');
  check(textoError.hidden === true, 'al escribir -> el mensaje de error se oculta');
}

// ============================================================================
// PÁGINA CALENDARIO (calendario.js)
// ============================================================================
console.log('\n=== Página Calendario: integración con tareas ===');

function renderCalendarioMonth(seed, date) {
  const storage = new Map();
  if (seed) storage.set('tasks', seed);
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    _map: storage
  };
  const ids = [
    'month-title', 'month-year', 'prev-month', 'next-month', 'today-btn',
    'calendar-grid', 'cal-empty-note', 'modal-backdrop', 'modal-task-name',
    'modal-due-date', 'modal-status', 'modal-toggle', 'modal-delete', 'modal-close'
  ];
  const { document, els } = buildDom(ids);

  const fixed = date ? new Date(date + 'T12:00:00') : new Date();
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); }
    static now() { return fixed.getTime(); }
  }
  runScripts(['../datos/almacenamiento.js', '../calendario/calendario.js'], {
    localStorage: localStorageMock,
    document,
    Date: FakeDate,
    Intl
  });

  const grid = els['calendar-grid'];
  const cells = () => grid.children;
  const monthTitle = () => els['month-title']._text;
  const monthYear = () => els['month-year']._text;

  return {
    els, cells, monthTitle, monthYear, grid,
    localStorageMock, storage,
    cellByDay: function (day) {
      const cs = cells();
      for (let i = 0; i < cs.length; i++) {
        const dayNumEl = cs[i].children && cs[i].children[0];
        if (dayNumEl && dayNumEl._text === String(day)) return cs[i];
      }
      return null;
    },
    chipsOf: function (cell) {
      const chipsWrap = cell && cell.children[1];
      if (!chipsWrap) return [];
      return chipsWrap.children.filter((c) => (c.className || '').indexOf('cal-chip') !== -1);
    },
    // Devuelve el texto del indicador "+N más" de una celda (o null si no hay).
    moreOf: function (cell) {
      const chipsWrap = cell && cell.children[1];
      if (!chipsWrap) return null;
      const more = chipsWrap.children.find((c) => (c.className || '').indexOf('cal-more') !== -1);
      return more ? more._text : null;
    }
  };
}

{
  const seed = JSON.stringify([
    { id: 1, text: 'Tirar la basura', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    { id: 2, text: 'Otra del día 10', completed: false, createdAt: '2026-09-02T10:00:00Z', dueDate: '2026-09-10' },
    { id: 3, text: 'Reunión', completed: false, createdAt: '2026-09-02T10:00:00Z', dueDate: '2026-09-25' },
    { id: 4, text: 'Completada antigua', completed: true, createdAt: '2026-08-01T10:00:00Z', dueDate: '2026-08-03' },
    { id: 5, text: 'Sin fecha (legacy)', completed: false }
  ]);
  const cal = renderCalendarioMonth(seed, '2026-09-06');

  check(cal.monthTitle() === 'septiembre' && cal.monthYear() === '2026',
    'el calendario muestra septiembre 2026 (mes de la fecha actual)');

  const day10 = cal.cellByDay(10);
  check(day10 !== null, 'el día 10 existe en la cuadrícula');
  const chips10 = cal.chipsOf(day10);
  check(chips10.length === 2, 'el día 10 muestra las 2 tareas con esa fecha límite');
  const texts10 = chips10.map((c) => c._text);
  check(texts10.indexOf('Tirar la basura') !== -1 && texts10.indexOf('Otra del día 10') !== -1,
    'las tareas del día 10 tienen el nombre correcto');

  const chips25 = cal.chipsOf(cal.cellByDay(25));
  check(chips25.length === 1 && chips25[0]._text === 'Reunión', 'el día 25 muestra su tarea');

  check(cal.cellByDay(3) !== null, 'el día 3 existe en septiembre (30 días)');

  const allChips = [];
  cal.cells().forEach((c) => allChips.push(...cal.chipsOf(c)));
  check(allChips.every((c) => c._text.indexOf('Completada antigua') === -1),
    'las tareas de otros meses no aparecen en el mes actual');

  const day6 = cal.cellByDay(6);
  check(day6 && (day6.children[0].className || '').indexOf('cal-today') !== -1,
    'el día actual se resalta');

  cal.els['next-month'].dispatch('click');
  check(cal.monthTitle() === 'octubre' && cal.monthYear() === '2026', 'avanzar mes -> octubre 2026');
  cal.els['prev-month'].dispatch('click');
  cal.els['prev-month'].dispatch('click');
  check(cal.monthTitle() === 'agosto' && cal.monthYear() === '2026', 'retroceder dos meses -> agosto 2026');
  const augChips = [];
  cal.cells().forEach((c) => augChips.push(...cal.chipsOf(c)));
  check(augChips.some((c) => c._text.indexOf('Completada antigua') !== -1), 'agosto muestra su tarea completada');
  check(augChips.some((c) => (c.className || '').indexOf('cal-chip-done') !== -1),
    'la tarea completada tiene estilo diferenciado (chip completado)');
  cal.els['today-btn'].dispatch('click');
  check(cal.monthTitle() === 'septiembre' && cal.monthYear() === '2026', 'botón "hoy" vuelve al mes actual');

  const chip = cal.chipsOf(cal.cellByDay(10))[0];
  chip.dispatch('click');
  check(cal.els['modal-backdrop'].hidden === false, 'al hacer clic en una tarea se abre el modal');
  check(cal.els['modal-task-name']._text === 'Tirar la basura', 'el modal muestra el nombre de la tarea');
  check(cal.els['modal-due-date']._text.indexOf('10') !== -1, 'el modal muestra la fecha límite');
  check(cal.els['modal-status']._text === 'Pendiente', 'el modal muestra el estado pendiente');

  cal.els['modal-toggle'].dispatch('click');
  const updated = JSON.parse(cal.storage.get('tasks'));
  check(updated[0].completed === true, 'marcar completada desde el calendario actualiza localStorage');
  check(cal.els['modal-status']._text === 'Completada', 'el modal se actualiza a Completada');
  const chipAfter = cal.chipsOf(cal.cellByDay(10))[0];
  check((chipAfter.className || '').indexOf('cal-chip-done') !== -1,
    'el chip en el calendario cambia a estilo completado');
  cal.els['modal-toggle'].dispatch('click');
  check(JSON.parse(cal.storage.get('tasks'))[0].completed === false, 'se puede desmarcar desde el calendario');

  const chipToDelete = cal.chipsOf(cal.cellByDay(10)).find((c) => c._text === 'Otra del día 10');
  chipToDelete.dispatch('click');
  check(cal.els['modal-task-name']._text === 'Otra del día 10', 'el modal muestra la segunda tarea');
  cal.els['modal-delete'].dispatch('click');
  const afterDelete = JSON.parse(cal.storage.get('tasks'));
  check(afterDelete.every((t) => t.text !== 'Otra del día 10'), 'eliminar desde el calendario actualiza localStorage');
  const chipsAfterDelete = cal.chipsOf(cal.cellByDay(10));
  check(chipsAfterDelete.length === 1 && chipsAfterDelete[0]._text === 'Tirar la basura',
    'el calendario se repinta sin la tarea eliminada');

  cal.els['modal-close'].dispatch('click');
  check(cal.els['modal-backdrop'].hidden === true, 'cerrar modal funciona');

  check(cal.cellByDay(30) !== null, 'el calendario sigue mostrando todos los días del mes');
}

// ============================================================================
// LÍMITE DE CHIPS POR DÍA ("+N más")
// ============================================================================
console.log('\n=== Calendario: límite de chips por día ===');
{
  // Tareas repartidas para probar 0, 1, 3, 4 y 5 tareas en un mismo día.
  const seed = JSON.stringify([
    // Día 10: 5 tareas -> 3 chips + "+2 más"
    { id: 100, text: 'D10-a', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    { id: 101, text: 'D10-b', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    { id: 102, text: 'D10-c', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    { id: 103, text: 'D10-d', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    { id: 104, text: 'D10-e', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-10' },
    // Día 11: 4 tareas -> 3 chips + "+1 más"
    { id: 200, text: 'D11-a', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-11' },
    { id: 201, text: 'D11-b', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-11' },
    { id: 202, text: 'D11-c', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-11' },
    { id: 203, text: 'D11-d', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-11' },
    // Día 12: 3 tareas -> 3 chips y sin "+N más"
    { id: 300, text: 'D12-a', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-12' },
    { id: 301, text: 'D12-b', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-12' },
    { id: 302, text: 'D12-c', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-12' },
    // Día 14: 1 tarea -> 1 chip y sin "+N más"
    { id: 400, text: 'D14-a', completed: false, createdAt: '2026-09-01T10:00:00Z', dueDate: '2026-09-14' }
    // Día 13 queda sin tareas (0 tareas)
  ]);
  const cal = renderCalendarioMonth(seed, '2026-09-06');

  // 5 tareas -> 3 chips + "+2 más"
  const d10 = cal.cellByDay(10);
  check(cal.chipsOf(d10).length === 3, '5 tareas -> se muestran 3 chips');
  check(cal.moreOf(d10) === '+2 más', '5 tareas -> indicador "+2 más"');

  // 4 tareas -> 3 chips + "+1 más"
  const d11 = cal.cellByDay(11);
  check(cal.chipsOf(d11).length === 3, '4 tareas -> se muestran 3 chips');
  check(cal.moreOf(d11) === '+1 más', '4 tareas -> indicador "+1 más"');

  // 3 tareas -> 3 chips y NO aparece "+N más"
  const d12 = cal.cellByDay(12);
  check(cal.chipsOf(d12).length === 3, '3 tareas -> se muestran 3 chips');
  check(cal.moreOf(d12) === null, '3 tareas -> no aparece "+N más"');

  // 0 tareas -> sin chips y sin "+N más"
  const d13 = cal.cellByDay(13);
  check(cal.chipsOf(d13).length === 0, '0 tareas -> no hay chips');
  check(cal.moreOf(d13) === null, '0 tareas -> no aparece "+N más"');

  // 1 tarea -> 1 chip y sin "+N más"
  const d14 = cal.cellByDay(14);
  check(cal.chipsOf(d14).length === 1, '1 tarea -> se muestra 1 chip');
  check(cal.moreOf(d14) === null, '1 tarea -> no aparece "+N más"');

  // Las tareas no mostradas no deben existir como botones interactivos.
  const textosD10 = cal.chipsOf(d10).map((c) => c._text);
  check(textosD10.indexOf('D10-d') === -1 && textosD10.indexOf('D10-e') === -1,
    'las tareas 4ª y 5ª del día no se renderizan como chips');
  const textosD11 = cal.chipsOf(d11).map((c) => c._text);
  check(textosD11.indexOf('D11-d') === -1, 'la 4ª tarea del día no se renderiza como chip');
}

// ============================================================================
// PERSISTENCIA: error de guardado en localStorage (modo privado / cuota llena)
// ============================================================================
console.log('\n=== Persistencia: fallo de guardado en localStorage ===');

// Simula que localStorage no permite escribir (p. ej. cuota llena o privado).
function storageQueFallaEnEscritura() {
  return {
    getItem: () => null,
    setItem: () => { throw new Error('QuotaExceededError'); },
    removeItem: () => {},
    clear: () => {}
  };
}

{
  // 1) A nivel de TaskStore: onSaveError se notifica y add() no lanza.
  const sb = runScripts(['../datos/almacenamiento.js'], { localStorage: storageQueFallaEnEscritura() });
  const store = sb.TaskStore;
  let erroresNotificados = 0;
  store.onSaveError(() => { erroresNotificados++; });

  let lanzado = false;
  try {
    store.add('Tarea que no puede guardarse', '2026-09-10');
  } catch (e) {
    lanzado = true;
  }

  check(lanzado === false, 'un fallo de guardado no propaga una excepción al flujo normal');
  check(erroresNotificados === 1, 'TaskStore.onSaveError se notifica cuando setItem falla');
}

{
  // 2) A nivel de UI: aviso.js crea un elemento role="alert" con el mensaje.
  const { document } = buildDom([]);
  const sb = runScripts(
    ['../datos/almacenamiento.js', '../componentes/aviso/aviso.js'],
    { localStorage: storageQueFallaEnEscritura(), document }
  );

  // Provocar un guardado fallido tras la carga del componente.
  sb.TaskStore.add('Otra tarea que no puede guardarse', '2026-09-11');

  const aviso = document.body.children.find(
    (c) => (c.attributes || {}).role === 'alert'
  );
  check(!!aviso, 'aviso.js añade al DOM un elemento con role="alert"');
  check(aviso && aviso._text.indexOf('No se pudieron guardar') !== -1,
    'el aviso muestra un mensaje de error legible');
}

console.log(fails === 0
  ? '\nRESULTADO: TODAS LAS PRUEBAS PASARON ✔'
  : `\nRESULTADO: ${fails} PRUEBA(S) FALLARON ✘`);
process.exit(fails === 0 ? 0 : 1);
