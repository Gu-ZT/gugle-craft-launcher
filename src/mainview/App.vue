<script setup lang="ts">
import {rpc} from "./scripts/rpc";
import {onMounted, ref} from "vue";
import StartPage from "./views/StartPage.vue";
import AppsPage from "./views/AppsPage.vue";
import DownloadPage from "./views/DownloadPage.vue";
import SettingsPage from "./views/SettingsPage.vue";

async function quit() {
  await rpc.request.exit({exit: true});
}

async function minimize() {
  await rpc.request.minimize({minimize: true});
}

const isDark = ref<boolean>(false);

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark';
  if (isDark.value) {
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    document.body.removeAttribute('arco-theme');
  }
})

function toggleDark() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    localStorage.setItem('theme', 'dark');
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    localStorage.removeItem('theme');
    document.body.removeAttribute('arco-theme');
  }
}

type Page = 'start' | 'download' | 'settings' | 'apps';
const selectPage = ref<Page>("start");

function togglePage(page: Page) {
  selectPage.value = page;
}
</script>

<template>
  <div class="container">
    <a-page-header :style="{
      background: 'var(--color-bg-2)',
      '-webkit-app-region': 'drag',
      'border-radius': '15px 15px 0 0',
      'border-bottom': '1px solid var(--color-neutral-3)',
    }"
                   title="Gugle Craft Launcher"
                   :show-back="false">
      <template #extra>
        <div style="display: inline-block;margin-right: 10px;">
          <a-button shape="circle" @click="toggleDark">
            <icon-sun v-if="!isDark"/>
            <icon-moon v-else/>
          </a-button>
          <a-button shape="circle" :type="selectPage==='start'?'primary':'secondary'" style="margin-left: 10px;"
                    @click="togglePage('start')">
            <icon-play-arrow/>
          </a-button>
          <a-button shape="circle" :type="selectPage==='download'?'primary':'secondary'" style="margin-left: 10px;"
                    @click="togglePage('download')">
            <icon-download/>
          </a-button>
          <a-button shape="circle" :type="selectPage==='settings'?'primary':'secondary'" style="margin-left: 10px;"
                    @click="togglePage('settings')">
            <icon-settings/>
          </a-button>
          <a-button shape="circle" :type="selectPage==='apps'?'primary':'secondary'" style="margin-left: 10px;"
                    @click="togglePage('apps')">
            <icon-apps/>
          </a-button>
        </div>
        <a-button-group>
          <a-button shape="round" status="warning" type="dashed" @click="minimize">
            <icon-minus/>
          </a-button>
          <a-button shape="round" status="danger" type="dashed" @click="quit">
            <icon-close/>
          </a-button>
        </a-button-group>
      </template>
    </a-page-header>
    <a-scrollbar class="page-content">
      <div class="page-content">
        <start-page v-if="selectPage==='start'"/>
        <download-page v-if="selectPage==='download'"/>
        <settings-page v-if="selectPage==='settings'"/>
        <apps-page v-if="selectPage==='apps'"/>
      </div>
    </a-scrollbar>
  </div>
</template>

<style scoped>
.container {
  background: var(--color-bg-1);
  width: 100%;
  height: 100vh;
  border-radius: 15px;
  margin: 0;
}

.page-content {
  height: calc(100vh - 65px);
  overflow: auto;
  padding: 15px;
}
</style>
