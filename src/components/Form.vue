<template>
  <div class="project-form-container">
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
      <p>Video language</p>
      <select class="form-select mb-3" v-model="videoLanguage">
        <option value="">Select the language</option>
        <option value="en">English</option>
        <option value="it">Italian</option>
        <option value="fr">French</option>
      </select>
      <p>Target language</p>
      <select class="form-select mb-3" v-model="targetLanguage">
        <option value="">Select the language</option>
        <option value="en">English</option>
        <option value="it">Italian</option>
        <option value="fr">French</option>
      </select>
      <button class="btn btn-lg btn-light fw-bold" @click="createProject">Create</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const videoFile = ref(null)
const audioFile = ref(null)
const projectName = ref('')
const videoLanguage = ref('')
const targetLanguage = ref('')
const apiSubPost = 'http://localhost:3000/api/subtitles/post'
const apiConverionPost = 'http://localhost:3000/api/conversion/post'
const apiSubStatus = 'http://localhost:3000/api/subtitles/status'
const apiConverionStatus = 'http://localhost:3000/api/conversion/status'
const apiSubGet = 'http://localhost:3000/api/subtitles/get'
const apiConverionGet = 'http://localhost:3000/api/conversion/get'


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
/*
  try {
    const formData = new FormData();
    formData.append('file', videoFile.value);

    console.log('Inizio caricamento video...');

    const conversionJob = await axios.post(apiConverionPost, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Job conversione creato:', conversionJob.data);
    const jobId = conversionJob.data.id;

    console.log('Attendo conversione audio...');
    let audioData = null;
    let attempts = 0;
    const maxAttempts = 60; 
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativo ${attempts}/${maxAttempts}...`);
      
      const checkRes = await axios.get(`${apiConverionGet}/${jobId}`);
      console.log('Stato conversione:', checkRes.data);
      
      if (checkRes.data?.url || checkRes.data?.status === 'completed') {
        audioData = checkRes.data;
        console.log('Audio pronto!', audioData);
        break;
      }
      
      if (checkRes.data?.status === 'failed') {
        throw new Error('Conversione audio fallita');
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!audioData) {
      throw new Error('Timeout: conversione audio troppo lunga');
    }

    audioFile.value = audioData; 
    
    console.log('Avvio generazione sottotitoli...');
    const subsJob = await axios.post(apiSubPost, {
      audiofile: audioData.url, 
      source: videoLanguage.value,
      target: targetLanguage.value,
    });
    
    console.log('Job sottotitoli creato:', subsJob.data);
    const subsJobId = subsJob.data.id;
    
    console.log('Attendo generazione sottotitoli...');
    let subtitlesData = null;
    attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativo ${attempts}/${maxAttempts}...`);
      
      const checkRes = await axios.get(`${apiSubGet}/${subsJobId}`);
      console.log('Stato sottotitoli:', checkRes.data);
      
      if (checkRes.data?.subtitles || checkRes.data?.status === 'completed') {
        subtitlesData = checkRes.data;
        console.log('Sottotitoli pronti!', subtitlesData);
        break;
      }
      
      if (checkRes.data?.status === 'failed') {
        throw new Error('Generazione sottotitoli fallita');
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!subtitlesData) {
      throw new Error('Timeout: generazione sottotitoli troppo lunga');
    }

    console.log('Processo completato!', subtitlesData);

    
  } catch (error) {
    console.error('Errore completo:', error);
    console.error('Risposta server:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    
    alert(`Errore: ${error.message}`);
  }
}
*/
  router.push({
  path: '/editor',
  state: {
    videoFile: videoFile.value,
    projectName: projectName.value
  }
});

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
  width: 1025px;
  height: 612px;
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
</style>