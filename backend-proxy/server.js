const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());


const API_SUB_POST = 'http://dh-server.fbk.eu:7380/create-subtitling-project';
const API_CONVERSION_POST = 'http://dh-server.fbk.eu:7382/conversion-start';
const API_SUB_STATUS = 'http://dh-server.fbk.eu:7380/project-state';
const API_CONVERSION_STATUS = 'http://dh-server.fbk.eu:7382/conversion-status';
const API_SUB_GET = 'http://dh-server.fbk.eu:7380/project-subtitles';
const API_CONVERSION_GET = 'http://dh-server.fbk.eu:7382/conversion-out';

// 1. POST conversione video
app.post('/api/conversion/post', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 POST conversione video');
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(API_CONVERSION_POST, formData, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// 2. GET conversione status (con query parameter)
app.get('/api/conversion/status/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    console.log('🔍 GET conversione status:', jobId);
    
    const url = `${API_CONVERSION_STATUS}?id=${jobId}`;
    console.log('📍 URL chiamato:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// 3. GET conversione get (con query parameter)
app.get('/api/conversion/get/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    console.log('🔍 GET conversione get:', jobId);
    
    const url = `${API_CONVERSION_GET}?id=${jobId}`;
    console.log('📍 URL chiamato:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// 4. POST sottotitoli
app.post('/api/subtitles/post', async (req, res) => {
  try {
    console.log('📤 POST sottotitoli');
    console.log('Body ricevuto:', req.body);
    
    const response = await axios.post(API_SUB_POST, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// 5. GET sottotitoli status (con query parameter)
app.get('/api/subtitles/status/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    console.log('🔍 GET sottotitoli status:', jobId);
    
    const url = `${API_SUB_STATUS}?id=${jobId}`;
    console.log('📍 URL chiamato:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// 6. GET sottotitoli get (con query parameter)
app.get('/api/subtitles/get/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    console.log('🔍 GET sottotitoli get:', jobId);
    
    const url = `${API_SUB_GET}?id=${jobId}`;
    console.log('📍 URL chiamato:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Risposta:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('URL chiamato:', error.config?.url);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Avvia server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Backend proxy avviato!
📍 http://localhost:${PORT}

Endpoints disponibili:
  POST   http://localhost:${PORT}/api/conversion/post
  GET    http://localhost:${PORT}/api/conversion/status/:id
  GET    http://localhost:${PORT}/api/conversion/get/:id
  POST   http://localhost:${PORT}/api/subtitles/post
  GET    http://localhost:${PORT}/api/subtitles/status/:id
  GET    http://localhost:${PORT}/api/subtitles/get/:id

⚠️  Ricordati di sostituire gli URL delle API vere in cima al file!
  `);
});