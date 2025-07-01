const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const GIST_FILENAME = process.env.GIST_FILENAME || 'ultimas-canciones.json';

// Ruta principal
app.get('/', (req, res) => {
  res.send('✅ Servidor activo. Historial actualizándose automáticamente.');
});

// Obtener canción actual desde Zeno.fm
async function obtenerCancionActual() {
  const url = 'https://stream.zeno.fm/rvzcguzfj2wuv/metadata'; // URL de tu emisora
  const res = await fetch(url);
  const data = await res.json();

  const [artista, titulo] = data.title?.split(' - ') || ['Desconocido', 'Desconocido'];

  return {
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    artista: artista.trim(),
    titulo: titulo.trim(),
    caratula: `https://itunes.apple.com/search?term=${encodeURIComponent(titulo)}&limit=1`
  };
}

// Obtener historial actual desde Gist
async function obtenerHistorialActual() {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const data = await response.json();
  const contenido = data.files[GIST_FILENAME]?.content || '[]';
  return JSON.parse(contenido);
}

// Actualizar Gist con nueva canción
async function actualizarGist(historial) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(historial, null, 2)
        }
      }
    })
  });
}

// Función principal de actualización
async function actualizarHistorial() {
  try {
    const nueva = await obtenerCancionActual();
    const historial = await obtenerHistorialActual();

    if (historial.length > 0 &&
        historial[0].titulo === nueva.titulo &&
        historial[0].artista === nueva.artista) {
      console.log('🔁 Canción repetida, no se agrega.');
      return;
    }

    historial.unshift(nueva);
    const historialRecortado = historial.slice(0, 30);
    await actualizarGist(historialRecortado);
    console.log('✅ Historial actualizado:', nueva.titulo);
  } catch (error) {
    console.error('❌ Error actualizando historial:', error.message);
  }
}

actualizarHistorial();
setInterval(actualizarHistorial, 8 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});
