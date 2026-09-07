const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

// Resuelve la petición a un archivo concreto del proyecto:
//  - '/'           -> index.html de la raíz (redirige a tareas)
//  - '/directorio/ -> index.html de ese directorio
function resolverRuta(url) {
  const rutaDecodificada = decodeURIComponent(url.split('?')[0]);
  let rutaArchivo = path.join(__dirname, rutaDecodificada);

  if (rutaDecodificada === '/' || rutaDecodificada === '') {
    rutaArchivo = path.join(__dirname, 'index.html');
  } else if (rutaArchivo.endsWith(path.sep)) {
    // Se pidió un directorio -> servir su index.html
    rutaArchivo = path.join(rutaArchivo, 'index.html');
  }

  return path.normalize(rutaArchivo);
}

const server = http.createServer((req, res) => {
  let filePath;
  try {
    filePath = resolverRuta(req.url);
  } catch (err) {
    res.writeHead(400);
    res.end('Solicitud no válida');
    return;
  }

  // Evitar salir del directorio del proyecto (seguridad básica)
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end('<h1>404 - Archivo no encontrado</h1>');
      } else {
        res.writeHead(500);
        res.end(`Error del servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de desarrollo activo en http://localhost:${PORT}`);
});
