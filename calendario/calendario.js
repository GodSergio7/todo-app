// -----------------------------------------------------------------------------
// Página "Calendario": calendario mensual con las tareas según su fecha límite.
// Los datos viven en TaskStore (datos/almacenamiento.js), mismo localStorage que la
// página "Tareas". Cambios desde aquí (completar/eliminar) se reflejan allí.
// -----------------------------------------------------------------------------

// Referencias a elementos del DOM
const monthTitleEl = document.getElementById('month-title');
const monthYearEl = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const calendarGrid = document.getElementById('calendar-grid');
const calEmptyNote = document.getElementById('cal-empty-note');

// Modal
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTaskName = document.getElementById('modal-task-name');
const modalDueDate = document.getElementById('modal-due-date');
const modalStatus = document.getElementById('modal-status');
const modalToggleBtn = document.getElementById('modal-toggle');
const modalDeleteBtn = document.getElementById('modal-delete');
const modalCloseBtn = document.getElementById('modal-close');

// Mes que se está visualizando (se muestra como {year, month}, month 0-11)
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();
// Tarea abierta en el modal (id o null)
let modalTaskId = null;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// ---------- Utilidades de fecha ----------
const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function esc(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ---------- Render del calendario ----------
function renderCalendar() {
  calendarGrid.innerHTML = '';
  calEmptyNote.hidden = true;

  monthTitleEl.textContent = MESES[viewMonth];
  monthYearEl.textContent = viewYear;

  const today = new Date();
  const year = viewYear;
  const month = viewMonth;
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=dom,1=lun...6=sáb
  const offset = (firstWeekday + 6) % 7; // lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Agrupar tareas por fecha límite (solo las que tienen dueDate)
  const tasks = TaskStore.all();
  const byDate = new Map();
  let tasksInMonth = 0;
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const due = String(t.dueDate);
    if (byDate.has(due)) byDate.get(due).push(t);
    else byDate.set(due, [t]);
    if (due.startsWith(`${year}-${pad2(month + 1)}-`)) tasksInMonth += 1;
  });

  let dayCells = 0;

  // Celdas vacías de días del mes anterior
  for (let i = 0; i < offset; i++) {
    const padCell = document.createElement('div');
    padCell.className = 'cal-cell cal-cell-empty';
    calendarGrid.appendChild(padCell);
  }

  // Días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells++;
    const iso = toISO(year, month, d);
    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = d;
    if (isSameDay(today, new Date(year, month, d))) {
      num.classList.add('cal-today');
    }
    cell.appendChild(num);

    const dayTasks = byDate.get(iso) || [];
    if (dayTasks.length > 0) {
      const chipsWrap = document.createElement('div');
      chipsWrap.className = 'cal-chips';

      // Mostrar como máximo 3 chips directamente; el resto se resume en "+N más".
      const MAX_CHIPS = 3;
      const visibles = dayTasks.slice(0, MAX_CHIPS);
      const restantes = dayTasks.length - MAX_CHIPS;

      visibles.forEach((t) => chipsWrap.appendChild(buildChip(t)));

      // Solo se añade "+N más" si quedan tareas sin mostrar (nunca para 0-3).
      if (restantes > 0) {
        const moreEl = document.createElement('div');
        moreEl.className = 'cal-more';
        moreEl.textContent = `+${restantes} más`;
        chipsWrap.appendChild(moreEl);
      }

      cell.appendChild(chipsWrap);
    }

    calendarGrid.appendChild(cell);
  }

  // Completar la última semana
  const used = offset + daysInMonth;
  const remainder = used % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      const padCell = document.createElement('div');
      padCell.className = 'cal-cell cal-cell-empty';
      calendarGrid.appendChild(padCell);
    }
  }

  if (dayCells > 0 && tasksInMonth === 0) {
    calEmptyNote.hidden = false;
  }
}

function buildChip(task) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = `cal-chip ${task.completed ? 'cal-chip-done' : 'cal-chip-pending'}`;
  chip.title = task.text;
  chip.textContent = task.completed ? `✓ ${task.text}` : task.text;
  chip.addEventListener('click', () => openModal(task.id));
  return chip;
}

// ---------- Navegación de meses ----------
function goPrevMonth() {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar();
}

function goNextMonth() {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar();
}

function goToday() {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  renderCalendar();
}

prevMonthBtn.addEventListener('click', goPrevMonth);
nextMonthBtn.addEventListener('click', goNextMonth);
todayBtn.addEventListener('click', goToday);

// ---------- Modal de detalle de tarea ----------
function taskById(id) {
  return TaskStore.all().find((t) => t.id === id) || null;
}

function openModal(id) {
  const task = taskById(id);
  if (!task) return;
  modalTaskId = id;

  modalTaskName.textContent = task.text;
  modalDueDate.textContent = TaskStore.formatDueDate(task.dueDate) || 'Sin fecha límite';
  modalStatus.textContent = task.completed ? 'Completada' : 'Pendiente';
  modalStatus.className = task.completed ? 'modal-status status-done' : 'modal-status status-pending';
  modalToggleBtn.textContent = task.completed ? 'Marcar como pendiente' : 'Marcar como completada';

  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalBackdrop.hidden = true;
  modalTaskId = null;
  document.body.style.overflow = '';
}

function refreshModal() {
  const task = taskById(modalTaskId);
  if (!task) {
    closeModal();
    return;
  }
  modalStatus.textContent = task.completed ? 'Completada' : 'Pendiente';
  modalStatus.className = task.completed ? 'modal-status status-done' : 'modal-status status-pending';
  modalToggleBtn.textContent = task.completed ? 'Marcar como pendiente' : 'Marcar como completada';
}

modalCloseBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

modalToggleBtn.addEventListener('click', () => {
  if (modalTaskId !== null) TaskStore.toggle(modalTaskId);
});

modalDeleteBtn.addEventListener('click', () => {
  if (modalTaskId !== null) TaskStore.remove(modalTaskId);
});

// Repintar calendario y modal cuando cambian los datos (desde cualquier página)
TaskStore.subscribe(() => {
  renderCalendar();
  if (modalTaskId !== null) refreshModal();
});

// ---------- Inicialización ----------
TaskStore.load();
renderCalendar();
