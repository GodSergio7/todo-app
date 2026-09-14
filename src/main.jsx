import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './estilos/estilos-globales.css';
import './estilos/tareas.css';
import './estilos/calendario.css';
import './estilos/notas.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
