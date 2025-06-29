const fetch = require('node-fetch');
const { Octokit } = require("@octokit/rest");

const GH_TOKEN = process.env.GH_TOKEN;
const GIST_ID = "16c4c02db2ed3236f57c7964ecd7265d";
const MAX_SONGS = 8;

const octokit = new Octokit({ auth: GH_TOKEN });

async function getMetadata() {
  const response = await fetch("https://api.zeno.fm/mounts/metadata/subscribe/rvzcguzfj2wuv");
  const text = await response.text();

  const matches = Array.from(text.matchAll(/data:\s*(\{.*?\})/g));
  const songs = matches.map(match => {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  return songs.map(song => song.streamTitle).filter(Boolean);
}

function getCoverUrl(title) {
  const covers = {
    "Jennifer Lopez - Waiting for Tonight": {
      platform: "iTunes",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2e/6a/35/2e6a35c1-f839-dbe3-bf2f-f9b9e293ee6a/886448083473.jpg/300x300bb.jpg"
    },
    "Lena - Don’t Lie to Me": {
      platform: "YouTube",
      cover: "https://i.ytimg.com/vi/QqT9T1t22IM/hqdefault.jpg"
    }
    // Puedes agregar más carátulas aquí
  };

  return covers[title] || {
    platform: "Desconocido",
    cover: "https://i.imgur.com/placeholder.png"
  };
}

(async () => {
  const metadataTitles = await getMetadata();

  const counts = {};
  metadataTitles.forEach(title => {
    counts[title] = (counts[title] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SONGS);

  const topSongs = sorted.map(([title]) => {
    const { cover, platform } = getCoverUrl(title);
    return {
      title,
      platform,
      cover,
      link: "#"
    };
  });

  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      "top-songs.json": {
        content: JSON.stringify(topSongs, null, 2)
      }
    }
  });

  console.log("✅ top-songs.json actualizado correctamente.");
})();
