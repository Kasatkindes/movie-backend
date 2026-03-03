'use strict';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

/**
 * Vercel serverless function: image proxy for TMDB.
 * Query: path (required) — path segment for image.tmdb.org (e.g. /t/p/w500/abc.jpg)
 */
module.exports = async (req, res) => {
  const path = req.query.path;

  if (path == null || String(path).trim() === '') {
    res.status(400).json({ error: 'Missing required query parameter: path' });
    return;
  }

  const url = TMDB_IMAGE_BASE + path;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch image from TMDB' });
    return;
  }

  if (!response.ok) {
    res.status(response.status).end();
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(buffer);
};
