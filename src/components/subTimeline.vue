<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { AVWaveform } from 'vue-audio-visual'

const props = defineProps({
  duration: Number,
  videoRef: Object,
  subtitles: Array,
  tranSubtitles: Array,
  pixelsPerSecond: {
    type: Number,
    default: 80
  }
})

const emit = defineEmits(['update:subtitles', 'update:tranSubtitles'])

const timelineWrapper = ref(null)
const currentTime = ref(0)
const isPlaying = ref(false)
const videoSrc = ref('')
const waveformKey = ref(0)
const isDragging = ref(false)
const draggingSubtitle = ref(null)
const resizingSubtitle = ref(null)
const resizeEdge = ref(null) 
const dragStartX = ref(0)
const dragStartTime = ref(0)
const dragStartDuration = ref(0)
const subtitleType = ref(null)
const isClick = ref(true)


const getVideoSrc = () => {
  if (!props.videoRef) return ''
  const videoElement = props.videoRef.value || props.videoRef
  return videoElement.src || videoElement.currentSrc || ''
}

watch(() => props.videoRef, () => {
  videoSrc.value = getVideoSrc()
}, { immediate: true, deep: true })

watch(() => props.pixelsPerSecond, () => {
  waveformKey.value++
})

const parseSrtTimestamp = (timestampStr) => {
  if (!timestampStr) return 0
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

const formatTimestampToSrt = (startTime, duration) => {
  const formatSrtTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }
  
  const endTime = startTime + duration
  return `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}`
}

const updateSubtitleTimestamp = (subId, newStart, newDuration, type) => {
  const isTran = type === 'tran'
  const updatedSubs = isTran ? [...props.tranSubtitles] : [...props.subtitles]
  const subToUpdate = updatedSubs[subId]
  
  if (subToUpdate) {
    subToUpdate.timestamp = formatTimestampToSrt(newStart, newDuration)
    
    updatedSubs.sort((a, b) => {
      const timeA = parseSrtTimestamp(a.timestamp)
      const timeB = parseSrtTimestamp(b.timestamp)
      return timeA - timeB
    })
    
    if (isTran) {
      emit('update:tranSubtitles', updatedSubs)
    } else {
      emit('update:subtitles', updatedSubs)
    }
  }
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

const processedTranSubtitles = computed(() => {
  if (!props.tranSubtitles || props.tranSubtitles.length === 0) return []
  
  return props.tranSubtitles.map((sub, index) => {
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

const isSubtitleActive = (sub) => {
  const time = currentTime.value
  return time >= sub.start && time <= (sub.start + sub.duration)
}

const handleSubtitleClick = (sub, type) => {
  if (!isClick.value) return
  
  if (type === 'tran' && props.videoRef) {
    const videoElement = props.videoRef.value || props.videoRef
    videoElement.currentTime = sub.start
    videoElement.pause()
  }
}

const updateProgress = () => {
  if (!props.videoRef) return
  const videoElement = props.videoRef.value || props.videoRef
  currentTime.value = videoElement.currentTime
  isPlaying.value = !videoElement.paused
}

watch(currentTime, (newVal) => {
  if (!timelineWrapper.value) return
  
  const container = timelineWrapper.value
  const playheadPosition = newVal * props.pixelsPerSecond
  
  const offset = 200
  const targetScroll = Math.max(0, playheadPosition - offset)
  
  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
})

watch(() => props.pixelsPerSecond, () => {
  if (timelineWrapper.value && props.videoRef) {
    const playheadPosition = currentTime.value * props.pixelsPerSecond
    const offset = 200
    timelineWrapper.value.scrollTo({
      left: Math.max(0, playheadPosition - offset),
      behavior: 'smooth'
    })
  }
})

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

const handleSubtitleMouseDown = (event, sub, edge = null, type = null) => {
  event.preventDefault()
  event.stopPropagation()
  
  isClick.value = true
  subtitleType.value = type
  
  if (edge && edge !== 'tran' && edge !== 'orig') {
    resizingSubtitle.value = sub
    resizeEdge.value = edge
    dragStartDuration.value = sub.duration
  } else if (!edge || edge === 'tran' || edge === 'orig') {
    draggingSubtitle.value = sub
  }
  
  dragStartX.value = event.clientX
  dragStartTime.value = sub.start
  
  document.body.style.cursor = (edge && edge !== 'tran' && edge !== 'orig') ? 'ew-resize' : 'grabbing'
  document.body.style.userSelect = 'none'
}

const handlePlayheadMouseDown = (event) => {
  event.preventDefault()
  isDragging.value = true
  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (event) => {
  if (isDragging.value && !draggingSubtitle.value && !resizingSubtitle.value) {
    if (!props.videoRef || !timelineWrapper.value) return
    
    const videoElement = props.videoRef.value || props.videoRef
    const rect = timelineWrapper.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left + timelineWrapper.value.scrollLeft
    const newTime = Math.max(0, Math.min(clickX / props.pixelsPerSecond, props.duration))
    
    videoElement.currentTime = newTime
    return
  }

  if (draggingSubtitle.value) {
    isClick.value = false
    const deltaX = event.clientX - dragStartX.value
    const deltaTime = deltaX / props.pixelsPerSecond
    const newStart = Math.max(0, Math.min(dragStartTime.value + deltaTime, props.duration - draggingSubtitle.value.duration))
    
    updateSubtitleTimestamp(draggingSubtitle.value.id, newStart, draggingSubtitle.value.duration, subtitleType.value)
    return
  }
  
  if (resizingSubtitle.value) {
    isClick.value = false
    const deltaX = event.clientX - dragStartX.value
    const deltaTime = deltaX / props.pixelsPerSecond
    
    if (resizeEdge.value === 'left') {
      const newStart = Math.max(0, Math.min(dragStartTime.value + deltaTime, dragStartTime.value + dragStartDuration.value - 0.5))
      const newDuration = dragStartTime.value + dragStartDuration.value - newStart
      updateSubtitleTimestamp(resizingSubtitle.value.id, newStart, newDuration, subtitleType.value)
    } else if (resizeEdge.value === 'right') {
      const newDuration = Math.max(0.5, dragStartDuration.value + deltaTime)
      updateSubtitleTimestamp(resizingSubtitle.value.id, resizingSubtitle.value.start, newDuration, subtitleType.value)
    }
  }
}

const handleMouseUp = () => {
  if (isDragging.value || draggingSubtitle.value || resizingSubtitle.value) {
    isDragging.value = false
    draggingSubtitle.value = null
    resizingSubtitle.value = null
    resizeEdge.value = null
    subtitleType.value = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
}

const waveformWidth = computed(() => {
  return (props.duration || 0) * props.pixelsPerSecond
})

onMounted(() => {
  if (props.videoRef) {
    const videoElement = props.videoRef.value || props.videoRef
    
    videoElement.addEventListener('timeupdate', updateProgress)
    videoElement.addEventListener('play', updateProgress)
    videoElement.addEventListener('pause', updateProgress)
    videoElement.addEventListener('loadedmetadata', () => {
      videoSrc.value = getVideoSrc()
    })

    videoSrc.value = getVideoSrc()
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  if (props.videoRef) {
    const videoElement = props.videoRef.value || props.videoRef
    
    videoElement.removeEventListener('timeupdate', updateProgress)
    videoElement.removeEventListener('play', updateProgress)
    videoElement.removeEventListener('pause', updateProgress)
  }
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="container">
    <div class="left">
      <div class="waveform">Waveform</div>
      <div class="track">Track 1</div>
      <div class="track">Track 2</div>
    </div>

    <div class="timeline-wrapper" ref="timelineWrapper">
      <div 
        class="ruler" 
        :style="{ width: (duration * pixelsPerSecond) + 'px' }"
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
          @mousedown="handlePlayheadMouseDown"
        >
          <div class="playhead-line"></div>
        </div>

        <div 
          ref="waveformContainer" 
          class="waveform-track"
          :style="{ width: waveformWidth + 'px' }"
        >
          <AVWaveform
            v-if="videoSrc"
            :key="`${videoSrc}-${waveformKey}`" 
            :src="videoSrc"
            :canv-width="waveformWidth"
            :playtime="false"
            :playtime-line-width="0"
            :canv-height="60"
            :line-width="3"
            :line-space="2"
            :line-color="'#60a5fa'"
            :audio-controls="false"
            :noplayed-line-width="0"
          />
          <div v-else class="waveform-placeholder">
            Caricamento video...
          </div>
        </div>

        <!-- Track 1 - tranSubtitles -->
        <div 
          v-for="sub in processedTranSubtitles" 
          :key="'tran-' + sub.id"
          class="sub-block"
          :class="{ 
            'sub-block-active': isSubtitleActive(sub),
            'sub-block-dragging': draggingSubtitle?.id === sub.id || resizingSubtitle?.id === sub.id
          }"
          :style="{ 
            position: 'absolute',
            left: '0px',
            top: '70px',
            width: (sub.duration * pixelsPerSecond) + 'px',
            transform: `translateX(${sub.start * pixelsPerSecond}px)` 
          }"
          :title="sub.originalTimestamp"
          @click="handleSubtitleClick(sub, 'tran')"
          @mousedown="(e) => handleSubtitleMouseDown(e, sub, null, 'tran')"
        >
          <div 
            class="resize-handle resize-handle-left"
            @mousedown.stop="(e) => handleSubtitleMouseDown(e, sub, 'left', 'tran')"
          ></div>
          <span class="sub-block-text">{{ sub.text }}</span>
          <div 
            class="resize-handle resize-handle-right"
            @mousedown.stop="(e) => handleSubtitleMouseDown(e, sub, 'right', 'tran')"
          ></div>
        </div>

        <!-- Track 2 - subtitles originali -->
        <div 
          v-for="sub in processedSubtitles" 
          :key="'orig-' + sub.id"
          class="sub-block"
          :class="{ 
            'sub-block-dragging': draggingSubtitle?.id === sub.id || resizingSubtitle?.id === sub.id
          }"
          :style="{ 
            position: 'absolute',
            left: '0px',
            top: '130px',
            width: (sub.duration * pixelsPerSecond) + 'px',
            transform: `translateX(${sub.start * pixelsPerSecond}px)` 
          }"
          :title="sub.originalTimestamp"
          @mousedown="(e) => handleSubtitleMouseDown(e, sub, null, 'orig')"
        >
          <div 
            class="resize-handle resize-handle-left"
            @mousedown.stop="(e) => handleSubtitleMouseDown(e, sub, 'left', 'orig')"
          ></div>
          <span class="sub-block-text">{{ sub.text }}</span>
          <div 
            class="resize-handle resize-handle-right"
            @mousedown.stop="(e) => handleSubtitleMouseDown(e, sub, 'right', 'orig')"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 10% 90%;
  width: 100%;
  height: 100%;
}

.left {
  padding-top: 30px;
  display: grid;
  grid-template-rows: 60px 60px 60px;
  align-items: center;
}

.timeline-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #111;
  border-top: 1px solid #333;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: #444 #111;
  scroll-behavior: smooth;
}

.ruler {
  height: 30px;
  position: relative;
  background: #1a1a1a;
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
  height: 200px;
  position: relative;
  background: #141414;
  background-image: linear-gradient(to right, #222 1px, transparent 1px);
  background-size: v-bind('pixelsPerSecond + "px"') 100%;
  display: grid;
  grid-template-rows: 60px 60px 60px;
}

.waveform-track {
  position: absolute;
  top: 0;
  left: 0;
  height: 60px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
}

.waveform-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 12px;
}

.waveform-track :deep(canvas) {
  display: block !important;
  width: 100% !important;
  height: 60px !important;
  background: transparent !important;
}

.waveform-track :deep(audio) {
  display: none !important;
}

.playhead {
  position: absolute;
  top: -30px;
  left: 0;
  z-index: 100;
  pointer-events: all;
  cursor: grab;
}

.playhead:active {
  cursor: grabbing;
}

.playhead-line {
  width: 2px;
  height: 230px;
  background: #ff4500;
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.5);
}

.sub-block {
  height: 40px;
  background: rgba(0, 120, 215, 0.5);
  border: 1px solid #0078d7;
  border-radius: 4px;
  padding: 4px 8px;
  overflow: hidden;
  color: white;
  font-size: 11px;
  cursor: grab;
  z-index: 5;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
}

.sub-block-dragging {
  cursor: grabbing;
  opacity: 0.8;
  z-index: 15;
}

.sub-block-active {
  border-color: #8025f7;
  box-shadow: 0 0 10px rgba(137, 41, 234, 0.6);
  transform: translateX(var(--translate-x)) scale(1.05);
  z-index: 10;
}

.sub-block-text {
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  overflow: hidden;
  flex: 1;
  pointer-events: none;
}

.sub-block:hover {
  background: rgba(0, 120, 215, 0.8);
}

.resize-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.resize-handle-left {
  left: 0;
  background: linear-gradient(to right, rgba(255,255,255,0.3), transparent);
}

.resize-handle-right {
  right: 0;
  background: linear-gradient(to left, rgba(255,255,255,0.3), transparent);
}

.sub-block:hover .resize-handle {
  opacity: 1;
}
</style>