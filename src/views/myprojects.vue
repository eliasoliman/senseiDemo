<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Form from '../components/Form.vue'

const router = useRouter();

const API_BASE = 'https://api.matita.net/subtitles-admin';
const token = localStorage.getItem('subtitles_token') || 'IL_TUO_TOKEN_MANUALE_QUI';

const profile = ref(null);
const projects = ref([]);
const users = ref([]);
const activeTab = ref('projects');
const loading = ref(false);
const showForm = ref(false); 

const api = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${token}` }
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const [profileRes, projectsRes] = await Promise.all([
      api.get('/me'),
      api.get('/projects')
    ]);
    profile.value = profileRes.data;
    projects.value = projectsRes.data;

    if (profile.value.admin) {
      const usersRes = await api.get('/users');
      users.value = usersRes.data;
    }
  } catch (err) {
    console.error("Errore nel caricamento:", err);
  } finally {
    loading.value = false;
  }
};

const deleteProject = async (id) => {
  if (!confirm("Eliminare questo progetto?")) return;
  try {
    await api.delete(`/projects/${id}`);
    loadDashboard();
  } catch (err) { 
    alert("Errore eliminazione"); 
  }
};

const onProjectCreated = () => {
  showForm.value = false;
  loadDashboard();
};

const logout = () => {
  localStorage.removeItem('subtitles_token');
  router.push('/home');
};

onMounted(loadDashboard);
</script>

<template>
  <div class="sensei-dashboard">
    <header class="top-bar">
      <div class="logo">Sensei</div>
      <div class="top-actions">
        <span v-if="profile" class="user-badge">{{ profile.username }}</span>
        <button @click="logout" class="btn-workspace">Logout</button>
      </div>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <nav>
          <button :class="{ active: activeTab === 'projects' }" @click="activeTab = 'projects'">
            📁 Projects
          </button>
          <button v-if="profile?.admin" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
            👥 Users (Admin)
          </button>
        </nav>
      </aside>

      <main class="content">
        <!-- Projects Tab -->
        <div v-if="activeTab === 'projects'" class="fade-in">
          <div class="header-section">
            <h2 class="section-title">I tuoi Progetti</h2>
            <button @click="showForm = true" class="btn-add-project" title="Crea nuovo progetto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
            </button>
          </div>

          <!-- Modal Form -->
          <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
            <div class="modal-content">
              <button class="btn-close-modal" @click="showForm = false">×</button>
              <Form @project-created="onProjectCreated" />
            </div>
          </div>

          <!-- Projects Grid -->
          <div v-if="projects.length > 0" class="projects-grid">
            <div v-for="p in projects" :key="p.id" class="project-card">
              <div class="project-thumbnail">
                <div class="video-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"/>
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                  </svg>
                </div>
              </div>
              <div class="project-info">
                <h3 class="project-name">{{ p.name }}</h3>
                <p class="project-id">ID: #{{ p.id }}</p>
                <p v-if="p.data" class="project-data">{{ p.data }}</p>
              </div>
              <div class="project-actions">
                <button @click="deleteProject(p.id)" class="btn-delete-card" title="Elimina progetto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
            </svg>
            <h3>Nessun progetto trovato</h3>
            <p>Inizia creando il tuo primo progetto</p>
            <button @click="showForm = true" class="btn-create-first">
              Crea Progetto
            </button>
          </div>
        </div>

        <!-- Users Tab (Admin) -->
        <div v-if="activeTab === 'users' && profile?.admin" class="fade-in">
          <h2 class="section-title">Gestione Utenti</h2>
          <div class="table-container">
            <table class="sensei-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>{{ u.username }}</td>
                  <td>{{ u.email }}</td>
                  <td><span :class="['badge', u.admin ? 'b-admin' : 'b-user']">{{ u.admin ? 'Admin' : 'User' }}</span></td>
                  <td><span class="status-dot" :class="{ deleted: u.is_deleted }"></span> {{ u.is_deleted ? 'Inattivo' : 'Attivo' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.sensei-dashboard {
  background-color: #1a1d23;
  color: #ffffff;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
  background: #121418;
}

.logo { 
  font-size: 24px; 
  font-weight: bold; 
}

.user-badge {
  margin-right: 15px;
  color: #8b949e;
}

.btn-workspace {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}

.btn-workspace:hover {
  background: #2563eb;
}

.main-layout { 
  display: flex; 
}

.sidebar {
  width: 240px;
  padding: 40px 20px;
  border-right: 1px solid #2d333b;
}

nav button {
  width: 100%;
  background: transparent;
  border: none;
  color: #8b949e;
  text-align: left;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

nav button.active { 
  background: #2d333b; 
  color: white; 
}

nav button:hover { 
  color: white; 
}

.content { 
  flex-grow: 1; 
  padding: 40px 60px; 
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-title { 
  font-size: 28px; 
  margin: 0;
}

.btn-add-project {
  background: #3b82f6;
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-add-project:hover {
  background: #2563eb;
  transform: scale(1.05);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;
}

.modal-content {
  background: #21262d;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  position: relative;
  animation: slideUp 0.3s ease-out;
}

.btn-close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  color: white;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.project-card {
  background: #21262d;
  border-radius: 12px;
  overflow: hidden;
  transition: 0.2s;
  cursor: pointer;
  border: 1px solid #30363d;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: #3b82f6;
}

.project-thumbnail {
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #2d333b 0%, #21262d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #30363d;
}

.video-placeholder {
  color: #3b82f6;
}

.project-info {
  padding: 16px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
}

.project-id {
  font-size: 12px;
  color: #8b949e;
  margin: 0 0 8px 0;
}

.project-data {
  font-size: 13px;
  color: #8b949e;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-actions {
  padding: 12px 16px;
  border-top: 1px solid #30363d;
  display: flex;
  justify-content: flex-end;
}

.btn-delete-card {
  background: transparent;
  border: 1px solid #f85149;
  color: #f85149;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.btn-delete-card:hover {
  background: #f85149;
  color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #8b949e;
}

.empty-state svg {
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  margin: 0 0 12px 0;
  color: #ffffff;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 24px 0;
}

.btn-create-first {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-create-first:hover {
  background: #2563eb;
}

/* Users Table */
.table-container { 
  background: #21262d; 
  border-radius: 12px; 
  overflow: hidden; 
}

.sensei-table { 
  width: 100%; 
  border-collapse: collapse; 
}

.sensei-table th { 
  background: #2d333b; 
  padding: 15px; 
  text-align: left; 
  color: #8b949e; 
  font-size: 13px; 
}

.sensei-table td { 
  padding: 15px; 
  border-bottom: 1px solid #30363d; 
}

.badge { 
  padding: 4px 8px; 
  border-radius: 4px; 
  font-size: 11px; 
}

.b-admin { 
  background: #238636; 
  color: white; 
}

.b-user { 
  background: #30363d; 
  color: #c9d1d9; 
}

.status-dot { 
  height: 8px; 
  width: 8px; 
  background: #238636; 
  border-radius: 50%; 
  display: inline-block; 
  margin-right: 5px; 
}

.status-dot.deleted { 
  background: #f85149; 
}

/* Animations */
.fade-in { 
  animation: fadeIn 0.4s ease-in; 
}

@keyframes fadeIn { 
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  } 
  to { 
    opacity: 1; 
    transform: translateY(0); 
  } 
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>