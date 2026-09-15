import Navegacion from './Navegacion';
import Reloj from './Reloj';

// Estructura común a todas las páginas: resplandor de fondo, cabecera con el
// título del sitio, contenedor con navegación + título + reloj + contenido, y
// pie de página.
// El título de la pestaña es fijo ("¿Qué hay que hacer hoy?") y se define en
// index.html; por eso aquí NO se toca document.title.
export default function Layout({ titulo, containerClass, children }) {
  return (
    <>
      <div className="bg-glow"></div>

      <header className="site-header">
        {/* Lockup de marca: símbolo (el mismo que el favicon) + nombre */}
        <span className="site-brand">
          <span className="site-mark" aria-hidden="true">
            {/* Con width/height propios, si el CSS no llegara a aplicarse el
                símbolo se queda en 28 px en vez de estirarse a 300x150 */}
            <svg viewBox="0 0 64 64" width="28" height="28" focusable="false">
              <rect
                x="1" y="1" width="62" height="62" rx="13"
                fill="#2D1B69" stroke="#C8FF3D" strokeOpacity="0.35" strokeWidth="2"
              />
              <path
                d="M18 34l10 10 18-22"
                fill="none" stroke="#C8FF3D" strokeWidth="9"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="site-title">¿Qué hay que hacer hoy?</span>
        </span>
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
