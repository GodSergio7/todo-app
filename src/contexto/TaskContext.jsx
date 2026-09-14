import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TaskStore } from '../datos/almacenamiento';

const TaskContext = createContext(null);

// Proveedor que carga las tareas una sola vez y mantiene el estado de React
// sincronizado con TaskStore mediante su mecanismo de suscripción.
export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    TaskStore.load();
    setTasks(TaskStore.all().slice());

    // TaskStore muta su array interno; se entrega una copia para que React
    // detecte el cambio y vuelva a renderizar.
    const unsubscribe = TaskStore.subscribe((lista) => setTasks(lista.slice()));
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    tasks,
    add: (text, dueDate) => TaskStore.add(text, dueDate),
    toggle: (id) => TaskStore.toggle(id),
    remove: (id) => TaskStore.remove(id)
  }), [tasks]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks debe usarse dentro de <TaskProvider>');
  }
  return context;
}
