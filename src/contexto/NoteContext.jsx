import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NoteStore } from '../datos/notas';

const NoteContext = createContext(null);

// Proveedor que carga las notas una sola vez y mantiene el estado de React
// sincronizado con NoteStore mediante su mecanismo de suscripción.
export function NoteProvider({ children }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    NoteStore.load();
    setNotes(NoteStore.all().slice());

    // NoteStore muta su array interno; se entrega una copia para que React
    // detecte el cambio y vuelva a renderizar.
    const unsubscribe = NoteStore.subscribe((lista) => setNotes(lista.slice()));
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    notes,
    add: (title, description, showInCalendar) => NoteStore.add(title, description, showInCalendar),
    remove: (id) => NoteStore.remove(id),
    toggleCalendar: (id) => NoteStore.toggleCalendar(id)
  }), [notes]);

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNotes debe usarse dentro de <NoteProvider>');
  }
  return context;
}
