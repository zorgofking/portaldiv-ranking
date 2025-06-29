const fs = require('fs');
const axios = require('axios');

const GIST_ID = "16c4c02db2ed3236f57c7964ecd7265d";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const gistApi = `https://api.github.com/gists/${GIST_ID}`;
const ZENO_META_URL = `https://stream.zeno.fm/metadata/rvzcguzfj2wuv.json`;

async function getCurrentMetadata() {
  const res = await axios.get(ZENO_META_URL);
  return res.data?.metadata?.title || null;
}

async function loadGistFile(filename) {
  const res = await axios.get(gistApi, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const content = res.data.files[filename]?.content || "[]";
  return JSON.parse(content);
}

async function saveGistFile(filename, content) {
  await axios.patch(gistApi, {
    files: {
      [filename]: {
        content: JSON.stringify(content, null, 2)
      }
    }
  }, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
}

async function main() {
  const currentSong = await getCurrentMetadata();
  if (!currentSong) return;

  const historial = await loadGistFile("historial.json");
  const now = new Date().toISOString();

  // Evitar duplicados consecutivos
  if (historial.length === 0 || historial[0].title !== currentSong) {
    historial.unshift({ title: currentSong, timestamp: now });
  }

  // Limitar a 30 por día
  const today = new Date().toISOString().slice(0, 10);
  const filtered = historial.filter(e => e.timestamp.startsWith(today)).slice(0, 30);
  await saveGistFile("historial.json", filtered);

  // Calcular Top 8
  const counts = {};
  for (const entry of filtered) {
    counts[entry.title] = (counts[entry.title] || 0) + 1;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([title]) => ({
      title,
      platform: "Zeno.fm",
      cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png",
      link: "#"
    }));

  // Buscar carátulas en iTunes
  for (const song of sorted) {
    try {
      const res = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(song.title)}&limit=1`);
      const artwork = res.data?.results?.[0]?.artworkUrl100;
      if (artwork) {
        song.cover = artwork.replace('100x100bb.jpg', '300x300bb.jpg');
        song.platform = "iTunes";
      }
    } catch (e) {}
  }

  await saveGistFile("top-songs.json", sorted);
}

main().catch(err => {
  console.error("❌ Error actualizando canciones:", err);
  process.exit(1);
});
