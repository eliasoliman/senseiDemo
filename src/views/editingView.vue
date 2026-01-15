<script setup>
import { onMounted, onUnmounted, ref, provide, nextTick, watch, computed } from 'vue'
import Timeline from '../components/timeline.vue'
import { AVWaveform } from 'vue-audio-visual'

const videoUrl = ref('')
const videoFile = ref(null)
const subtitles = ref([])
const videoPlayer = ref(null)
const waveformComponent = ref(null) 
const isPlaying = ref(false)
const zoomLevel = ref(1)
const timelineRef = ref(null)
const waveformKey = ref(0)
const currentTime = ref(0)
const videoDuration = ref(0)
const pixelsPerSecond = ref(50)


const calculatedWidth = computed(() => {
  if (videoDuration.value === 0) return 1200
  return Math.floor(videoDuration.value * pixelsPerSecond.value * zoomLevel.value)
})
provide('zoomLevel', zoomLevel)
provide('calculatedWidth', calculatedWidth)

const setupVideoSync = () => {
  if (videoPlayer.value) {
    videoPlayer.value.onloadedmetadata = () => {
      videoDuration.value = videoPlayer.value.duration
    }
    
    videoPlayer.value.ontimeupdate = () => {
      currentTime.value = videoPlayer.value.currentTime
      
      // Sincronizzazione forzata: se la waveform ha un audio interno, pareggiamo i tempi
      if (waveformComponent.value?.audio) {
        if (Math.abs(waveformComponent.value.audio.currentTime - videoPlayer.value.currentTime) > 0.1) {
          waveformComponent.value.audio.currentTime = videoPlayer.value.currentTime
        }
      }
    }

    videoPlayer.value.onplay = () => { 
      isPlaying.value = true
      // Avvia il motore della waveform (i controlli nascosti)
      if (waveformComponent.value?.audio) {
        waveformComponent.value.audio.play()
      }
    }
    
    videoPlayer.value.onpause = () => { 
      isPlaying.value = false 
      // Ferma il motore della waveform
      if (waveformComponent.value?.audio) {
        waveformComponent.value.audio.pause()
      }
    }
  }
}

onMounted(() => {
  if (history.state) {
    videoFile.value = history.state.videoFile
    videoUrl.value = URL.createObjectURL(videoFile.value)
  }
  
  nextTick(() => {
    timelineRef.value = document.querySelector('.timeline')
    setupVideoSync()
  })
})

onMounted(() => {
  console.log('1. onMounted eseguito')
  const stored = localStorage.getItem('subtitles')
  console.log('2. Cosa c\'è in localStorage:', stored)
  
  if (stored) {
    subtitles.value = JSON.parse(stored)
    console.log('Sottotitoli caricati:', subtitles.value.length)
  }
})

onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
})

const restartVideo = () => {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = 0
    if (waveformComponent.value?.audio) waveformComponent.value.audio.currentTime = 0
    videoPlayer.value.play()
  }
}

const togglePlay = () => {
  if (videoPlayer.value) {
    if (videoPlayer.value.paused) {
      videoPlayer.value.play()
    } else {
      videoPlayer.value.pause()
    }
  }
}

const endVideo = () => {
  if (videoPlayer.value) {
    const end = videoPlayer.value.duration
    videoPlayer.value.currentTime = end
    if (waveformComponent.value?.audio) waveformComponent.value.audio.currentTime = end
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
    waveformKey.value++
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 5) {
    zoomLevel.value = Math.min(5, zoomLevel.value + 0.25)
    waveformKey.value++
  }
}

// Watcher per garantire che l'audio della waveform sia mutato (non vogliamo eco)
watch(() => waveformComponent.value?.audio, (audio) => {
  if (audio) {
    audio.muted = true
  }
})

watch(videoPlayer, (newPlayer) => {
  if (newPlayer) setupVideoSync()
})

</script>

<template>
  <div class="wrapper">
    <header class="header fixed-top p-3 d-flex justify-content-between align-items-center">
      <h3 class="mb-0">Sensei</h3>
      <nav class="nav">
        <a href="/home" class="nav-link text-white-50 fw-bold">Home</a>
        <a href="/signin" class="nav-link text-white-50 fw-bold">Sign in</a>
      </nav>
    </header>

    <div class="container">
      <div class="content">
        <div class="sidebar">
            <div class="subtitles-scroll">
              <div 
                v-for="(subtitle, index) in subtitles" 
                :key="index"
                class="subtitle-block"
              >
                <span class="timestamp">{{ subtitle.timestamp }}</span>
                <p class="testo">{{ subtitle.testo }}</p>
              </div>
      </div>
    </div>
        <div class="video-area">
          <div class="video-box">
              <video 
                ref="videoPlayer" 
                v-if="videoUrl" 
                :src="videoUrl" 
                controls
              ></video>
          </div>
          <div class="video-commands">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-skip-start-fill" viewBox="0 0 16 16" @click="restartVideo">
              <path d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.54-.313 1.232.066 1.232.696v7.384c0 .63-.692 1.01-1.232.697L5 8.753V12a.5.5 0 0 1-1 0z"/>
            </svg>

            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16" @click="togglePlay">
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16" @click="togglePlay">
              <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
            </svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-skip-end-fill" viewBox="0 0 16 16" @click="endVideo">
              <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0z"/>
            </svg>
          </div> 
        </div>
      </div>
      <div class="timeline">
        <div class="time">
            <div class="zoomIcons">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16" @click="zoomOut">
                <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16" @click="zoomIn">
                <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
              </svg>
            </div> 
            <div><Timeline class="time" v-if="videoFile" :videoFile="videoFile" :videoElement="videoPlayer" /></div>
        </div>
         <div class="waveform">
            <div class="name"><div>Traccia audio</div></div>
            <div class="track">
              <div class="waveform-container" :style="{ width: calculatedWidth + 'px' }">
                <AVWaveform 
                  ref="waveformComponent"
                  :key="waveformKey"
                  class="waveform2" 
                  :src="videoUrl" 
                  v-if="videoFile && videoDuration > 0" 
                  :canv-width="calculatedWidth" 
                  :audio-controls="0"
                  :played-line-width="2"
                  :played-line-color="'#ff0000'"
                  :current-time="currentTime"
                />
              </div>
            </div>
         </div>
         <div class="traccia1">
            <div class="name">traccia 1</div>
            <div class="track">ciao</div>
         </div>
         <div class="traccia2">
            <div class="name">traccia 2</div>
            <div class="track">ciao</div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #212529;
  color: #fff;
  text-shadow: 0 0.05rem 0.1rem rgba(0, 0, 0, 0.5);
  display: grid;
  grid-template-rows: 70px 1fr;
  grid-template-areas: "header" "container";
}

.header {
  grid-area: header;
  background-color: #212529;
  height: 70px;
}

h3 { color: rgba(18, 83, 163, 0.918); }

.nav { display: flex; gap: 1rem; }
.nav a {
  color: rgba(255, 255, 255, 0.5);
  font-weight: bold;
  text-decoration: none;
  border-bottom: 0.25rem solid transparent;
  padding-bottom: 0.25rem;
  transition: all 0.2s ease;
}

.container {
  grid-area: container;
  display: grid;
  grid-template-rows: 65% 35%;
  min-width: 100%;
  height: calc(100vh); /* AGGIUNGI QUESTA RIGA */
  overflow: hidden;
}

.content {
  display: grid;
  grid-template-columns: 40% 60%;
  width: 100%;
}

.sidebar { 
  background-color: rgb(40, 40, 40);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem;
}

.sidebar h2 {
  margin: 0 0 1rem 0;
  flex-shrink: 0;
}

.subtitles-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  min-height: 0;
}

.subtitle-block {
  padding: 1rem;
  margin-bottom: 0.8rem;
  background: #2a2d31;
  border-left: 4px solid rgba(18, 83, 163, 0.918);
  border-radius: 4px;
}

.subtitle-block:last-child {
  margin-bottom: 0;
}

.timestamp {
  display: block;
  font-weight: bold;
  color: rgba(18, 83, 163, 0.918);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.testo {
  margin: 0;
  color: #fff;
  line-height: 1.4;
  font-size: 0.9rem;
}

.subtitles-scroll::-webkit-scrollbar {
  width: 6px;
}

.subtitles-scroll::-webkit-scrollbar-track {
  background: #2a2d31;
  border-radius: 3px;
}

.subtitles-scroll::-webkit-scrollbar-thumb {
  background: rgba(18, 83, 163, 0.918);
  border-radius: 3px;
}

.subtitles-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(18, 83, 163, 1);
}

.video-area {
  background-color: rgb(108, 98, 83);
  display: grid;
  place-items: center;
}

.video-box { width: 77%; }
.video-box video { width: 100%; height: auto; display: block; object-fit: contain; }

.timeline {
  background-color: #171819;
  display: grid;
  grid-template-rows: 16% 28% 28% 28%;
  grid-template-areas: "time" "waveform" "traccia1" "traccia2";
  gap: 0px;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 1;
  transform: translateY(30px);
}

.timeline >*{
  display: grid;
  height: 80px;
  grid-template-columns: 10% 90%;
  grid-template-areas: "name" "tracks";
  min-width: 100%;
  transform: translateY(13px);
}

.time { 
  transform: translateX(-5px); 
}
.name {
  grid-area: name;
  text-align: center;
  background-color: #212529;
  z-index: 2;
}

.track {
  background-color: #2a2d31;
  padding: 0;
  overflow: visible;
  z-index: 1;
  position: relative;
}

.waveform-container {
  position: relative;
  height: 100%;
  transition: width 0.1s linear;
}

.waveform2 { width: 100%; height: 100%; display: block; }
.video-commands { transform: translateY(-150px); }
.zoomIcons { transform: translateX(10px); }
</style>