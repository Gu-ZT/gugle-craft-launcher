<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {VersionManifestVersion} from "@shared/mojang";
import {
    ModSearchParams,
    ModSearchResponse,
    ModrinthProject,
    ModrinthVersion,
    ModTagsResponse,
} from "@shared/modrinth";
import {rpc} from "@renderer/scripts/rpc";
import {Message} from "@arco-design/web-vue";

// ---- 游戏版本列表 ----
const versions = ref<VersionManifestVersion[]>([]);
const snapshot = ref<VersionManifestVersion[]>([]);

onMounted(async () => {
    const version_list = (await rpc.request.getVersionManifest()).versions;

    const releases: VersionManifestVersion[] = [];
    const snapshots: VersionManifestVersion[] = [];
    for (let version of version_list) {
        if (version.type === 'release') {
            releases.push(version);
        } else {
            snapshots.push(version);
        }
    }

    versions.value = releases;
    snapshot.value = snapshots;
});

// ---- 标签切换 ----
const activeTab = ref<string>('game');

function handleTabClick(key: string) {
    activeTab.value = key;
    if (key === 'mod' && !tags.value) {
        loadTags();
    }
}

// ---- 模组浏览器 ----
type ViewState = 'browse' | 'detail' | 'versions';

const viewState = ref<ViewState>('browse');
const searchQuery = ref<string>('');
const searchResults = ref<ModSearchResponse | null>(null);
const selectedProject = ref<ModrinthProject | null>(null);
const projectVersions = ref<ModrinthVersion[]>([]);
const tags = ref<ModTagsResponse | null>(null);
const loading = ref<boolean>(false);
const selectedLoader = ref<string>('');
const selectedGameVersion = ref<string>('');
const sortIndex = ref<string>('relevance');
const currentPage = ref<number>(1);
const pageSize = 20;

let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** 加载标签（仅首次进入模组标签时） */
async function loadTags() {
    try {
        tags.value = await rpc.request.getModTags();
    } catch {
        // 标签加载失败不影响搜索功能
    }
}

/** 构建搜索 facet */
function buildFacets(): string[][] {
    const facets: string[][] = [["project_type:mod"]];
    if (selectedLoader.value) {
        facets.push([`categories:${selectedLoader.value}`]);
    }
    if (selectedGameVersion.value) {
        facets.push([`versions:${selectedGameVersion.value}`]);
    }
    return facets;
}

/** 执行搜索 */
async function doSearch() {
    if (!searchQuery.value.trim()) return;
    loading.value = true;
    viewState.value = 'browse';
    currentPage.value = 1;
    try {
        searchResults.value = await rpc.request.searchMods({
            query: searchQuery.value,
            facets: buildFacets(),
            offset: 0,
            limit: pageSize,
            index: sortIndex.value as ModSearchParams['index'],
        });
    } catch (e: any) {
        Message.error(e?.message ?? "搜索失败");
    } finally {
        loading.value = false;
    }
}

/** 搜索输入防抖 */
function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(), 400);
}

/** 翻页 */
async function goPage(page: number) {
    currentPage.value = page;
    loading.value = true;
    try {
        searchResults.value = await rpc.request.searchMods({
            query: searchQuery.value,
            facets: buildFacets(),
            offset: (page - 1) * pageSize,
            limit: pageSize,
            index: sortIndex.value as ModSearchParams['index'],
        });
    } catch (e: any) {
        Message.error(e?.message ?? "搜索失败");
    } finally {
        loading.value = false;
    }
}

/** 过滤器变化时重新搜索 */
watch([selectedLoader, selectedGameVersion, sortIndex], () => {
    if (searchResults.value) doSearch();
});

/** 打开模组详情 */
async function openProject(slug: string) {
    loading.value = true;
    try {
        selectedProject.value = await rpc.request.getModProject({slug});
        viewState.value = 'detail';
    } catch (e: any) {
        Message.error(e?.message ?? "获取模组信息失败");
    } finally {
        loading.value = false;
    }
}

/** 查看版本列表 */
async function loadVersions() {
    if (!selectedProject.value) return;
    loading.value = true;
    try {
        projectVersions.value = await rpc.request.getModVersions({
            slug: selectedProject.value.slug,
        });
        viewState.value = 'versions';
    } catch (e: any) {
        Message.error(e?.message ?? "获取版本列表失败");
    } finally {
        loading.value = false;
    }
}

/** 下载模组文件 */
async function downloadFile(version: ModrinthVersion) {
    const primary = version.files.find((f) => f.primary) ?? version.files[0];
    if (!primary) return;
    Message.loading("开始下载...");
    try {
        const result = await rpc.request.downloadModFile({
            versionId: version.id,
            filename: primary.filename,
        });
        if (result.success) {
            Message.success(`下载完成: ${primary.filename}`);
        } else {
            Message.error(result.error ?? "下载失败");
        }
    } catch (e: any) {
        Message.error(e?.message ?? "下载失败");
    }
}

/** 返回浏览 */
function backToBrowse() {
    viewState.value = 'browse';
}

/** 返回详情 */
function backToDetail() {
    viewState.value = 'detail';
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 格式化数字 */
function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

/** URL 安全处理（Modrinth CDN 可能返回相对路径） */
function iconUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://cdn.modrinth.com${url}`;
}
</script>

<template>
    <div class="download-page-container">
        <a-menu mode="horizontal" :defaultSelectedKeys="['game']" @menu-item-click="handleTabClick">
            <a-menu-item key="game">游戏</a-menu-item>
            <a-menu-item key="mod">模组</a-menu-item>
            <a-menu-item key="data_pack">数据包</a-menu-item>
            <a-menu-item key="resource_pack">资源包</a-menu-item>
            <a-menu-item key="mod_pack">整合包</a-menu-item>
        </a-menu>

        <!-- 游戏版本列表 -->
        <a-card v-if="activeTab === 'game'">
            <a-collapse :default-active-key="['1']" accordion>
                <a-collapse-item header="正式版" key="release">
                    <a-card v-for="version in versions" :key="version.id" class="version-card">
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
                    <a-card v-for="version in snapshot" :key="version.id" class="version-card">
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

        <!-- 模组浏览器 -->
        <a-card v-if="activeTab === 'mod'">
            <a-spin :loading="loading">

                <!-- 浏览态：搜索 + 结果列表 -->
                <template v-if="viewState === 'browse'">
                    <div class="mod-toolbar">
                        <a-input-search
                            v-model="searchQuery"
                            placeholder="搜索模组..."
                            :button-text="'搜索'"
                            style="width: 320px"
                            @search="doSearch"
                            @input="onSearchInput"
                        />
                        <a-select
                            v-if="tags"
                            v-model="selectedLoader"
                            placeholder="加载器"
                            allow-clear
                            style="width: 140px"
                        >
                            <a-option
                                v-for="t in tags.loaders.filter(l => l.applicable_to.includes('projects'))"
                                :key="t.name"
                                :value="t.name"
                            >{{ t.name }}</a-option>
                        </a-select>
                        <a-select
                            v-if="tags"
                            v-model="selectedGameVersion"
                            placeholder="游戏版本"
                            allow-clear
                            style="width: 140px"
                        >
                            <a-option
                                v-for="t in tags.gameVersions"
                                :key="t.name"
                                :value="t.name"
                            >{{ t.name }}</a-option>
                        </a-select>
                        <a-select
                            v-model="sortIndex"
                            style="width: 120px"
                        >
                            <a-option value="relevance">相关度</a-option>
                            <a-option value="downloads">下载量</a-option>
                            <a-option value="follows">关注数</a-option>
                            <a-option value="newest">最新发布</a-option>
                            <a-option value="updated">最近更新</a-option>
                        </a-select>
                    </div>

                    <template v-if="searchResults">
                        <div class="mod-results">
                            <a-card
                                v-for="hit in searchResults.hits"
                                :key="hit.project_id"
                                class="mod-hit-card"
                                hoverable
                                @click="openProject(hit.slug)"
                            >
                                <div class="mod-hit-content">
                                    <div class="mod-hit-icon">
                                        <img
                                            v-if="hit.icon_url"
                                            :src="iconUrl(hit.icon_url)"
                                            :alt="hit.title"
                                        />
                                        <div v-else class="mod-hit-icon-empty"></div>
                                    </div>
                                    <div class="mod-hit-info">
                                        <div class="mod-hit-title">{{ hit.title }}</div>
                                        <div class="mod-hit-desc">{{ hit.description }}</div>
                                        <div class="mod-hit-meta">
                                            <a-tag
                                                v-for="cat in hit.display_categories"
                                                :key="cat"
                                                size="small"
                                            >{{ cat }}</a-tag>
                                            <span class="mod-hit-downloads">
                                                {{ formatNumber(hit.downloads) }} 次下载
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </a-card>
                        </div>

                        <a-pagination
                            v-if="searchResults.total_hits > pageSize"
                            :total="searchResults.total_hits"
                            :page-size="pageSize"
                            :current="currentPage"
                            show-total
                            @change="goPage"
                            class="mod-pagination"
                        />

                        <a-empty v-if="searchResults.hits.length === 0" description="没有找到模组" />
                    </template>
                    <a-empty v-else description="搜索模组以开始" />
                </template>

                <!-- 详情态 -->
                <template v-if="viewState === 'detail' && selectedProject">
                    <div class="mod-detail">
                        <a-button type="text" @click="backToBrowse" class="mod-back-btn">
                            &larr; 返回搜索结果
                        </a-button>
                        <div class="mod-detail-header">
                            <div class="mod-detail-icon">
                                <img
                                    v-if="selectedProject.icon_url"
                                    :src="iconUrl(selectedProject.icon_url)"
                                    :alt="selectedProject.title"
                                />
                                <div v-else class="mod-hit-icon-empty large"></div>
                            </div>
                            <div class="mod-detail-title">
                                <h2>{{ selectedProject.title }}</h2>
                                <div class="mod-detail-author">{{ selectedProject.description }}</div>
                            </div>
                        </div>
                        <div class="mod-detail-stats">
                            <span>{{ formatNumber(selectedProject.downloads) }} 次下载</span>
                            <span>{{ formatNumber(selectedProject.followers) }} 个关注</span>
                            <span>许可: {{ selectedProject.license.name }}</span>
                        </div>
                        <div class="mod-detail-body" v-html="selectedProject.body" />
                        <a-button type="primary" @click="loadVersions" style="margin-top: 16px">
                            查看版本 ({{ selectedProject.versions.length }})
                        </a-button>
                    </div>
                </template>

                <!-- 版本态 -->
                <template v-if="viewState === 'versions'">
                    <div class="mod-versions">
                        <a-button type="text" @click="backToDetail" class="mod-back-btn">
                            &larr; 返回模组详情
                        </a-button>
                        <h3 v-if="selectedProject">版本列表 — {{ selectedProject.title }}</h3>
                        <a-card
                            v-for="ver in projectVersions"
                            :key="ver.id"
                            class="version-item"
                        >
                            <div class="version-item-header">
                                <div>
                                    <div class="version-item-name">
                                        {{ ver.name }}
                                        <a-tag size="small" color="arcoblue">{{ ver.version_number }}</a-tag>
                                        <a-tag
                                            v-if="ver.version_type === 'release'"
                                            size="small"
                                            color="green"
                                        >Release</a-tag>
                                        <a-tag
                                            v-else-if="ver.version_type === 'beta'"
                                            size="small"
                                            color="orange"
                                        >Beta</a-tag>
                                        <a-tag v-else size="small">{{ ver.version_type }}</a-tag>
                                    </div>
                                    <div class="version-item-meta">
                                        <span>{{ ver.loaders.join(', ') }}</span>
                                        <span>{{ ver.game_versions.join(', ') }}</span>
                                        <span>{{ formatNumber(ver.downloads) }} 次下载</span>
                                        <span>{{ new Date(Date.parse(ver.date_published)).toLocaleDateString() }}</span>
                                    </div>
                                </div>
                                <a-button type="primary" size="small" @click="downloadFile(ver)">
                                    下载
                                </a-button>
                            </div>
                            <div class="version-item-files">
                                <div
                                    v-for="f in ver.files"
                                    :key="f.hashes.sha512"
                                    class="version-item-file"
                                >
                                    {{ f.filename }} ({{ formatFileSize(f.size) }})
                                </div>
                            </div>
                        </a-card>
                        <a-empty v-if="projectVersions.length === 0" description="没有版本" />
                    </div>
                </template>

            </a-spin>
        </a-card>
    </div>
</template>

<style scoped>
.download-page-container {
}

/* ---- 游戏版本 ---- */
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

/* ---- 模组工具栏 ---- */
.mod-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

/* ---- 搜索结果 ---- */
.mod-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mod-hit-card {
    cursor: pointer;
}

.mod-hit-content {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.mod-hit-icon img {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
}

.mod-hit-icon-empty {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    background: var(--color-fill-3);
}

.mod-hit-icon-empty.large {
    width: 80px;
    height: 80px;
}

.mod-hit-info {
    flex: 1;
    min-width: 0;
}

.mod-hit-title {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 4px;
}

.mod-hit-desc {
    color: var(--color-text-3);
    font-size: 0.9em;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mod-hit-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.mod-hit-downloads {
    color: var(--color-text-4);
    font-size: 0.85em;
    margin-left: auto;
}

/* ---- 分页 ---- */
.mod-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

/* ---- 详情 ---- */
.mod-detail {
}

.mod-back-btn {
    padding-left: 0;
    margin-bottom: 12px;
}

.mod-detail-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
}

.mod-detail-icon img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
}

.mod-detail-title h2 {
    margin: 0 0 6px 0;
}

.mod-detail-author {
    color: var(--color-text-3);
}

.mod-detail-stats {
    display: flex;
    gap: 24px;
    color: var(--color-text-4);
    font-size: 0.9em;
    margin-bottom: 16px;
}

.mod-detail-body {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 6px;
    font-size: 0.9em;
    line-height: 1.6;
}

/* ---- 版本列表 ---- */
.mod-versions {
}

.version-item {
    margin-bottom: 8px;
}

.version-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.version-item-name {
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.version-item-meta {
    display: flex;
    gap: 16px;
    color: var(--color-text-4);
    font-size: 0.85em;
    flex-wrap: wrap;
}

.version-item-files {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-2);
}

.version-item-file {
    font-size: 0.85em;
    color: var(--color-text-4);
}
</style>
