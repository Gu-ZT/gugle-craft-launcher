<script setup lang="ts">

</script>

<template>
  <div class="start-page-container">
    <div class="version-select">
      <a-select placeholder="版本选择"/>
    </div>
    <a-button class="settings-btn" size="large">版本设置</a-button>
    <a-button class="status-btn" size="large">版本管理</a-button>
    <a-button class="start-btn" shape="round" size="large" type="primary">启动游戏</a-button>
  </div>
</template>

<style scoped>
.start-page-container {
}

.version-select {
  position: absolute;
  bottom: 60px;
  right: 20px;
  height: 60px;
  width: 200px;
}

.start-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  height: 60px;
  width: 200px;
  font-size: 32px;
}

.status-btn {
  position: absolute;
  bottom: 20px;
  right: 230px;
  height: 25px;
  width: 100px;
}

.settings-btn {
  position: absolute;
  bottom: 55px;
  right: 230px;
  height: 25px;
  width: 100px;
}
</style>