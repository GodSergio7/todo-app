import { useCallback, useEffect, useRef, useState } from 'react';
import { useTasks } from '../contexto/TaskContext';
import { useNotes } from '../contexto/NoteContext';
import { TaskStore } from '../datos/almacenamiento';
import Layout from '../componentes/Layout';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Máximo de chips (tareas + notas) que caben en una celda del calendario
const MAX_CHIPS = 3;

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function Calendario() {
  const { tasks, toggle, remove } = useTasks();
  const { notes } = useNotes();

  const ahora = new Date();
  const [viewYear, setViewYear] = useState(ahora.getFullYear());
  const [viewMonth, setViewMonth] = useState(ahora.getMonth());
  const [modalTaskId, setModalTaskId] = useState(null);

  const modalCardRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const modalTask = modalTaskId !== null
    ? tasks.find((t) => t.id === modalTaskId) || null
    : null;

  const closeModal = useCallback(() => {
    const prev = lastFocusedRef.current;
    lastFocusedRef.current = null;
    setModalTaskId(null);
    if (prev && typeof prev.focus === 'function') prev.focus();
  }, []);

  const openModal = useCallback((id) => {
    lastFocusedRef.current = document.activeElement;
    setModalTaskId(id);
  }, []);

  // Al abrir: mueve el foco al diálogo y bloquea el scroll del body.
  // Al cerrar: restaura el scroll.
  useEffect(() => {
    if (modalTaskId !== null) {
      modalCardRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [modalTaskId]);

  // Si la tarea abierta deja de existir (se eliminó), se cierra el modal.
  useEffect(() => {
    if (modalTaskId !== null && !tasks.some((t) => t.id === modalTaskId)) {
      closeModal();
    }
  }, [tasks, modalTaskId, closeModal]);

  // Cerrar el modal con Escape.
  useEffect(() => {
    function onKeyDown(e) {
      if (modalTaskId !== null && (e.key === 'Escape' || e.key === 'Esc')) {
        closeModal();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalTaskId, closeModal]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  // --- Construcción de la cuadrícula del mes ---
  const year = viewYear;
  const month = viewMonth;
  const today = new Date();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=dom,1=lun...6=sáb
  const offset = (firstWeekday + 6) % 7; // lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Agrupar tareas por fecha límite (solo las que tienen dueDate)
  const byDate = new Map();
  let tasksInMonth = 0;
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const due = String(t.dueDate);
    if (!byDate.has(due)) byDate.set(due, []);
    byDate.get(due).push(t);
    if (due.startsWith(`${year}-${pad2(month + 1)}-`)) tasksInMonth += 1;
  });

  // Agrupar notas por su fecha (solo las marcadas para aparecer en el calendario)
  const notesByDate = new Map();
  let notesInMonth = 0;
  notes.forEach((n) => {
    if (!n.showInCalendar || !n.date) return;
    const dia = String(n.date);
    if (!notesByDate.has(dia)) notesByDate.set(dia, []);
    notesByDate.get(dia).push(n);
    if (dia.startsWith(`${year}-${pad2(month + 1)}-`)) notesInMonth += 1;
  });

  const celdas = [];
  for (let i = 0; i < offset; i++) {
    celdas.push({ tipo: 'vacia', clave: `pad-ini-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    // Primero las tareas y después las notas, para no alterar el orden previo.
    const items = [
      ...(byDate.get(iso) || []).map((t) => ({ clave: `t-${t.id}`, tipo: 'tarea', dato: t })),
      ...(notesByDate.get(iso) || []).map((n) => ({ clave: `n-${n.id}`, tipo: 'nota', dato: n }))
    ];
    celdas.push({
      tipo: 'dia',
      clave: iso,
      dia: d,
      esHoy: isSameDay(today, new Date(year, month, d)),
      items
    });
  }
  const used = offset + daysInMonth;
  const remainder = used % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      celdas.push({ tipo: 'vacia', clave: `pad-fin-${i}` });
    }
  }

  const mesVacio = tasksInMonth === 0 && notesInMonth === 0;

  return (
    <Layout titulo="Calendario" containerClass="container-calendar">
      <section className="calendar-section" aria-label="Calendario mensual">
        <div className="cal-header">
          <button type="button" className="cal-nav-btn" id="prev-month" aria-label="Mes anterior" onClick={goPrevMonth}>‹</button>
          <div className="cal-title">
            <span id="month-title">{MESES[viewMonth]}</span>
            <span id="month-year">{viewYear}</span>
          </div>
          <button type="button" className="cal-nav-btn" id="next-month" aria-label="Mes siguiente" onClick={goNextMonth}>›</button>
        </div>

        <div className="cal-toolbar">
          <button type="button" className="cal-today-btn" id="today-btn" onClick={goToday}>Ir al mes actual</button>
          <div className="cal-legend" aria-hidden="true">
            <span className="legend-item"><span className="legend-dot dot-pending"></span> Pendiente</span>
            <span className="legend-item"><span className="legend-dot dot-done"></span> Completada</span>
            <span className="legend-item"><span className="legend-dot dot-nota"></span> Nota</span>
          </div>
        </div>

        <div className="cal-weekdays" aria-hidden="true">
          <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span>
          <span>Vie</span><span>Sáb</span><span>Dom</span>
        </div>

        <div className="cal-grid">
          {celdas.map((celda) => celda.tipo === 'vacia' ? (
            <div key={celda.clave} className="cal-cell cal-cell-empty"></div>
          ) : (
            <div key={celda.clave} className="cal-cell">
              <div className={`cal-day-num${celda.esHoy ? ' cal-today' : ''}`}>{celda.dia}</div>
              {celda.items.length > 0 && (
                <div className="cal-chips">
                  {celda.items.slice(0, MAX_CHIPS).map((item) => (
                    item.tipo === 'tarea' ? (
                      <button
                        key={item.clave}
                        type="button"
                        className={`cal-chip ${item.dato.completed ? 'cal-chip-done' : 'cal-chip-pending'}`}
                        title={item.dato.text}
                        onClick={() => openModal(item.dato.id)}
                      >
                        {item.dato.completed ? `✓ ${item.dato.text}` : item.dato.text}
                      </button>
                    ) : (
                      <span
                        key={item.clave}
                        className="cal-chip cal-chip-nota"
                        title={item.dato.description ? `${item.dato.title} — ${item.dato.description}` : item.dato.title}
                      >
                        {item.dato.title}
                      </span>
                    )
                  ))}
                  {celda.items.length > MAX_CHIPS && (
                    <div className="cal-more">+{celda.items.length - MAX_CHIPS} más</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div id="cal-legend-mobile" className="cal-legend-mobile" hidden>
        <span className="legend-item"><span className="legend-dot dot-pending"></span> Pendiente</span>
        <span className="legend-item"><span className="legend-dot dot-done"></span> Completada</span>
        <span className="legend-item"><span className="legend-dot dot-nota"></span> Nota</span>
      </div>

      {mesVacio && (
        <div id="cal-empty-note" className="cal-empty-note">
          No hay tareas ni notas para este mes.
        </div>
      )}

      {modalTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="modal-card"
            id="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-task-name"
            tabIndex={-1}
            ref={modalCardRef}
          >
            <button type="button" className="modal-close" id="modal-close" aria-label="Cerrar" onClick={closeModal}>×</button>
            <h2 className="modal-title" id="modal-task-name">{modalTask.text}</h2>
            <dl className="modal-meta">
              <div className="modal-meta-row">
                <dt>Fecha límite</dt>
                <dd id="modal-due-date">{TaskStore.formatDueDate(modalTask.dueDate) || 'Sin fecha límite'}</dd>
              </div>
              <div className="modal-meta-row">
                <dt>Estado</dt>
                <dd id="modal-status" className={`modal-status ${modalTask.completed ? 'status-done' : 'status-pending'}`}>
                  {modalTask.completed ? 'Completada' : 'Pendiente'}
                </dd>
              </div>
            </dl>
            <div className="modal-actions">
              <button type="button" className="cal-action-btn" id="modal-toggle" onClick={() => toggle(modalTask.id)}>
                {modalTask.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
              </button>
              <button type="button" className="btn-delete" id="modal-delete" onClick={() => remove(modalTask.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
