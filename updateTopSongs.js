await gistClient.update({
  gist_id: '16c4c02db2ed3236f57c7964ecd7265d',
  files: {
    'top-songs.json': {
      content: JSON.stringify(topSongs, null, 2)
    }
  }
});
