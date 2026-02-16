<script setup>
import { ref } from 'vue';
import axios from 'axios';

const apiCreateUser = 'https://api.matita.net/subtitles-admin/users';
const tokenBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3MTA4MzgwMn0.ecwoBEtVwHpIDHw3nD8T5PkR3xa2DCQFmDnf23g3TzQ'

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const message = ref({ text: '', type: '' });

const handleSignin = async () => {
  loading.value = true;
  message.value = { text: '', type: '' };

  try {
    const payload = {
      username: username.value,
      email: email.value,
      password: password.value,
      admin: false 
    };

    const response = await axios.post(apiCreateUser, payload, {
      headers:{
       ' Authorization': tokenBearer,
      }
    });

    if (response.status === 201) {
      message.value = { 
        text: `Account created for ${response.data.username}! You can now login.`, 
        type: 'success' 
      };
      username.value = '';
      email.value = '';
      password.value = '';
    }
  } catch (err) {
    message.value = { 
      text: err.response?.data?.detail || "Error during registration. Check your data.", 
      type: 'error' 
    };
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
          href='/home'
          class="workspace btn btn-lg glass-btn" 
          style="background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); color: #009cc8;"
        >
          Home
        </a>
      </nav>
      
    </header>

    <main class="auth-content">
      <div class="auth-card">
        <h2>Create your account</h2>
        <p class="subtitle">Join the Sensei Subtitles community</p>

        <form @submit.prevent="handleSignin" class="auth-form">
          <div class="form-group">
            <label>Username</label>
            <input 
              v-model="username" 
              type="text" 
              placeholder="Your username" 
              required 
              minlength="3"
            />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input 
              v-model="email" 
              type="email" 
              placeholder="name@example.com" 
              required 
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Creating account...' : 'Sign Up' }}
          </button>

          <transition name="fade">
            <div v-if="message.text" :class="['message-box', message.type]">
              {{ message.text }}
            </div>
          </transition>
        </form>
        
        <div class="footer-link">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Base Dark Theme */
.sensei-auth-container {
  min-height: 100vh;
  background-color: #1a1d23;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* Header */
.auth-header {
  padding: 20px 40px;
}
.logo {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: -0.5px;
}

/* Card Layout */
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.glass-btn:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
}

h2 { margin: 0 0 10px 0; font-size: 24px; text-align: center; }
.subtitle { text-align: center; color: #8b949e; margin-bottom: 30px; font-size: 14px; }

/* Form Styles (Uniformed to Screenshot) */
.form-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-size: 13px; color: #8b949e; }

input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #ffffff; /* Sfondo bianco come in foto */
  color: #000000;      /* Testo nero per leggibilità su bianco */
  font-size: 15px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Button */
.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 20px; /* Arrotondato come il bottone Workspace */
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

.btn-primary:hover { background-color: #2563eb; }
.btn-primary:disabled { background-color: #2d333b; color: #8b949e; cursor: not-allowed; }

/* Messages */
.message-box {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}
.success { background: rgba(35, 134, 54, 0.1); color: #3fb950; border: 1px solid rgba(63, 185, 80, 0.3); }
.error { background: rgba(248, 81, 73, 0.1); color: #f85149; border: 1px solid rgba(248, 81, 73, 0.3); }

/* Footer */
.footer-link { margin-top: 25px; text-align: center; font-size: 14px; color: #8b949e; }
.footer-link a { color: #3b82f6; text-decoration: none; font-weight: 500; }
.footer-link a:hover { text-decoration: underline; }

/* Animations */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>