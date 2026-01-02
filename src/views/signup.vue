<template>
  <div class="content  d-flex justify-content-center align-items-center">
    <header class="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center">
      <h1 class="mb-0">Sensei</h1>
      <nav class="nav">
        <a
          href='/home'
          class="btn btn-lg glass-btn" 
          style="background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); color: #009cc8;"
        >
          Home
        </a>
      </nav>
    </header>

    <div class="login-area">
      <div class="login-img">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaXJYx7RodTsDNd5VyoJuTll-MmIeEpuMniQ&s" alt="fbk logo">
      </div>
      <div class="login-form">
          <div class="mb-3 ">
          <label for="inputEmail" class="col-sm-2 col-form-label">Email</label>
          <div class="col-sm-10">
          <input type="mail" class="form-control" id="inputEmail">
          </div>
          </div>
          <div class="mb-3 ">
          <label for="inputPassword" class="col-sm-2 col-form-label">Password</label>
          <div class="col-sm-10">
          <input type="password" class="form-control" id="inputPassword">
          </div>
          </div>
          <div class="mb-3 ">
          <label for="inputPassword" class="col-sm-2 col-form-label">Confirm Password</label>
          <div class="col-sm-10">
          <input type="password" class="form-control" id="inputPassword">
          </div>
          </div>
          <div class="mb-3 ">
            <button type="submit" class="btn btn-primary mb-3">Confirm identity</button>
          </div>
      </div>

    </div>

  </div>

</template>

<script>
</script>

<style>
.content{
  min-height: 100vh;
  background-image: url(Hero\ 2.png);
  background-repeat: no-repeat;
  background-size: cover;
  color: #fff;
  text-shadow: 0 0.05rem 0.1rem rgba(0, 0, 0, 0.5);
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

h3,h1{
  color: rgba(255, 255, 255, 0.918);
}

.login-area{
  background: rgba(255, 255, 255, 0.41);
  backdrop-filter: blur(40px) saturate(180%);
  padding: 2rem;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 342px;
}
</style>
