<script setup>
import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'https://api.matita.net/subtitles-admin/users';
const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3MTA4MzgwMn0.ecwoBEtVwHpIDHw3nD8T5PkR3xa2DCQFmDnf23g3TzQ';

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const message = ref({ text: '', type: '' });

const handleSignup = async () => {
  loading.value = true;
  message.value = { text: '', type: '' };

  try {
    const response = await axios.post(
      API_URL,
      {
        username: username.value,
        email: email.value,
        password: password.value,
        admin: false,
      },
      {
        headers: {
          'Authorization': TOKEN,          
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 201) {
      message.value = {
        text: `Account creato per ${response.data.username}! Ora puoi effettuare il login.`,
        type: 'success',
      };
      username.value = '';
      email.value = '';
      password.value = '';
    }
  } catch (err) {
    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      message.value = {
        text: detail.map(d => d.msg).join(' | '),
        type: 'error',
      };
    } else {
      message.value = {
        text: detail || 'Errore durante la registrazione. Controlla i dati inseriti.',
        type: 'error',
      };
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="sensei-auth-container">
    <header class="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center">
      <h1 class="mb-0">Sensei</h1>
      <nav class="nav">
        <a
          href="/home"
          class="workspace btn btn-lg glass-btn"
          style="background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.2); color: #009cc8;"
        >
          Home
        </a>
      </nav>
    </header>

    <main class="auth-content">
      <div class="auth-card">
        <h2>Crea il tuo account</h2>
        <p class="subtitle">Unisciti alla community Sensei Subtitles</p>

        <form @submit.prevent="handleSignup" class="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Il tuo username"
              required
              minlength="3"
              maxlength="50"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="email">Indirizzo Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="nome@esempio.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              minlength="1"
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Creazione account...' : 'Registrati' }}
          </button>

          <transition name="fade">
            <div v-if="message.text" :class="['message-box', message.type]">
              {{ message.text }}
            </div>
          </transition>
        </form>

        <div class="footer-link">
          Hai già un account? <a href="/login">Accedi</a>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sensei-auth-container {
  min-height: 100vh;
  background-color: #1a1d23;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

.auth-content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.auth-card {
  background: #21262d;
  padding: 40px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.glass-btn:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
}

h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #8b949e;
  margin-bottom: 30px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #8b949e;
}

input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #ffffff;
  color: #000000;
  font-size: 15px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #2d333b;
  color: #8b949e;
  cursor: not-allowed;
}

.message-box {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.success {
  background: rgba(35, 134, 54, 0.1);
  color: #3fb950;
  border: 1px solid rgba(63, 185, 80, 0.3);
}

.error {
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  border: 1px solid rgba(248, 81, 73, 0.3);
}

.footer-link {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  color: #8b949e;
}

.footer-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.footer-link a:hover {
  text-decoration: underline;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>