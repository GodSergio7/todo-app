# Mis Tareas — To-Do con Calendario y Notas (React + Vite)

Aplicación web de lista de tareas con calendario mensual y bloc de notas.
Migrada de **HTML/CSS/JS vanilla** a **React + Vite**, manteniendo la misma
interfaz y las mismas funcionalidades. La persistencia sigue siendo
**`localStorage`**, con la capa de datos aislada y lista para conectar
**Supabase** en el futuro sin tocar los componentes.

## Cómo ejecutar

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # compila la app en dist/
npm run preview  # sirve la build de producción localmente
```

## Rutas

| Ruta          | Contenido                                          |
| ------------- | -------------------------------------------------- |
| `/`           | Redirige a `/tareas`                               |
| `/tareas`     | Lista de tareas (crear, completar, eliminar)       |
| `/calendario` | Vista mensual (tareas y notas) + modal de tarea    |
| `/notas`      | Bloc de notas (título + fecha automática)          |

## Estructura del proyecto

```text
/
├── index.html                  # Entrada de Vite (fuentes + #root)
├── package.json                # Scripts y dependencias (React, Vite, Router)
├── vite.config.js              # Configuración de Vite
├── vercel.json                 # Deploy en Vercel (build + SPA rewrites)
└── src/
    ├── main.jsx                # Punto de entrada de React
    ├── App.jsx                 # Router + proveedores de datos
    ├── datos/
    │   ├── almacenamiento.js   # Capa de datos de tareas (TaskStore)
    │   ├── notas.js            # Capa de datos de notas (NoteStore)
    │   └── fechas.js           # Utilidades de fecha compartidas
    ├── contexto/
    │   ├── TaskContext.jsx     # Proveedor React + hook useTasks
    │   └── NoteContext.jsx     # Proveedor React + hook useNotes
    ├── componentes/
    │   ├── Layout.jsx          # Cabecera, pie y estructura común
    │   ├── Navegacion.jsx      # Menú Tareas / Calendario / Notas
    │   ├── Reloj.jsx           # Reloj y fecha (se actualiza cada segundo)
    │   └── Aviso.jsx           # Banner de error de persistencia
    ├── paginas/
    │   ├── Tareas.jsx          # Página de tareas (CRUD)
    │   ├── Calendario.jsx      # Calendario mensual (tareas + notas) + modal
    │   └── Notas.jsx           # Bloc de notas
    └── estilos/
        ├── estilos-globales.css
        ├── tareas.css
        ├── calendario.css
        └── notas.css
```

## Funcionalidades

- **Tareas**: crear una tarea con texto y **fecha límite obligatoria**, marcarla
  como completada (aparece tachada), desmarcarla y eliminarla.
- **Notas**: página a **dos columnas** — a la izquierda el formulario y a la
  derecha todas las notas en tarjetas (título y **descripción completa** debajo),
  tipo notas rápidas. Cada nota tiene **fecha automática** (el día en que se crea)
  y un check que decide si aparece en el calendario; ese check también se puede
  activar/desactivar desde la propia tarjeta, donde además se pueden eliminar.
- **Calendario**: vista mensual con las tareas situadas en su día según la fecha
  límite y, junto a ellas, las notas marcadas (con **color lavanda** propio).
  Botones para cambiar de mes y volver al mes actual.
- Las tareas y las notas se guardan en `localStorage` (claves `tasks` y `notes`)
  y los cambios se reflejan al instante en todas las vistas.
- Reloj y fecha en la parte superior (hora local, se actualiza cada segundo).
- Diseño responsive con los colores corporativos `#2D1B69` (morado) y
  `#C8FF3D` (verde lima).

> Nota: las tareas antiguas guardadas sin fecha límite se conservan; se muestran
> en "Tareas" con la indicación "Sin fecha límite" hasta que se les asigne una.

## Migración a Supabase

Cada capa de datos está aislada en su módulo: `TaskStore`
(`src/datos/almacenamiento.js`) y `NoteStore` (`src/datos/notas.js`). Ambos
exponen `add`, `remove`, `load`, `subscribe` y `onSaveError` (y `toggle` /
`toggleCalendar`). Los componentes solo consumen esa interfaz (vía `useTasks` y
`useNotes`), así que para pasar a Supabase basta con reimplementar el interior de
cada store usando el SDK `@supabase/supabase-js` y mantener la misma firma; no
hay que tocar la UI.
