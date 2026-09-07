# Mis Tareas — To-Do con Calendario

Aplicación web sencilla de lista de tareas con calendario mensual, construida
con **HTML, CSS y JavaScript vanilla** (sin frameworks ni dependencias) y
persistencia exclusivamente en **`localStorage`** del navegador.

## Requisitos

- [Node.js](https://nodejs.org) (para el servidor estático de desarrollo).

## Cómo ejecutar

```bash
npm start        # o: node server.js
```

Abre <http://localhost:3000>. La raíz (`/`) redirige a la página de **Tareas**;
la navegación superior permite alternar entre **Tareas** y **Calendario**.

Para ejecutar las pruebas funcionales:

```bash
npm test         # o: node pruebas/tests-funcionales.js
```

## Estructura del proyecto

```text
/
├── index.html                  # Redirige a /tareas/tareas.html
├── package.json                # Scripts: start, test
├── server.js                   # Servidor estático de desarrollo
│
├── tareas/                     # Funcionalidad "Tareas" (CRUD de la lista)
│   ├── tareas.html             #   Página de tareas
│   ├── tareas.js               #   Lógica de la página (formulario, lista)
│   └── tareas.css              #   Estilos específicos de la página
│
├── calendario/                 # Funcionalidad "Calendario"
│   ├── calendario.html         #   Página de calendario mensual
│   ├── calendario.js           #   Lógica del calendario y modal de tarea
│   └── calendario.css          #   Estilos específicos del calendario
│
├── componentes/                # Componentes compartidos entre páginas
│   ├── navegacion/
│   │   └── navegacion.js       #   Genera el menú Tareas / Calendario
│   └── reloj/
│       └── reloj.js            #   Reloj y fecha (montaje automático)
│
├── datos/
│   └── almacenamiento.js       # Capa de datos única (localStorage + CRUD)
│
├── estilos/
│   └── estilos-globales.css    # Variables, base, cabecera, componentes
│
└── pruebas/
    └── tests-funcionales.js    # Pruebas automáticas (sin dependencias)
```

## Responsabilidad de cada carpeta

| Carpeta       | Responsabilidad                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| `tareas/`     | Todo lo exclusivo de crear, mostrar, completar y eliminar tareas (página única). |
| `calendario/` | Vista mensual, navegación entre meses y representación de tareas por fecha.      |
| `componentes/`| Elementos reutilizados por varias páginas: navegación y reloj/fecha.             |
| `datos/`      | Persistencia centralizada en `localStorage` (`TaskStore`); evita código duplicado. |
| `estilos/`    | CSS global compartido; cada página añade su CSS específico.                      |
| `pruebas/`    | Pruebas funcionales ejecutables con Node.                                        |

## Funcionalidades

- **Tareas**: crear una tarea con texto y **fecha límite obligatoria**, marcarla
  como completada (aparece tachada), desmarcarla y eliminarla.
- **Calendario**: vista mensual con las tareas situadas en su día según la fecha
  límite; botones para cambiar de mes y volver al mes actual.
- Las tareas creadas desde el calendario o desde la lista comparten el mismo
  `localStorage` (clave `tasks`), por lo que los cambios se reflejan en ambas
  vistas.
- Reloj y fecha en la esquina superior derecha (hora local, se actualiza cada
  segundo).
- Diseño responsive con los colores corporativos `#2D1B69` (morado) y
  `#C8FF3D` (verde lima).

> Nota: las tareas antiguas guardadas sin fecha límite se conservan; se muestran
> en "Tareas" con la indicación "Sin fecha límite" hasta que se les asigne una.
