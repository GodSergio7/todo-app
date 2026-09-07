// -----------------------------------------------------------------------------
// Componente compartido "Reloj": muestra la hora (formato 24h, hora local) con
// la fecha debajo, justo encima del contenido principal de cada página.
// Se actualiza cada segundo. Se monta automáticamente en los elementos con
// [data-reloj-montaje].
// -----------------------------------------------------------------------------

(function () {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');

  function formatTime(date) {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return { hours, minutes, seconds };
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date).replace(/^\w/, (c) => c.toUpperCase());
  }

  function updateClock() {
    const now = new Date();
    const { hours, minutes, seconds } = formatTime(now);
    const timeStr = `${hours}:${minutes}<span class="seconds">:${seconds}</span>`;
    const dateStr = formatDate(now);

    document.querySelectorAll('.clock-time').forEach((el) => {
      el.innerHTML = timeStr;
    });
    document.querySelectorAll('.clock-date').forEach((el) => {
      el.textContent = dateStr;
    });
  }

  // Construye el reloj dentro de cada punto de montaje [data-reloj-montaje].
  function montarRelojes() {
    document.querySelectorAll('[data-reloj-montaje]').forEach((mount) => {
      if (mount.querySelector('.clock-widget')) return;

      const widget = document.createElement('div');
      widget.className = 'clock-widget';
      widget.setAttribute('role', 'timer');
      widget.setAttribute('aria-live', 'off');

      const hora = document.createElement('span');
      hora.className = 'clock-time';
      hora.textContent = '--:--:--';

      const fecha = document.createElement('span');
      fecha.className = 'clock-date';

      widget.appendChild(hora);
      widget.appendChild(fecha);
      mount.appendChild(widget);
    });
  }

  montarRelojes();

  // Mostrar inmediatamente y actualizar cada segundo
  updateClock();
  setInterval(updateClock, 1000);
})();
