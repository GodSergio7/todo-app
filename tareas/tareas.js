// -----------------------------------------------------------------------------
// Página "Tareas": renderizado de la lista y creación de tareas con fecha
// límite obligatoria. Los datos viven en TaskStore (datos/almacenamiento.js), que
// persiste en localStorage compartido con la página "Calendario".
// -----------------------------------------------------------------------------

// Referencias a elementos del DOM
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

// Fecha mínima seleccionable: hoy (no se permiten fechas pasadas)
function todayISODate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Mensajes breves por campo (el id del mensaje es "<id del campo>-error")
const ERROR_TEXT = {
  'task-input': 'Escribe la tarea.',
  'due-date-input': 'Selecciona la fecha límite.'
};

function errorMessageId(input) {
  return `${input.id}-error`;
}

function showFieldError(input) {
  input.classList.add('field-invalid');
  input.setAttribute('aria-invalid', 'true');

  const msg = document.getElementById(errorMessageId(input));
  if (msg) {
    msg.textContent = ERROR_TEXT[input.id] || 'Corrige este campo.';
    msg.hidden = false;
  }

  if (!input.getAttribute('aria-describedby')) {
    input.setAttribute('aria-describedby', errorMessageId(input));
  }
}

function clearFieldError(input) {
  input.classList.remove('field-invalid');
  input.removeAttribute('aria-invalid');

  const msg = document.getElementById(errorMessageId(input));
  if (msg) {
    msg.textContent = '';
    msg.hidden = true;
  }

  input.removeAttribute('aria-describedby');
}

// Event listener para el envío del formulario
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  const dueDate = dueDateInput.value; // 'YYYY-MM-DD' o '' si está vacío

  clearFieldError(taskInput);
  clearFieldError(dueDateInput);

  if (text === '') {
    showFieldError(taskInput);
    taskInput.focus();
    return;
  }
  if (!dueDate) {
    showFieldError(dueDateInput);
    dueDateInput.focus();
    return;
  }

  TaskStore.add(text, dueDate);
  taskInput.value = '';
  dueDateInput.value = '';
  taskInput.focus();
});

// Limpiar el estado de error mientras el usuario escribe/selecciona
taskInput.addEventListener('input', () => clearFieldError(taskInput));
dueDateInput.addEventListener('change', () => clearFieldError(dueDateInput));

// Alternar completada (cambio desde el checkbox)
function handleToggle(id) {
  TaskStore.toggle(id);
}

// Eliminar una tarea
function handleDelete(id) {
  TaskStore.remove(id);
}

// Renderizar la lista de tareas
function renderTasks() {
  const tasks = TaskStore.all();
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Marcar "${task.text}" como completada`);
    checkbox.addEventListener('change', () => handleToggle(task.id));

    const textWrap = document.createElement('div');
    textWrap.className = 'task-text-wrap';

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const meta = document.createElement('span');
    meta.className = 'task-meta';
    if (task.dueDate) {
      const icon = document.createTextNode('📅 ');
      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-due';
      dateSpan.textContent = TaskStore.formatDueDate(task.dueDate);
      meta.appendChild(icon);
      meta.appendChild(dateSpan);
    } else {
      const noDate = document.createElement('span');
      noDate.className = 'task-no-due';
      noDate.textContent = 'Sin fecha límite';
      meta.appendChild(noDate);
    }

    textWrap.appendChild(span);
    textWrap.appendChild(meta);

    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(textWrap);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.title = 'Eliminar tarea';
    deleteBtn.addEventListener('click', () => handleDelete(task.id));

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });
}

// Repintar la lista cuando cambian los datos desde cualquier página
TaskStore.subscribe(renderTasks);

// Inicialización: restaurar tareas guardadas y pintarlas
TaskStore.load();
renderTasks();
