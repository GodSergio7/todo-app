import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TaskProvider } from './contexto/TaskContext';
import { NoteProvider } from './contexto/NoteContext';
import Aviso from './componentes/Aviso';
import Tareas from './paginas/Tareas';
import Calendario from './paginas/Calendario';
import Notas from './paginas/Notas';

// La página "Tareas" usa body.page-tareas (altura fija y sin scroll de página).
// Se aplica la clase antes del primer paint para evitar parpadeos de layout.
function GestorClaseBody() {
  const location = useLocation();

  useLayoutEffect(() => {
    document.body.classList.toggle('page-tareas', location.pathname === '/tareas');
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TaskProvider>
        <NoteProvider>
          <GestorClaseBody />
          <Routes>
            <Route path="/" element={<Navigate to="/tareas" replace />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/notas" element={<Notas />} />
            <Route path="*" element={<Navigate to="/tareas" replace />} />
          </Routes>
          <Aviso />
        </NoteProvider>
      </TaskProvider>
    </BrowserRouter>
  );
}
