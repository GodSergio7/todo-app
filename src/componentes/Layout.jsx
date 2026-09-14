import { useEffect } from 'react';
import Navegacion from './Navegacion';
import Reloj from './Reloj';

// Estructura común a todas las páginas: resplandor de fondo, cabecera con el
// título del sitio, contenedor con navegación + título + reloj + contenido, y
// pie de página.
export default function Layout({ titulo, containerClass, children }) {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);

  return (
    <>
      <div className="bg-glow"></div>

      <header className="site-header">
        <span className="site-title">¿Qué hay que hacer hoy?</span>
      </header>

      <div className={'container' + (containerClass ? ' ' + containerClass : '')}>
        <header className="app-header">
          <Navegacion />
          <h1>{titulo}</h1>
        </header>

        <main className="app-body">
          <Reloj />
          {children}
        </main>
      </div>

      <footer className="site-footer">
        <p>© 2026 ¿Qué hay que hacer hoy? · Todos los derechos reservados</p>
      </footer>
    </>
  );
}
