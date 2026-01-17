<script setup>
import { onMounted, onUnmounted, ref, provide, nextTick, watch, computed } from 'vue'
import subTimeline from '../components/subTimeline.vue'

const videoUrl = ref('')
const videoFile = ref(null)
const subtitles = ref([])
const videoPlayer = ref(null) 
const isPlaying = ref(false)
const zoomLevel = ref(1)
const waveformKey = ref(0)
const currentTime = ref(0)
const videoDuration = ref(0)
const pixelsPerSecond = ref(80)
const subtitlesScroll = ref(null)

const calculatedWidth = computed(() => {
  if (videoDuration.value === 0) return 1200
  return Math.floor(videoDuration.value * pixelsPerSecond.value * zoomLevel.value)
})

provide('zoomLevel', zoomLevel)
provide('calculatedWidth', calculatedWidth)

// Funzione per parsare il timestamp dei sottotitoli
const parseSrtTimestamp = (timestampStr) => {
  if (!timestampStr) return 0
  const startTime = timestampStr.split('-->')[0].trim().replace(',', '.')
  const parts = startTime.split(':').map(Number)
  
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
  }
  return 0
}

// Trova l'indice del sottotitolo attivo
const getActiveSubtitleIndex = () => {
  if (!subtitles.value || subtitles.value.length === 0) return -1
  
  for (let i = 0; i < subtitles.value.length; i++) {
    const sub = subtitles.value[i]
    const start = parseSrtTimestamp(sub.timestamp)
    
    // Calcola la durata (se c'è un end time)
    let duration = 2 // default
    if (sub.timestamp.includes('-->')) {
      const parts = sub.timestamp.split('-->')
      const end = parseSrtTimestamp(parts[1].trim())
      duration = end - start
    }
    
    if (currentTime.value >= start && currentTime.value <= start + duration) {
      return i
    }
  }
  return -1
}

// Ottieni il testo del sottotitolo attivo
const activeSubtitleText = computed(() => {
  const activeIndex = getActiveSubtitleIndex()
  if (activeIndex < 0) return ''
  return subtitles.value[activeIndex]?.testo || ''
})

// Autoscroll della sidebar
const scrollSidebarToActive = () => {
  if (!subtitlesScroll.value || !isPlaying.value) return
  
  const activeIndex = getActiveSubtitleIndex()
  if (activeIndex < 0) return
  
  // Inizia a centrare dopo il terzo elemento
  if (activeIndex < 3) return
  
  const container = subtitlesScroll.value
  const blocks = container.querySelectorAll('.subtitle-block')
  
  if (blocks[activeIndex]) {
    const block = blocks[activeIndex]
    const containerHeight = container.clientHeight
    const blockTop = block.offsetTop
    const blockHeight = block.clientHeight
    
    // Calcola lo scroll per centrare il blocco
    const targetScroll = blockTop - (containerHeight / 2) + (blockHeight / 2)
    
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }
}

// Verifica se un sottotitolo è attivo (per evidenziarlo)
const isSubtitleActive = (index) => {
  return getActiveSubtitleIndex() === index
}

const setupVideoSync = () => {
  if (videoPlayer.value) {
    videoPlayer.value.onloadedmetadata = () => {
      videoDuration.value = videoPlayer.value.duration
    }
    
    // Aggiorna currentTime e isPlaying
    videoPlayer.value.ontimeupdate = () => {
      currentTime.value = videoPlayer.value.currentTime
    }
    
    videoPlayer.value.onplay = () => {
      isPlaying.value = true
    }
    
    videoPlayer.value.onpause = () => {
      isPlaying.value = false
    }
  }
}

// Watch per autoscroll sidebar
watch(currentTime, () => {
  scrollSidebarToActive()
})

onMounted(() => {
  if (history.state) {
    videoFile.value = history.state.videoFile
    videoUrl.value = URL.createObjectURL(videoFile.value)
  }
  
  const stored = localStorage.getItem('subtitles')
  if (stored) {
    subtitles.value = JSON.parse(stored)
  }

  nextTick(() => {
    setupVideoSync()
  })
})

onUnmounted(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
})

const restartVideo = () => {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = 0
    videoPlayer.value.play()
  }
}

const togglePlay = () => {
  if (videoPlayer.value) {
    videoPlayer.value.paused ? videoPlayer.value.play() : videoPlayer.value.pause()
  }
}

const endVideo = () => {
  if (videoPlayer.value) videoPlayer.value.currentTime = videoPlayer.value.duration
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
  pixelsPerSecond.value = 80 * zoomLevel.value
  waveformKey.value++
}

const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.25)
  pixelsPerSecond.value = 80 * zoomLevel.value
  waveformKey.value++
}

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
            <div class="subtitles-scroll" ref="subtitlesScroll">
              <div 
                v-for="(subtitle, index) in subtitles" 
                :key="index" 
                class="subtitle-block"
                :class="{ 'subtitle-block-active': isSubtitleActive(index) }"
              >
                <span class="timestamp">{{ subtitle.timestamp }}</span>
                <p class="testo">{{ subtitle.testo }}</p>
              </div>
            </div>
        </div>

        <div class="video-area">
          <div class="video-box">
              <video ref="videoPlayer" v-if="videoUrl" :src="videoUrl" controls></video>
              
              <!-- Overlay sottotitolo sul video -->
              <div v-if="activeSubtitleText" class="subtitle-overlay">
                <span class="subtitle-text">{{ activeSubtitleText }}</span>
              </div>
          </div>
          <div class="video-commands">
            <svg @click="restartVideo" xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-skip-start-fill" viewBox="0 0 16 16"><path d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.54-.313 1.232.066 1.232.696v7.384c0 .63-.692 1.01-1.232.697L5 8.753V12a.5.5 0 0 1-1 0z"/></svg>
            <svg @click="togglePlay" v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>
            <svg @click="togglePlay" v-else xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/></svg>
            <svg @click="endVideo" xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-skip-end-fill" viewBox="0 0 16 16"><path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0z"/></svg>
          </div> 
        </div>
      </div>

      <div class="timeline">
        <div class="time-row">
          <div class="name zoomIcons">
              <svg @click="zoomOut" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/><path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
              </svg>
              <svg @click="zoomIn" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/><path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
              </svg>
          </div>
          <div class="track">
            <subTimeline 
              v-if="videoDuration > 0"
              :duration="videoDuration"
              :videoRef="videoPlayer"
              :subtitles="subtitles"
              v-model:pixelsPerSecond="pixelsPerSecond"
            />
          </div>
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
  overflow: hidden; 
}
.header { 
  grid-area: header; 
  background-color: #212529; 
  height: 60px; 
}
h3 { 
  color: rgba(18, 83, 163, 0.918); 
}
.nav { 
  display: flex; 
  gap: 1rem; 
}
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
  min-width: 100%; height: calc(100vh); 
  overflow: hidden; gap: 0; 
}
.content { 
  display: grid; 
  grid-template-columns: 40% 60%; 
  width: 100%; 
  overflow: hidden; 
  height: 100%; 
  align-items: stretch; 
  max-height: 100% 
}
.sidebar { 
  background-color: rgb(40, 40, 40); 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  padding-bottom: 30vh; 
  height: 100%; 
}
.subtitles-scroll { 
  flex: 1; 
  overflow-y: auto; 
  overflow-x: hidden; 
  padding-right: 0.5rem; 
  min-height: 0;
  scroll-behavior: smooth;
}
.subtitle-block { 
  padding: 1rem; 
  margin-bottom: 0.8rem; 
  background: #2a2d31; 
  border-left: 4px solid rgba(18, 83, 163, 0.918); 
  border-radius: 4px;
  transition: all 0.3s ease;
}

.subtitle-block-active {
  background: #3a4a5a !important;
  box-shadow: 0 0 8px rgba(137, 41, 234, 0.6);
  transform: scale(1.02);
}

.timestamp { 
  display: block; 
  font-weight: bold; 
  color: rgba(18, 83, 163, 0.918); 
  font-size: 0.85rem; 
  margin-bottom: 0.5rem; 
}

.subtitle-block-active .timestamp {
  color: rgba(137, 41, 234, 0.6);
}

.testo { 
  margin: 0; 
  color: #fff; 
  line-height: 1.4; 
  font-size: 0.9rem; 
}
.video-area { 
  background-color: rgb(33, 32, 32); 
  display: grid; 
  place-items: center; 
  padding-bottom: 30vh; 
}
.video-box { 
  width: 90%;
  position: relative;
}
.video-box video { 
  width: 100%; 
  height: auto; 
  display: block; 
  object-fit: contain; 
}

/* Overlay sottotitolo sul video */
.subtitle-overlay {
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.subtitle-text {
  display: inline-block;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.video-area { 
  background-color: rgb(33, 32, 32); 
  display: grid; 
  place-items: center; 
  padding-bottom: 30vh; 
}

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
.zoomIcons { 
  cursor: pointer; 
}
</style>