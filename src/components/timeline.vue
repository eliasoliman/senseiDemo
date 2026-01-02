<script setup lang="ts">
import { ref, watch, onMounted, inject, computed } from 'vue'
import { useWaveSurfer } from '@meersagor/wavesurfer-vue'
import { useWaveSurferTimeline } from '@meersagor/wavesurfer-vue'

const props = defineProps<{
  videoFile: File | null,
  videoElement: HTMLVideoElement | null
}>()

const containerRef = ref<HTMLElement | null>(null)
const cursorPosition = ref(0)
const isDragging = ref(false)
const videoDuration = ref(0)

const zoomLevel = inject('zoomLevel', ref(1))
const containerWidth = computed(() => `${zoomLevel.value * 100}%`)

const options = {
  "height": 1,
  "waveColor": "transparent",
  "progressColor": "transparent",
  "volume": 0,
  "autoplay": false,
  "loop": false,
  "responsive": true,
  "fillParent": true,
  "interact": false
}

const { waveSurfer } = useWaveSurfer({
  containerRef,
  options
})

const timelineOptions = {
  height: 40,
  timeInterval: 1,
  primaryLabelInterval: 5,
  secondaryLabelInterval: 1,
  style: {
    fontSize: '11px',
    color: '#fff'
  }
}

const { timelinePlugin } = useWaveSurferTimeline({ 
  waveSurfer,
  options: timelineOptions
})

const loadVideo = () => {
  if (props.videoFile && waveSurfer.value) {
    const videoUrl = URL.createObjectURL(props.videoFile)
    waveSurfer.value.load(videoUrl)
  }
}

const syncWithVideo = () => {
  if (!props.videoElement || !waveSurfer.value) return

  const video = props.videoElement

  video.addEventListener('loadedmetadata', () => {
    videoDuration.value = video.duration
  })

  video.addEventListener('timeupdate', () => {
    if (waveSurfer.value && !isDragging.value && video.duration > 0) {
      const progress = video.currentTime / video.duration
      waveSurfer.value.seekTo(progress)
      cursorPosition.value = progress * 100
    }
  })
}

const startDrag = (event: MouseEvent) => {
  isDragging.value = true
  updateCursorPosition(event)
}

const onDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    updateCursorPosition(event)
  }
}

const stopDrag = () => {
  isDragging.value = false
}

const updateCursorPosition = (event: MouseEvent) => {
  const container = containerRef.value
  if (!container || !props.videoElement) return

  const rect = container.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  
  cursorPosition.value = percentage
  props.videoElement.currentTime = (percentage / 100) * props.videoElement.duration
}

onMounted(() => {
  loadVideo()
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
})

watch(() => props.videoFile, () => {
  loadVideo()
})

watch(() => props.videoElement, (newVideo) => {
  if (newVideo) {
    syncWithVideo()
  }
})
</script>

<template>
  <div class="timeline-container">
    <div ref="containerRef" class="timeline-wrapper" :style="{ width: containerWidth }">
      <div 
        class="playhead" 
        :style="{ left: cursorPosition + '%' }"
        @mousedown="startDrag"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  width: 100%;
  height: 100%;
  background-color: #212529;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 10px;
  box-sizing: border-box;
  position: relative;
}

.timeline-wrapper {
  min-width: 100%;
  position: relative;
  transition: width 0.3s ease;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #ff0000;
  cursor: ew-resize;
  z-index: 10;
  pointer-events: all;
}

.playhead::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -4px;
  width: 10px;
  height: 10px;
  background-color: #ff0000;
  border-radius: 50%;
}
</style>