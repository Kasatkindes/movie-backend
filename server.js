'use strict';

const path = require('path');
const express = require('express');
const recommendHandler = require('./api/recommend');
const imageHandler = require('./api/image');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', function (req, res) {
  res.status(200).send('OK');
});

app.all('/api/recommend', function (req, res) {
  recommendHandler(req, res).catch(function (err) {
    console.error('Recommend handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

app.get('/api/image', function (req, res) {
  imageHandler(req, res).catch(function (err) {
    console.error('Image handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

app.use(express.static(path.join(__dirname)));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, function () {
  console.log('Server listening on port', PORT);
});
