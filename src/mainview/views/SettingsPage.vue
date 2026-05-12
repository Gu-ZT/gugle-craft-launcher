<script setup lang="ts">
import {config} from "@renderer/scripts/config";
import {onMounted, ref} from "vue";
import {rpc} from "@renderer/scripts/rpc";

const autoMem = ref((config.value?.memory_config || 'auto') == 'auto')
const mem = ref<number>((config.value?.memory_config == 'auto' ? 1024 : config.value?.memory_config) || 1024)
const maxMem = ref<number>(4096)
const freeMem = ref<number>(1024)

onMounted(getMemSize)

function setAutoMem(value: boolean | (string | number | boolean)[], _: Event) {
  autoMem.value = !!value;
  if (value) {
    config.value!.memory_config = 'auto';
  } else {
    config.value!.memory_config = 1024;
  }
}

async function getMemSize() {
  const memSize = await rpc.request.getMemSize();
  maxMem.value = Math.floor(memSize[0] / 1024 / 1024)
  freeMem.value = Math.floor(memSize[1] / 1024 / 1024)
  mem.value = Math.min(mem.value, )
}
</script>

<template>
  <div class="settings-page-container">
    <a-card class="settings-card">
      <template #title>
        下载设置
      </template>
      <a-form :model="{}">
        <a-form-item label="文件下载源">
          <a-select v-model="config!.download_config.download_source">
            <a-option :value="'official'">尽量使用官方源</a-option>
            <a-option :value="'mirror'">尽量使用镜像源</a-option>
            <a-option :value="'official_preference'">优先使用官方源</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="版本列表源">
          <a-select v-model="config!.download_config.version_source">
            <a-option :value="'official'">尽量使用官方源</a-option>
            <a-option :value="'mirror'">尽量使用镜像源</a-option>
            <a-option :value="'official_preference'">优先使用官方源</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-card>
    <a-card class="settings-card">
      <template #title>
        启动设置
      </template>
      <a-form :model="{}">
        <a-form-item label="版本隔离">
          <a-select v-model="config!.launch_config.version_isolation">
            <a-option :value="'none'">关闭</a-option>
            <a-option :value="'all'">隔离所有版本</a-option>
            <a-option :value="'mod'">隔离可安装 MOD 的版本</a-option>
            <a-option :value="'informal'">隔离非正式版</a-option>
            <a-option :value="'mod_informal'">隔离可安装 MOD 的版本和非正式版</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="游戏标题">
          <a-input v-model="config!.launch_config.game_title" placeholder="默认"/>
        </a-form-item>
        <a-form-item label="窗口大小">
          <a-select v-model="config!.launch_config.window_size">
            <a-option :value="'default'">默认</a-option>
            <a-option :value="'fullscreen'">全屏</a-option>
            <a-option :value="'custom'">自定义</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Java">
          <a-select v-model="config!.launch_config.java_path">
          </a-select>
        </a-form-item>
      </a-form>
    </a-card>
    <a-card class="settings-card">
      <template #title>
        内存设置
      </template>
      <a-form :model="{}">
        <a-form-item label="自动分配">
          <a-checkbox v-model="autoMem" @change="setAutoMem"/>
        </a-form-item>
        <a-form-item label="手动分配">
          <a-slider v-model="mem" :disabled="autoMem" :max="maxMem"/>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.settings-page-container {
}

.settings-card {
  margin-bottom: 20px;
}
</style>