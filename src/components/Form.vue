<template>
  <div class="project-form-container">
    <div class="main-form">
        <h1>Create your project now!</h1>
      <p>Project name</p>
      <div class="form-floating mb-3">
        <input type="text" class="form-control" placeholder="My project" v-model="projectName">
        <label>My project</label>
      </div>
      <p>Insert video source</p>
      <div class="dropzone" @dragover.prevent @drop.prevent="handleDrop">
        <p v-if="!videoFile">Drop your video source here</p>
        <p v-else>Selected file: {{ videoFile.name }}</p>
      </div>
      <p>Target language</p>
      <select class="form-select mb-3" v-model="targetLanguage">
        <option value="">Select the language</option>
        <option value="en">English</option>
        <option value="it">Italian</option>
        <option value="fr">French</option>
      </select>
      <button class="btn btn-lg btn-light fw-bold" @click="createProject">Create</button>

       
    </div>
      <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div> 
          <div> <h1>This operation may take a minute</h1></div>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const targetLanguage = ref('');
const router = useRouter()
let loading = ref(false)
const videoFile = ref(null)
const projectName = ref('')
let subtitles = []
let tranSubtitles = []

const apiConversionPost = ' https://api.matita.net/whisper/conversion-start'
const apiConversionStatus = 'https://api.matita.net/whisper/conversion-status'
const apiConversionOut = 'https://api.matita.net/whisper/conversion-out'
const apiConversionLang = 'https://api.matita.net/whisper/conversion-lang'
const apiConversionTranslated = 'https://api.matita.net/whisper/conversion-translated'

const tokenBearer= 'Bearer dkPJpR2DqOLPppgQn4oIGPcdQ7W_zgGYvOyf2HTJPxE'


function handleDrop(event) {
  const files = event.dataTransfer.files
  if (files.length > 0 && files[0].type.startsWith('video/')) {
    videoFile.value = files[0]
  } else {
    alert('Per favore trascina un file video valido.')
  }
}


async function createProject() {
  if (!videoFile.value || !projectName.value.trim()) {
    alert('Controlla i campi obbligatori.');
    return;
  }
    try {
       loading.value = true;
      const formData = new FormData();
      formData.append('file', videoFile.value);

      console.log('Inizio caricamento video...');

      const conversionJob = await axios.post(apiConversionPost, formData, {
        headers: {
          'Authorization': tokenBearer,        
          'Content-Type': 'multipart/form-data'
        },
        params:{
          translate_to: targetLanguage.value
        }
      });

      const jobId = conversionJob.data.id;
      console.log('Job conversione creato:', jobId);

      console.log('Attendo completamento conversione...');
      
      const maxAttempts = 3000;
      const pollInterval = 1000;
      let conversionCompleted = false;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Controllo status (tentativo ${attempt})...`);
        
        const statusResponse = await axios.get(`${apiConversionStatus}?id=${jobId}`, {
          headers: {
            'Authorization': tokenBearer
          }
        });
        
        console.log('Response:', statusResponse.data); 
        
        const { status, error } = statusResponse.data;
        
        console.log(`   Status attuale: ${status}`);
        
        if (status === 'completed') {
          console.log('Conversione completata!');
          conversionCompleted = true;
          break;
        }
        
        if (status === 'failed') {
          throw new Error(error || 'Conversione fallita');
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      if (!conversionCompleted) {
        throw new Error('Timeout: conversione non completata');
      }

      const sourceLang =await axios.get(`${apiConversionLang}?id=${jobId}`, {
          headers: {
            'Authorization': tokenBearer
          }
        });
      console.log(sourceLang.data)  

      console.log('Recupero sottotitoli ...');

      const subtitlesResponse = await axios.get(`${apiConversionOut}?id=${jobId}`, {
        headers: {
          'Authorization': tokenBearer
        }
      }).then(subtitlesResponse => {
        const sub = subtitlesResponse.data;
        const blocchi = sub.trim().split(/\r?\n\r?\n/);
        
        subtitles = blocchi.map(blocco => {  
          const righe = blocco.split(/\r?\n/);
          if (righe.length >= 3) {
            return {
              timestamp: righe[1],           
              testo: righe.slice(2).join(' ') 
            };
          }
          return null;
        }).filter(item => item !== null); 
        
        localStorage.setItem('subtitles', JSON.stringify(subtitles));
      });

      const TranslatedSubtitles = await axios.get(`${apiConversionTranslated}?id=${jobId}`, {
        headers: {
          'Authorization': tokenBearer
        }
      }).then(response => {
        const data = response.data;
        const blocchi = data.trim().split(/\r?\n\r?\n/);
        
        tranSubtitles = blocchi.map(blocco => {  
          const righe = blocco.split(/\r?\n/);
          if (righe.length >= 3) {
            return {
              timestamp: righe[1],           
              testo: righe.slice(2).join(' ') 
            };
          }
          return null;
        }).filter(item => item !== null);
        
        localStorage.setItem('tranSubtitles', JSON.stringify(tranSubtitles)); 
      });

      loading.value = false;

      router.push({
        name: 'video-player',
        state: { 
          videoFile: videoFile.value,
          projectName: projectName.value,
          subtitles: subtitles,          
          tranSubtitles: tranSubtitles
        }
      });
    } catch (error) {
      console.error('Errore completo:', error);
      console.error('Risposta server:', error.response?.data);
      console.error('Status HTTP:', error.response?.status);
      console.error('URL chiamato:', error.config?.url);
      loading.value = false;
      alert(`Errore: ${error.message}`);
    }
  }

</script>

<style scoped>
p {
  text-align: left;
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.btn {
  background-color: #4a90e2;
  border-color: #4a90e2;
  width: 100%;
  color: white;
}

.btn:hover {
  background-color: #357abd;
  border-color: #357abd;
}

h1 {
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.project-form-content {
  background: #2a2a2a;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #3a3a3a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.main-form{
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.dropzone {
  border: 2px dashed #4a90e2;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #b0b0b0;
  background-color: #333333;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone:hover {
  border-color: #357abd;
  background-color: #3a3a3a;
}

.form-select {
  background-color: #333333;
  color: #e0e0e0;
  border: 1px solid #4a4a4a;
}

.form-select option {
  background-color: #2a2a2a;
  color: #e0e0e0;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.659);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>