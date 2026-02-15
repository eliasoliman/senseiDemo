<template>
  <div class="cover-wrapper text-center text-bg-dark">
    <header class="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center">
      <h1 class="mb-0">Sensei</h1>
      <nav class="nav">
        <a
          href='/signup'
          class="signup btn btn-lg text-light glass-btn" 
          style="background: rgba(255, 255, 255, 0);border: 0;"
        >
           Sing up
        </a>

        <a
          href='/login'
          class="workspace btn btn-lg glass-btn" 
          style="background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); color: #009cc8;"
        >
          Workspace
        </a>
      </nav>
      
    </header>
    
    <main class="main-content text-center">
      <Form class="form"/>
    </main>  
       
  </div>
    
</template>

<script setup>
import Form from '../components/Form.vue'
</script>

<style scoped>
.position-absolute{
  background-color: #1A1A1A;
}
.cover-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #2a2a2a;
  text-shadow: 0 0.05rem 0.1rem rgba(0, 0, 0, 0.5);
}

h1{
  color: rgba(255, 255, 255, 0.918);
}

.main-content {
  max-width: 40rem;
  padding: 0 1rem;
  transform: translateY(97px);
}

.btn{
  background-color: rgba(31, 31, 31, 0.918);
  border-color: rgba(31, 31, 31, 0.918);
  border-radius: 16px;
}

.glass-btn:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
}
form{
  min-width: 100%;
  min-height: 100%;
}


@media (max-width: 768px) {
.cover-wrapper {
  min-width: 100%;
}

.main-content {
  max-width: 40rem;
}

.signup{
  display: none;
}

.text-black{
  font-size: 1.1em;
}
p{
  font-size: 0.8em;
}
}
</style>