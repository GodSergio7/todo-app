import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function formatearFecha(date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date).replace(/^\w/, (c) => c.toUpperCase());
}

// Reloj digital (formato 24h, hora local) con la fecha debajo. Se actualiza
// cada segundo.
export default function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = pad(ahora.getHours());
  const minutes = pad(ahora.getMinutes());
  const seconds = pad(ahora.getSeconds());

  return (
    <div className="clock-widget" role="timer" aria-live="off">
      <span className="clock-time">
        {hours}:{minutes}
        <span className="seconds">:{seconds}</span>
      </span>
      <span className="clock-date">{formatearFecha(ahora)}</span>
    </div>
  );
}
