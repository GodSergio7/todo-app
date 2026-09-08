// -----------------------------------------------------------------------------
// Componente compartido "Aviso": muestra un mensaje visible no intrusivo
// cuando la persistencia en localStorage falla (p. ej. modo privado o cuota
// llena). Usa role="alert" para que los lectores de pantalla lo anuncien.
// Se auto-registra en TaskStore.onSaveError si la capa de datos está presente.
// -----------------------------------------------------------------------------

(function () {
  'use strict';

  const MENSAJE = 'No se pudieron guardar los cambios. Revisa el almacenamiento del navegador (modo privado o espacio lleno).';

  let aviso = null;
  let timer = null;

  function mostrar(mensaje) {
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'aviso-global';
      aviso.setAttribute('role', 'alert');
      document.body.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    aviso.classList.add('visible');

    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      aviso.classList.remove('visible');
    }, 6000);
  }

  const store = (typeof window !== 'undefined' && window.TaskStore) ? window.TaskStore : null;
  if (store && typeof store.onSaveError === 'function') {
    store.onSaveError(function () {
      mostrar(MENSAJE);
    });
  }
})();
