<script setup>
import { onMounted, onUnmounted, ref, provide, nextTick, watch, computed } from 'vue'
import subTimeline from '../components/subTimeline.vue'

const videoUrl = ref('')
const videoFile = ref(null)
const subtitles = ref([])
const tranSubtitles = ref([])
const videoPlayer = ref(null) 
const isPlaying = ref(false)
const zoomLevel = ref(1)
const waveformKey = ref(0)
const currentTime = ref(0)
const videoDuration = ref(0)
const pixelsPerSecond = ref(80)
const subtitlesScroll = ref(null)
const selectedSubtitleIndex = ref(-1)
const isPlayingSelectedSubtitle = ref(false)


const showModal = ref(false)
const editingIndex = ref(-1)
const editForm = ref({
  timestamp: '',
  testo: ''
})

const calculatedWidth = computed(() => {
  if (videoDuration.value === 0) return 1200
  return Math.floor(videoDuration.value * pixelsPerSecond.value * zoomLevel.value)
})

provide('zoomLevel', zoomLevel)
provide('calculatedWidth', calculatedWidth)

const parseSrtTimestamp = (timestampStr) => {
  if (!timestampStr) return 0
  const startTime = timestampStr.split('-->')[0].trim().replace(',', '.')
  const parts = startTime.split(':').map(Number)
  
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
  }
  return 0
}

const parseSrtTimestampEnd = (timestampStr) => {
  if (!timestampStr || !timestampStr.includes('-->')) return 0
  const endTime = timestampStr.split('-->')[1].trim().replace(',', '.')
  const parts = endTime.split(':').map(Number)
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
  }
  return 0
}

const formatSrtTimestamp = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

const buildTimestamp = (startSec, endSec) => {
  return `${formatSrtTimestamp(startSec)} --> ${formatSrtTimestamp(endSec)}`
}

const addSubtitleBetween = (index) => {
  const DEFAULT_DURATION = 0.2

  const prev = tranSubtitles.value[index]
  const next = tranSubtitles.value[index + 1]

  const newStart = parseSrtTimestampEnd(prev.timestamp)
  const newEnd = newStart + DEFAULT_DURATION

  if (next) {
    const nextStart = parseSrtTimestamp(next.timestamp)
    const nextEnd = parseSrtTimestampEnd(next.timestamp)
    if (newEnd > nextStart) {
      const adjustedNextStart = newEnd
      const adjustedNextEnd = Math.max(nextEnd, adjustedNextStart + 0.001)
      next.timestamp = buildTimestamp(adjustedNextStart, adjustedNextEnd)
    }
  }

  const newSub = {
    timestamp: buildTimestamp(newStart, newEnd),
    testo: ''
  }

  tranSubtitles.value.splice(index + 1, 0, newSub)
  localStorage.setItem('tranSubtitles', JSON.stringify(tranSubtitles.value))
}

const mergeSubtitles = (index) => {
  const a = tranSubtitles.value[index]
  const b = tranSubtitles.value[index + 1]
  if (!a || !b) return

  const startSec = parseSrtTimestamp(a.timestamp)
  const endSec = parseSrtTimestampEnd(b.timestamp)

  const merged = {
    timestamp: buildTimestamp(startSec, endSec),
    testo: [a.testo, b.testo].filter(t => t.trim()).join(' ')
  }

  tranSubtitles.value.splice(index, 2, merged)
  localStorage.setItem('tranSubtitles', JSON.stringify(tranSubtitles.value))

  if (selectedSubtitleIndex.value === index + 1) {
    selectedSubtitleIndex.value = index
  } else if (selectedSubtitleIndex.value > index + 1) {
    selectedSubtitleIndex.value--
  }
}

const getActiveSubtitleIndex = () => {
  if (!tranSubtitles.value || tranSubtitles.value.length === 0) return -1
  
  for (let i = 0; i < tranSubtitles.value.length; i++) {
    const sub = tranSubtitles.value[i]
    const start = parseSrtTimestamp(sub.timestamp)
    
    let duration = 2 
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

const activeSubtitleText = computed(() => {
  const activeIndex = getActiveSubtitleIndex()
  if (activeIndex < 0) return ''
  return tranSubtitles.value[activeIndex]?.testo || ''
})

const scrollSidebarToActive = () => {
  if (!subtitlesScroll.value || !isPlaying.value) return
  
  const activeIndex = getActiveSubtitleIndex()
  if (activeIndex < 0) return
  if (activeIndex < 3) return
  
  const container = subtitlesScroll.value
  const blocks = container.querySelectorAll('.subtitle-block')
  
  if (blocks[activeIndex]) {
    const block = blocks[activeIndex]
    const containerHeight = container.clientHeight
    const blockTop = block.offsetTop
    const blockHeight = block.clientHeight
    const targetScroll = blockTop - (containerHeight / 2) + (blockHeight / 2)
    
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }
}

const isSubtitleActive = (index) => {
  return getActiveSubtitleIndex() === index
}

const checkSubtitleEnd = () => {
  if (selectedSubtitleIndex.value >= 0 && isPlayingSelectedSubtitle.value) {
    const sub = tranSubtitles.value[selectedSubtitleIndex.value]
    if (!sub) return
    
    const startTime = parseSrtTimestamp(sub.timestamp)
    const parts = sub.timestamp.split('-->')
    const endTime = parts.length > 1 ? parseSrtTimestamp(parts[1].trim()) : startTime + 2
    
    if (currentTime.value >= endTime) {
      videoPlayer.value.pause()
      selectedSubtitleIndex.value = -1
      isPlayingSelectedSubtitle.value = false
    }
  }
}

const handleSidebarDoubleClick = (index) => {
  if (!videoPlayer.value || !tranSubtitles.value[index]) return
  
  const sub = tranSubtitles.value[index]
  const startTime = parseSrtTimestamp(sub.timestamp)
  
  videoPlayer.value.currentTime = startTime
  videoPlayer.value.pause()
  
  selectedSubtitleIndex.value = index
  isPlayingSelectedSubtitle.value = false
}

const handleSubtitleSelect = (index) => {
  selectedSubtitleIndex.value = index
  isPlayingSelectedSubtitle.value = false
  
  if (subtitlesScroll.value && tranSubtitles.value[index]) {
    nextTick(() => {
      const container = subtitlesScroll.value
      const blocks = container.querySelectorAll('.subtitle-block')
      
      if (blocks[index]) {
        const block = blocks[index]
        const containerHeight = container.clientHeight
        const blockTop = block.offsetTop
        const blockHeight = block.clientHeight
        const targetScroll = blockTop - (containerHeight / 2) + (blockHeight / 2)
        
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        })
      }
    })
  }
}

provide('onSubtitleSelect', handleSubtitleSelect)

const setupVideoSync = () => {
  if (videoPlayer.value) {
    videoPlayer.value.onloadedmetadata = () => {
      videoDuration.value = videoPlayer.value.duration
    }

    videoPlayer.value.ontimeupdate = () => {
      currentTime.value = videoPlayer.value.currentTime
      checkSubtitleEnd()
    }
    
    videoPlayer.value.onplay = () => {
      isPlaying.value = true
      if (selectedSubtitleIndex.value >= 0 && !isPlayingSelectedSubtitle.value) {
        isPlayingSelectedSubtitle.value = true
      }
    }
    
    videoPlayer.value.onpause = () => {
      isPlaying.value = false
    }
  }
}

const deleteSubtitle = (index) => {
  tranSubtitles.value.splice(index, 1)
  localStorage.setItem('tranSubtitles', JSON.stringify(tranSubtitles.value))

  if (selectedSubtitleIndex.value === index) {
    selectedSubtitleIndex.value = -1
  } else if (selectedSubtitleIndex.value > index) {
    selectedSubtitleIndex.value--
  }
}

const openEditModal = (index) => {
  editingIndex.value = index
  editForm.value = {
    timestamp: tranSubtitles.value[index].timestamp,
    testo: tranSubtitles.value[index].testo
  }
  showModal.value = true
  
  if (videoPlayer.value && !videoPlayer.value.paused) {
    videoPlayer.value.pause()
  }
}

const closeModal = () => {
  showModal.value = false
  editingIndex.value = -1
  editForm.value = { timestamp: '', testo: '' }
}

const saveEdit = () => {
  if (editingIndex.value >= 0) {
    tranSubtitles.value[editingIndex.value] = {
      timestamp: editForm.value.timestamp,
      testo: editForm.value.testo
    }
    
    tranSubtitles.value.sort((a, b) => {
      const timeA = parseSrtTimestamp(a.timestamp)
      const timeB = parseSrtTimestamp(b.timestamp)
      return timeA - timeB
    })
    
    localStorage.setItem('tranSubtitles', JSON.stringify(tranSubtitles.value))
    
    closeModal()
  }
}

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

  const storedTran = localStorage.getItem('tranSubtitles')
  if (storedTran) {
    tranSubtitles.value = JSON.parse(storedTran)
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
              <template v-for="(subtitle, index) in tranSubtitles" :key="index">
                <!-- Blocco sottotitolo -->
                <div 
                  class="subtitle-block"
                  :class="{ 'subtitle-block-active': isSubtitleActive(index) }"
                  @dblclick="handleSidebarDoubleClick(index)"
                >
                  <span class="timestamp">{{ subtitle.timestamp }}</span>
                  <p class="testo">{{ subtitle.testo }}</p>
                  <div class="block-actions">
                    <button class="btn-delete" @click.stop="deleteSubtitle(index)" title="Elimina sottotitolo">Delete</button>
                    <button class="btn-edit" @click.stop="openEditModal(index)">Edit</button>
                  </div>
                </div>

                <!-- Separatore con pulsanti Add e Merge -->
                <div
                  v-if="index < tranSubtitles.length - 1"
                  class="subtitle-separator"
                >
                  <div class="separator-line"></div>
                  <div class="separator-actions">
                    <button
                      class="btn-sep btn-add"
                      title="Aggiungi sottotitolo vuoto qui"
                      @click.stop="addSubtitleBetween(index)"
                    >+ add</button>
                    <button
                      class="btn-sep btn-merge"
                      title="Unisci i due sottotitoli"
                      @click.stop="mergeSubtitles(index)"
                    >⊕ merge</button>
                  </div>
                  <div class="separator-line"></div>
                </div>
              </template>
            </div>
        </div>

        <div class="video-area">
          <div class="video-box">
              <video ref="videoPlayer" v-if="videoUrl" :src="videoUrl" controls></video>
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
              v-model:subtitles="subtitles"
              v-model:tranSubtitles="tranSubtitles"
              v-model:pixelsPerSecond="pixelsPerSecond"
            />
          </div>
        </div>

      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Edit Subtitle</h4>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="timestamp">Timestamp</label>
            <input 
              id="timestamp"
              v-model="editForm.timestamp" 
              type="text" 
              class="form-control"
              placeholder="00:00:01,000 --> 00:00:03,000"
            />
          </div>
          <div class="form-group">
            <label for="testo">Text</label>
            <textarea 
              id="testo"
              v-model="editForm.testo" 
              class="form-control"
              rows="4"
              placeholder="Inserisci il testo del sottotitolo"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveEdit">Save</button>
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
  grid-template-rows: 55px 1fr; 
  grid-template-areas: "header" "container"; 
  overflow: hidden; 
}
.header { 
  grid-area: header; 
  background-color: #212529; 
  height: 50px; 
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

/* ── Blocco sottotitolo ── */
.subtitle-block { 
  display: flex;
  flex-direction: column;
  padding: 1px ;
  margin-bottom: 0;
  background: #2a2d31; 
  border-left: 4px solid rgba(18, 83, 163, 0.918); 
  border-radius: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.subtitle-block:hover {
  background: #353841;
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
  margin-bottom: 4px;
  flex-shrink: 0;
}

.subtitle-block-active .timestamp {
  color: rgba(137, 41, 234, 0.6);
}

.testo { 
  margin: 0 0 6px 0;
  color: #fff; 
  line-height: 1.4; 
  font-size: 0.9rem;
  word-break: break-word;
}

/* ── Riga bottoni in fondo al blocco ── */
.block-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 2px;
}

.btn-delete,
.btn-edit {
  padding: 3px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.5;
}

.btn-delete {
  background: rgba(180, 40, 40, 0.65);
  color: #ffd5d5;
}

.btn-delete:hover {
  background: rgba(210, 40, 40, 1);
  color: #fff;
  transform: translateY(-1px);
}

.btn-edit {
  background: rgba(18, 83, 163, 0.8);
  color: #c8dcff;
}

.btn-edit:hover {
  background: rgba(18, 83, 163, 1);
  color: #fff;
  transform: translateY(-1px);
}

.subtitle-block-active .btn-edit {
  background: rgba(137, 41, 234, 0.75);
  color: #e8d5ff;
}

.subtitle-block-active .btn-edit:hover {
  background: rgba(137, 41, 234, 1);
  color: #fff;
}

/* ── Separatore con pulsanti Add / Merge ── */
.subtitle-separator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  opacity: 0.25;
  transition: opacity 0.2s ease;
}

.subtitle-separator:hover {
  opacity: 1;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}

.separator-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-sep {
  padding: 1px 8px;
  font-size: 0.68rem;
  font-weight: 600;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  line-height: 1.6;
  letter-spacing: 0.02em;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-add {
  background: rgba(18, 83, 163, 0.5);
  color: #c8dcff;
  border: 1px solid rgba(18, 83, 163, 0.7);
}

.btn-add:hover {
  background: rgba(18, 83, 163, 0.9);
  color: #fff;
  box-shadow: 0 2px 6px rgba(18, 83, 163, 0.4);
}

.btn-merge {
  background: rgba(137, 41, 234, 0.35);
  color: #d9b8ff;
  border: 1px solid rgba(137, 41, 234, 0.55);
}

.btn-merge:hover {
  background: rgba(137, 41, 234, 0.8);
  color: #fff;
  box-shadow: 0 2px 6px rgba(137, 41, 234, 0.4);
}

/* ── Video area ── */
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

.timeline { 
  background-color: #171819; 
  overflow-x: auto; 
  overflow-y: hidden; 
  z-index: 1; 
  transform: translateY(30px); 
}
.zoomIcons { 
  cursor: pointer; 
}

/* ── Modale ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #2a2d31;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #3a3d41;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  color: rgba(18, 83, 163, 0.918);
}

.btn-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: rgba(18, 83, 163, 0.918);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(18, 83, 163, 0.918);
  font-weight: bold;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background: #1a1d21;
  border: 1px solid #3a3d41;
  border-radius: 4px;
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: rgba(18, 83, 163, 0.918);
  box-shadow: 0 0 0 3px rgba(18, 83, 163, 0.2);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #3a3d41;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #3a3d41;
  color: #fff;
}

.btn-secondary:hover {
  background: #4a4d51;
}

.btn-primary {
  background: rgba(18, 83, 163, 0.918);
  color: #fff;
}

.btn-primary:hover {
  background: rgba(18, 83, 163, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(18, 83, 163, 0.3);
}
</style>