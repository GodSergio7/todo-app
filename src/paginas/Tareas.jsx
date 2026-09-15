import { useRef, useState } from 'react';
import { useTasks } from '../contexto/TaskContext';
import { TaskStore } from '../datos/almacenamiento';
import Layout from '../componentes/Layout';

const ERROR_TEXT = {
  'task-input': 'Escribe la tarea.',
  'due-date-input': 'Selecciona la fecha límite.'
};

export default function Tareas() {
  const { tasks, add, toggle, remove } = useTasks();

  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});

  const textRef = useRef(null);
  const dateRef = useRef(null);

  function clearError(key) {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = text.trim();
    const newErrors = {};
    if (trimmed === '') newErrors['task-input'] = ERROR_TEXT['task-input'];
    if (!dueDate) newErrors['due-date-input'] = ERROR_TEXT['due-date-input'];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors['task-input']) textRef.current?.focus();
      else dateRef.current?.focus();
      return;
    }

    add(trimmed, dueDate);
    setText('');
    setDueDate('');
    setErrors({});
    textRef.current?.focus();
  }

  return (
    <Layout titulo="Mis tareas" containerClass="container-tareas">
      <form id="task-form" className="task-form" noValidate onSubmit={handleSubmit}>
        <div className="task-form-field task-form-text-field">
          <label htmlFor="task-input">Tarea</label>
          <input
            ref={textRef}
            type="text"
            id="task-input"
            placeholder="Tarea..."
            autoComplete="off"
            value={text}
            className={errors['task-input'] ? 'field-invalid' : undefined}
            aria-invalid={errors['task-input'] ? 'true' : undefined}
            aria-describedby={errors['task-input'] ? 'task-input-error' : undefined}
            onChange={(e) => {
              setText(e.target.value);
              if (errors['task-input']) clearError('task-input');
            }}
          />
          <p className="field-error" id="task-input-error" hidden={!errors['task-input']}>
            {errors['task-input'] || ''}
          </p>
        </div>

        <div className="task-form-field task-form-date-field">
          <label htmlFor="due-date-input">Fecha límite <span className="req">*</span></label>
          <input
            ref={dateRef}
            type="date"
            id="due-date-input"
            value={dueDate}
            className={errors['due-date-input'] ? 'field-invalid' : undefined}
            aria-invalid={errors['due-date-input'] ? 'true' : undefined}
            aria-describedby={errors['due-date-input'] ? 'due-date-input-error' : undefined}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (errors['due-date-input']) clearError('due-date-input');
            }}
          />
          <p className="field-error" id="due-date-input-error" hidden={!errors['due-date-input']}>
            {errors['due-date-input'] || ''}
          </p>
        </div>

        <div className="task-form-actions">
          <button type="submit" id="add-button">Añadir</button>
        </div>
      </form>

      <div className="task-list-zone">
        {tasks.length === 0 ? (
          <div className="empty-state">
            {/* <div className="empty-icon">✨</div> */}
            <p>No tienes tareas pendientes...</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-content">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    aria-label={`Marcar "${task.text}" como completada`}
                    onChange={() => toggle(task.id)}
                  />
                  <div className="task-text-wrap">
                    <span className="task-text">{task.text}</span>
                    <span className="task-meta">
                      {task.dueDate ? (
                        <>
                          📅 <span className="task-due">{TaskStore.formatDueDate(task.dueDate)}</span>
                        </>
                      ) : (
                        <span className="task-no-due">Sin fecha límite</span>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-delete"
                  title="Eliminar tarea"
                  onClick={() => remove(task.id)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
