<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  duration: Number,
  videoRef: Object,
  subtitles: Array,
  pixelsPerSecond: {
    type: Number,
    default: 80
  }
})

const timelineWrapper = ref(null)
const currentTime = ref(0)
const isPlaying = ref(false)

// --- LOGICA DI PARSING PER FORMATO "00:01:16,900 --> 00:01:18,900" ---
const parseSrtTimestamp = (timestampStr) => {
  if (!timestampStr) return 0
  // Prende la parte d'inizio prima della freccia, cambia la virgola in punto
  const startTime = timestampStr.split('-->')[0].trim().replace(',', '.')
  const parts = startTime.split(':').map(Number)
  
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
  }
  return 0
}

const parseSrtDuration = (timestampStr) => {
  if (!timestampStr.includes('-->')) return 2
  const parts = timestampStr.split('-->').map(t => parseSrtTimestamp(t.trim()))
  return Math.max(0.5, parts[1] - parts[0])
}

const processedSubtitles = computed(() => {
  if (!props.subtitles || props.subtitles.length === 0) return []
  
  return props.subtitles.map((sub, index) => {
    const start = parseSrtTimestamp(sub.timestamp)
    const duration = parseSrtDuration(sub.timestamp)
    
    return {
      id: index,
      start, 
      duration,
      text: sub.testo || sub.text || '',
      originalTimestamp: sub.timestamp
    }
  })
})

// --- AUTO-SCROLL (Tua logica originale ripristinata) ---
const handleAutoScroll = () => {
  if (!timelineWrapper.value || !isPlaying.value) return
  
  const container = timelineWrapper.value
  const cursorX = currentTime.value * props.pixelsPerSecond
  const containerWidth = container.clientWidth
  const targetScroll = cursorX - containerWidth / 2
  const margin = 50
  
  if (cursorX < container.scrollLeft + margin || cursorX > container.scrollLeft + containerWidth - margin) {
    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }
}

const updateProgress = () => {
  if (!props.videoRef) return
  currentTime.value = props.videoRef.currentTime
  isPlaying.value = !props.videoRef.paused
  handleAutoScroll()
}

watch(() => props.pixelsPerSecond, () => {
  if (timelineWrapper.value && props.videoRef) {
    const cursorX = currentTime.value * props.pixelsPerSecond
    const targetScroll = cursorX - timelineWrapper.value.clientWidth / 2
    timelineWrapper.value.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }
})

// --- LOGICA DEL RIGHELLO (Ripristinata) ---
const dynamicStep = computed(() => {
  if (props.pixelsPerSecond < 30) return 30
  if (props.pixelsPerSecond < 60) return 10
  return 5
})

const timeMarkers = computed(() => {
  const markers = []
  for (let i = 0; i <= (props.duration || 0); i += dynamicStep.value) {
    markers.push(i)
  }
  return markers
})

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const handleRulerDblClick = (event) => {
  if (!props.videoRef) return
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left + timelineWrapper.value.scrollLeft
  const newTime = clickX / props.pixelsPerSecond
  props.videoRef.currentTime = Math.min(newTime, props.duration)
}

onMounted(() => {
  if (props.videoRef) {
    props.videoRef.addEventListener('timeupdate', updateProgress)
    props.videoRef.addEventListener('play', updateProgress)
    props.videoRef.addEventListener('pause', updateProgress)
  }
})

onUnmounted(() => {
  if (props.videoRef) {
    props.videoRef.removeEventListener('timeupdate', updateProgress)
    props.videoRef.removeEventListener('play', updateProgress)
    props.videoRef.removeEventListener('pause', updateProgress)
  }
})
</script>

<template>
  <div class="timeline-wrapper" ref="timelineWrapper">
    <div 
      class="ruler" 
      :style="{ width: (duration * pixelsPerSecond) + 'px' }"
      @dblclick="handleRulerDblClick"
    >
      <div 
        v-for="time in timeMarkers" 
        :key="time" 
        class="marker-group"
        :style="{ left: (time * pixelsPerSecond) + 'px' }"
      >
        <span class="time-label">{{ formatTime(time) }}</span>
        <div class="tick-major"></div>
      </div>
    </div>

    <div class="track-area" :style="{ width: (duration * pixelsPerSecond) + 'px' }">
      <div 
        class="playhead" 
        :style="{ transform: `translateX(${currentTime * pixelsPerSecond}px)` }"
      >
        <div class="playhead-line"></div>
      </div>

      <div 
        v-for="sub in processedSubtitles" 
        :key="sub.id"
        class="sub-block"
        :style="{ 
          position: 'absolute',
          left: '0px',
          top: '15px',
          width: (sub.duration * pixelsPerSecond) + 'px',
          /* SPOSTAMENTO X: Secondi * Pixel/Secondo */
          transform: `translateX(${sub.start * pixelsPerSecond}px)` 
        }"
        :title="sub.originalTimestamp"
      >
        <span class="sub-block-text">{{ sub.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #111;
  border-top: 1px solid #333;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: #444 #111;
}

.ruler {
  height: 30px;
  position: relative;
  background: #1a1a1a;
  cursor: crosshair;
  border-bottom: 1px solid #333;
}

.marker-group {
  position: absolute;
  top: 0;
  height: 100%;
}

.time-label {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  color: #888;
  font-family: monospace;
}

.tick-major {
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 8px;
  background: #555;
}

.track-area {
  height: 120px;
  position: relative;
  background: #141414;
  background-image: linear-gradient(to right, #222 1px, transparent 1px);
  background-size: v-bind('pixelsPerSecond + "px"') 100%;
}

.playhead {
  position: absolute;
  top: -30px;
  left: 0;
  height: 150px;
  z-index: 100;
  pointer-events: none;
}

.playhead-line {
  width: 2px;
  height: 100%;
  background: #ff4500;
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.5);
}

.sub-block {
  height: 40px;
  background: rgba(0, 120, 215, 0.5);
  border: 1px solid #0078d7;
  border-radius: 4px;
  padding: 4px;
  overflow: hidden;
  color: white;
  font-size: 11px;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.sub-block-text {
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  overflow: hidden;
}

.sub-block:hover {
  background: rgba(0, 120, 215, 0.8);
}
</style>