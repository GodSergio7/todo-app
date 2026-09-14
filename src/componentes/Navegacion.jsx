import { NavLink } from 'react-router-dom';

const PAGINAS = [
  { clave: 'tareas', etiqueta: 'Tareas', ruta: '/tareas' },
  { clave: 'calendario', etiqueta: 'Calendario', ruta: '/calendario' },
  { clave: 'notas', etiqueta: 'Notas', ruta: '/notas' }
];

// Menú de navegación Tareas / Calendario / Notas. NavLink marca el enlace activo
// según la ruta actual y añade aria-current="page" automáticamente.
export default function Navegacion() {
  return (
    <nav className="page-nav" aria-label="Navegación principal">
      {PAGINAS.map((pagina) => (
        <NavLink
          key={pagina.clave}
          to={pagina.ruta}
          className={({ isActive }) => 'page-nav-link' + (isActive ? ' active' : '')}
        >
          {pagina.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
