const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const GIST_FILENAME = process.env.GIST_FILENAME || 'ultimas-canciones.json';

// Ruta principal
app.get('/', (req, res) => {
  res.send('✅ Servidor activo. Historial actualizándose automáticamente (modo prueba).');
});

// Función que guarda una canción falsa para probar
async function guardarCancionFalsa() {
  const historial = [
    {
      hora: "09:00",
      titulo: "Blinding Lights",
      artista: "The Weeknd",
      caratula: "https://upload.wikimedia.org/wikipedia/en/0/09/The_Weeknd_-_Blinding_Lights.png"
    },
    {
      hora: "08:55",
      titulo: "Zombie Lady",
      artista: "Damiano David",
      caratula: "https://upload.wikimedia.org/wikipedia/en/a/a0/Maneskin_-_Rush%21.png"
    },
    {
      hora: "08:52",
      titulo: "Love Me Better",
      artista: "Corbyn Besson",
      caratula: "https://upload.wikimedia.org/wikipedia/en/2/2f/Cobryn_Besson_-_Love_Me_Better.jpeg"
    }
  ];

  try {
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
    console.log('✅ Historial de prueba guardado.');
  } catch (error) {
    console.error('❌ Error al guardar historial de prueba:', error.message);
  }
}

// Ejecutar al inicio (solo una vez)
guardarCancionFalsa();

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});
