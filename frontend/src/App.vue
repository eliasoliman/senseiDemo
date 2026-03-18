<script setup>

</script>

<template>
  <div class="content">
      <router-view />
  </div>
</template>

<style>
body {
  margin: 0px !important;
  background-color: #212529 !important;
}

/* ─── Light mode overrides ─────────────────────────────────────── */
body.light-mode {
  background: #9dadc7;
  color: #1e293b;
}

/* Header */
body.light-mode .header {
  background-color: #8a9db8 !important;
  border-bottom: 1px solid #7a8da8;
}

body.light-mode h3 { color: #1d3a6e; }

/* Container / layout */
body.light-mode .container { background: #9dadc7; }

/* Sidebar */
body.light-mode .sidebar { background-color: #8a9db8 !important; }
body.light-mode .subtitle-block { background: #adbdd4; border-left-color: #2563eb; }
body.light-mode .subtitle-block:hover { background: #bccadd; }
body.light-mode .subtitle-block-active { background: #dbeafe !important; box-shadow: 0 0 8px #60a5fa99; }
body.light-mode .timestamp { color: #1d3a6e; }
body.light-mode .subtitle-block-active .timestamp { color: #0891b2; }
body.light-mode .testo { color: #1e293b; }

/* Track switcher / badges */
body.light-mode .track-btn { color: #2d3f57; }
body.light-mode .track-btn:hover { background: rgba(0,0,0,0.08); color: #1e293b; }
body.light-mode .track-btn.active { color: #1d4ed8; border-bottom-color: #1d4ed8; background: rgba(37,99,235,0.12); }
body.light-mode .sidebar-track-badge { border-bottom-color: #7a8da8; }
body.light-mode .badge-orig { color: #065f46; background: rgba(5,150,105,0.15); }
body.light-mode .badge-tran { color: #1d4ed8; background: rgba(29,78,216,0.15); }

/* Separator buttons */
body.light-mode .separator-line { background: rgba(0,0,0,0.15); }
body.light-mode .btn-add { background: rgba(37,99,235,0.2); color: #1d3a6e; border-color: rgba(37,99,235,0.5); }
body.light-mode .btn-duplicate { background: rgba(109,40,217,0.12); color: #5b21b6; border-color: rgba(109,40,217,0.4); }
body.light-mode .btn-merge { background: rgba(5,150,105,0.12); color: #065f46; border-color: rgba(5,150,105,0.4); }

/* Video area */
body.light-mode .video-area { background-color: #8a9db8; }

/* Timeline */
body.light-mode .timeline { background-color: #8a9db8; }

/* Nav buttons */
body.light-mode .btn-back { color: #1e293b; border-color: #6a7d98; }
body.light-mode .btn-back:hover { color: #0f172a; border-color: #1e293b; }
body.light-mode .btn-undo { color: #92400e; border-color: #92400e; }
body.light-mode .btn-theme { color: #1e293b; border-color: #6a7d98; }
body.light-mode .btn-theme:hover { color: #0f172a; border-color: #1e293b; }

/* Modals */
body.light-mode .modal-content { background: #adbdd4; }
body.light-mode .modal-header { border-bottom-color: #8a9db8; }
body.light-mode .modal-header h4 { color: #1d4ed8; }
body.light-mode .modal-footer { border-top-color: #8a9db8; }
body.light-mode .form-control { background: #9dadc7; border-color: #7a8da8; color: #1e293b; }
body.light-mode .btn-secondary { background: #8a9db8; color: #1e293b; }
body.light-mode .btn-close { color: #1e293b; }

/* Timeline subTimeline component */
body.light-mode .timeline-wrapper { background: #8a9db8; border-top-color: #7a8da8; scrollbar-color: #6a7d98 #8a9db8; }
body.light-mode .ruler { background: #7a8da8; border-bottom-color: #6a7d98; }
body.light-mode .time-label { color: #1e293b; }
body.light-mode .tick-major { background: #2d3f57; }
body.light-mode .track-area { background: #9dadc7; background-image: linear-gradient(to right, #8a9db8 1px, transparent 1px); }
body.light-mode .waveform-track { background: #7a8da8; border-bottom-color: #6a7d98; }
body.light-mode .waveform-label,
body.light-mode .track-label { color: #1e293b; }
body.light-mode .eye-btn { color: #2d3f57; }
body.light-mode .eye-btn:hover { color: #1e293b; }
body.light-mode .eye-btn-active { color: #1d4ed8 !important; }

/* ─── SVG icons in light mode ──────────────────────────────────── */
body.light-mode svg {
  color: #1e293b;
  fill: #1e293b;
}

/* Eccezioni: SVG dentro bottoni colorati non devono diventare neri */
body.light-mode .btn-save svg,
body.light-mode .btn-export svg,
body.light-mode .btn-primary svg {
  color: #fff;
  fill: #fff;
}
</style>
