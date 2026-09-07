// -----------------------------------------------------------------------------
// Componente compartido "Navegación": genera el menú Tareas / Calendario.
// Se monta automáticamente en los elementos con [data-nav-montaje]; el enlace
// activo se indica con el atributo data-activa (valores: "tareas"|"calendario").
// -----------------------------------------------------------------------------

(function () {
  'use strict';

  const PAGINAS = [
    { clave: 'tareas', etiqueta: 'Tareas', archivo: 'tareas/tareas.html' },
    { clave: 'calendario', etiqueta: 'Calendario', archivo: 'calendario/calendario.html' }
  ];

  // Convierte una ruta relativa a la raíz en una ruta relativa desde la página
  // actual. Ej.: desde /calendario/calendario.html, "tareas/tareas.html" se
  // convierte en "../tareas/tareas.html".
  function rutaRelativa(ruta) {
    const actual = window.location.pathname.split('/').filter(Boolean);
    const destino = ruta.split('/').filter(Boolean);

    // Quita el nombre de archivo de la ruta actual
    actual.pop();

    let comunes = 0;
    while (comunes < actual.length && comunes < destino.length && actual[comunes] === destino[comunes]) {
      comunes++;
    }
    const arriba = actual.length - comunes;
    const resto = destino.slice(comunes);
    const base = arriba > 0 ? Array(arriba).fill('..').join('/') + '/' : '';
    return base + resto.join('/');
  }

  function montar() {
    const montajes = document.querySelectorAll('[data-nav-montaje]');
    if (montajes.length === 0) return;

    montajes.forEach((mount) => {
      const activa = mount.getAttribute('data-activa') || 'tareas';

      const nav = document.createElement('nav');
      nav.className = 'page-nav';
      nav.setAttribute('aria-label', 'Navegación principal');

      PAGINAS.forEach((pagina) => {
        const esActiva = pagina.clave === activa;
        const enlace = document.createElement('a');
        enlace.className = 'page-nav-link' + (esActiva ? ' active' : '');
        if (esActiva) enlace.setAttribute('aria-current', 'page');
        enlace.href = rutaRelativa(pagina.archivo);
        enlace.textContent = pagina.etiqueta;
        nav.appendChild(enlace);
      });

      mount.appendChild(nav);
    });
  }

  montar();
})();
