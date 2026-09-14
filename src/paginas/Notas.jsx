import { useRef, useState } from 'react';
import { useNotes } from '../contexto/NoteContext';
import { formatearFechaLarga, hoyISO } from '../datos/fechas';
import Layout from '../componentes/Layout';

export default function Notas() {
  const { notes, add, remove, toggleCalendar } = useNotes();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mostrarEnCalendario, setMostrarEnCalendario] = useState(false);
  const [error, setError] = useState('');

  const tituloRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();

    const limpio = titulo.trim();
    if (limpio === '') {
      setError('Escribe el título de la nota.');
      tituloRef.current?.focus();
      return;
    }

    add(limpio, descripcion.trim(), mostrarEnCalendario);
    setTitulo('');
    setDescripcion('');
    setMostrarEnCalendario(false);
    setError('');
    tituloRef.current?.focus();
  }

  return (
    <Layout titulo="Notas" containerClass="container-notas">
      <div className="notes-layout">
        {/* Columna izquierda: formulario para crear una nota rápida */}
        <aside className="notes-form-col">
          <form className="note-form" noValidate onSubmit={handleSubmit}>
            <div className="note-form-field">
              <label htmlFor="note-input">Título</label>
              <input
                ref={tituloRef}
                type="text"
                id="note-input"
                placeholder="Título de la nota…"
                autoComplete="off"
                value={titulo}
                className={error ? 'field-invalid' : undefined}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'note-input-error' : undefined}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (error) setError('');
                }}
              />
              <p className="field-error" id="note-input-error" hidden={!error}>
                {error || ''}
              </p>
            </div>

            <div className="note-form-field">
              <label htmlFor="note-description">Descripción</label>
              <textarea
                id="note-description"
                className="note-textarea"
                rows={5}
                placeholder="Escribe la nota…"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              ></textarea>
            </div>

            <div className="note-form-footer">
              <label className="note-cal-check">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={mostrarEnCalendario}
                  onChange={(e) => setMostrarEnCalendario(e.target.checked)}
                />
                <span>Mostrar en el calendario</span>
              </label>

              <div className="note-form-actions">
                <button type="submit" id="add-note-button">Añadir nota</button>
              </div>
            </div>
          </form>
          {/* <p className="note-date-hint">
            📅 Se guardará con la fecha de hoy: <strong>{formatearFechaLarga(hoyISO())}</strong>
          </p> */}
        </aside>

        {/* Columna derecha: todas las notas, con título y descripción completa */}
        <section className="notes-list-col" aria-label="Lista de notas">
          {notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No tienes notas todavía</p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map((nota) => (
                <article key={nota.id} className="note-card">
                  <h2 className="note-card-title">{nota.title}</h2>

                  {nota.description && (
                    <p className="note-card-description">{nota.description}</p>
                  )}

                  <footer className="note-card-footer">
                    <span className="note-card-date">📅 {formatearFechaLarga(nota.date)}</span>

                    <div className="note-card-actions">
                      <label className="note-cal-toggle" title="Mostrar en el calendario">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={nota.showInCalendar}
                          onChange={() => toggleCalendar(nota.id)}
                        />
                        <span>En el calendario</span>
                      </label>

                      <button
                        type="button"
                        className="btn-delete"
                        title="Eliminar nota"
                        onClick={() => remove(nota.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
