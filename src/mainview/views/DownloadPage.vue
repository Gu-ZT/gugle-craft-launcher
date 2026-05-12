<script setup lang="ts">
import {onMounted, Ref, ref} from "vue";
import {VersionManifestVersion} from "@shared/mojang";
import {rpc} from "@renderer/scripts/rpc";

const versions: Ref<VersionManifestVersion[]> = ref([])
const snapshot: Ref<VersionManifestVersion[]> = ref([])

onMounted(async () => {
  const version_list = (await rpc.request.getVersionManifest()).versions

  const releases: VersionManifestVersion[] = []
  const snapshots: VersionManifestVersion[] = []
  for (let version of version_list) {
    if (version.type === 'release') {
      releases.push(version)
    } else {
      snapshots.push(version)
    }
  }

  versions.value = releases
  snapshot.value = snapshots
})
</script>

<template>
  <div class="download-page-container">
    <a-menu mode="horizontal" :defaultSelectedKeys="['game']">
      <a-menu-item key="game">游戏</a-menu-item>
      <a-menu-item key="mod">模组</a-menu-item>
      <a-menu-item key="data_pack">数据包</a-menu-item>
      <a-menu-item key="resource_pack">资源包</a-menu-item>
      <a-menu-item key="mod_pack">整合包</a-menu-item>
    </a-menu>
    <a-card>
      <a-collapse :default-active-key="['1']" accordion>
        <a-collapse-item header="正式版" key="release">
          <a-card v-for="version in versions" class="version-card">
            <div class="version-card-id">
              {{ version.id }}
            </div>
            <div class="version-card-date-time">
              <div class="version-card-date">
                {{ (new Date(Date.parse(version.releaseTime))).toLocaleDateString() }}
              </div>
              <div class="version-card-time">
                {{ (new Date(Date.parse(version.releaseTime))).toLocaleTimeString() }}
              </div>
            </div>
          </a-card>
        </a-collapse-item>
        <a-collapse-item header="快照版" key="snapshot">
          <a-card v-for="version in snapshot" class="version-card">
            <div class="version-card-id">
              {{ version.id }}
            </div>
            <div class="version-card-date-time">
              <div class="version-card-date">
                {{ (new Date(Date.parse(version.releaseTime))).toLocaleDateString() }}
              </div>
              <div class="version-card-time">
                {{ (new Date(Date.parse(version.releaseTime))).toLocaleTimeString() }}
              </div>
            </div>
          </a-card>
        </a-collapse-item>
      </a-collapse>
    </a-card>
  </div>
</template>

<style scoped>
.download-page-container {
}

.version-card {
  margin-bottom: 10px;
}

.version-card-id {
  font-size: 1.3em;
}

.version-card-date-time {
  color: var(--color-text-4);
}

.version-card-date {
  margin-right: 10px;
  display: inline-block;
}

.version-card-time {
  display: inline-block;
}
</style>