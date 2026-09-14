// -----------------------------------------------------------------------------
// src/datos/fechas.js — Utilidades de fecha compartidas por las capas de datos
// y las páginas. Trabajan con fechas en formato 'YYYY-MM-DD'.
// -----------------------------------------------------------------------------

export const pad2 = (n) => String(n).padStart(2, '0');

// Fecha de hoy en formato 'YYYY-MM-DD' (hora local).
export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Formatea una fecha 'YYYY-MM-DD' como "10 de septiembre de 2026".
export function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return '';
  const m = String(fechaISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(fechaISO);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}
