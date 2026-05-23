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
import {
    CurseSearchParams,
    CurseforgeSearchResponse,
    CurseforgeProject,
    CurseforgeFile,
    CurseforgeFilesResponse,
} from "@shared/curseforge";
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
type ApiSource = 'modrinth' | 'curseforge';

const apiSource = ref<ApiSource>('modrinth');
const viewState = ref<ViewState>('browse');
const searchQuery = ref<string>('');
const modSearchResults = ref<ModSearchResponse | null>(null);
const curseSearchResults = ref<CurseforgeSearchResponse | null>(null);
const modProject = ref<ModrinthProject | null>(null);
const curseProject = ref<CurseforgeProject | null>(null);
const modVersions = ref<ModrinthVersion[]>([]);
const curseFiles = ref<CurseforgeFile[]>([]);
const tags = ref<ModTagsResponse | null>(null);
const loading = ref<boolean>(false);
const selectedLoader = ref<string>('');
const selectedGameVersion = ref<string>('');
const sortIndex = ref<string>('relevance');
const currentPage = ref<number>(1);
const pageSize = 20;

let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** 当前是否使用 CurseForge 源 */
const isCurse = () => apiSource.value === 'curseforge';

/** 当前搜索总命中数 */
const totalHits = () => {
    if (isCurse()) return curseSearchResults.value?.pagination.totalCount ?? 0;
    return modSearchResults.value?.total_hits ?? 0;
};

/** 搜索结果的条目列表用于模板渲染 */
interface SearchHitItem {
    id: string | number;
    slugOrId: string | number;
    title: string;
    description: string;
    iconUrl: string;
    categories: string[];
    downloads: number;
}
const currentHits = (): SearchHitItem[] => {
    if (isCurse()) {
        return (curseSearchResults.value?.data ?? []).map(p => ({
            id: p.id,
            slugOrId: p.id,
            title: p.name,
            description: p.summary,
            iconUrl: p.logo?.thumbnailUrl ?? '',
            categories: p.categories?.map(c => c.name) ?? [],
            downloads: p.downloadCount,
        }));
    }
    return (modSearchResults.value?.hits ?? []).map(h => ({
        id: h.project_id,
        slugOrId: h.slug,
        title: h.title,
        description: h.description,
        iconUrl: h.icon_url ? iconUrl(h.icon_url) : '',
        categories: h.display_categories ?? [],
        downloads: h.downloads,
    }));
};

/** 当前选中项目的详情数据 */
const projectInfo = () => {
    if (isCurse() && curseProject.value) {
        const p = curseProject.value;
        return {
            title: p.name,
            description: p.summary,
            body: '', // CurseForge doesn't return body from search/project endpoint
            iconUrl: p.logo?.thumbnailUrl ?? '',
            downloads: p.downloadCount,
            followers: 0,
            license: '',
            versionCount: p.latestFiles?.length ?? 0,
        };
    }
    if (modProject.value) {
        const p = modProject.value;
        return {
            title: p.title,
            description: p.description,
            body: p.body,
            iconUrl: p.icon_url ? iconUrl(p.icon_url) : '',
            downloads: p.downloads,
            followers: p.followers,
            license: p.license?.name ?? '',
            versionCount: p.versions?.length ?? 0,
        };
    }
    return null;
};

/** 加载标签（仅首次进入模组标签时） */
async function loadTags() {
    try {
        tags.value = await rpc.request.getModTags();
    } catch {
        // 标签加载失败不影响搜索功能
    }
}

/** 构建搜索 facet（仅 Modrinth） */
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
        if (isCurse()) {
            const params: CurseSearchParams = {
                query: searchQuery.value,
                pageSize,
                index: (currentPage.value - 1) * pageSize,
                sortOrder: 'desc',
                gameVersion: selectedGameVersion.value || undefined,
                modLoaderType: selectedLoader.value ? loaderToCurseforgeType(selectedLoader.value) : undefined,
            };
            curseSearchResults.value = await rpc.request.searchCurseMods(params);
            modSearchResults.value = null;
        } else {
            modSearchResults.value = await rpc.request.searchMods({
                query: searchQuery.value,
                facets: buildFacets(),
                offset: 0,
                limit: pageSize,
                index: sortIndex.value as ModSearchParams['index'],
            });
            curseSearchResults.value = null;
        }
    } catch (e: any) {
        Message.error(e?.message ?? "搜索失败");
    } finally {
        loading.value = false;
    }
}

/** CurseForge 加载器名称 → modLoaderType 映射 */
function loaderToCurseforgeType(loader: string): number | undefined {
    const map: Record<string, number> = {
        forge: 1, neoforge: 1,
        fabric: 4, quilt: 5,
    };
    return map[loader.toLowerCase()];
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
        if (isCurse()) {
            curseSearchResults.value = await rpc.request.searchCurseMods({
                query: searchQuery.value,
                pageSize,
                index: (page - 1) * pageSize,
                sortOrder: 'desc',
                gameVersion: selectedGameVersion.value || undefined,
            });
        } else {
            modSearchResults.value = await rpc.request.searchMods({
                query: searchQuery.value,
                facets: buildFacets(),
                offset: (page - 1) * pageSize,
                limit: pageSize,
                index: sortIndex.value as ModSearchParams['index'],
            });
        }
    } catch (e: any) {
        Message.error(e?.message ?? "搜索失败");
    } finally {
        loading.value = false;
    }
}

/** 过滤器/API源变化时重新搜索 */
watch([selectedLoader, selectedGameVersion, sortIndex, apiSource], () => {
    if (modSearchResults.value || curseSearchResults.value) doSearch();
});

/** 打开模组详情 */
async function openProject(slugOrId: string | number) {
    loading.value = true;
    try {
        if (isCurse()) {
            curseProject.value = await rpc.request.getCurseProject({projectId: slugOrId as number});
            modProject.value = null;
        } else {
            modProject.value = await rpc.request.getModProject({slug: slugOrId as string});
            curseProject.value = null;
        }
        viewState.value = 'detail';
    } catch (e: any) {
        Message.error(e?.message ?? "获取模组信息失败");
    } finally {
        loading.value = false;
    }
}

/** 查看版本/文件列表 */
async function loadVersions() {
    loading.value = true;
    try {
        if (isCurse() && curseProject.value) {
            const resp: CurseforgeFilesResponse = await rpc.request.getCurseFiles({
                projectId: curseProject.value.id,
            });
            curseFiles.value = resp.data;
            modVersions.value = [];
        } else if (modProject.value) {
            modVersions.value = await rpc.request.getModVersions({
                slug: modProject.value.slug,
            });
            curseFiles.value = [];
        }
        viewState.value = 'versions';
    } catch (e: any) {
        Message.error(e?.message ?? "获取版本列表失败");
    } finally {
        loading.value = false;
    }
}

/** 下载 Modrinth 模组文件 */
async function downloadModFile(version: ModrinthVersion) {
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

/** 下载 CurseForge 文件 */
async function downloadCurseFile(file: CurseforgeFile) {
    if (!file.downloadUrl) return;
    Message.loading("开始下载...");
    try {
        const result = await rpc.request.downloadCurseFile({
            downloadUrl: file.downloadUrl,
            filename: file.fileName,
        });
        if (result.success) {
            Message.success(`下载完成: ${file.fileName}`);
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
                        <div class="version-card-id">{{ version.id }}</div>
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
                        <div class="version-card-id">{{ version.id }}</div>
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
                            style="width: 280px"
                            @search="doSearch"
                            @input="onSearchInput"
                        />
                        <a-select v-model="apiSource" style="width: 120px">
                            <a-option value="modrinth">Modrinth</a-option>
                            <a-option value="curseforge">CurseForge</a-option>
                        </a-select>
                        <a-select
                            v-if="tags && !isCurse()"
                            v-model="selectedLoader"
                            placeholder="加载器"
                            allow-clear
                            style="width: 140px"
                        >
                            <a-option
                                v-for="t in tags.loaders.filter(l => l.applicable_to.includes('projects'))"
                                :key="t.name" :value="t.name"
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
                                :key="t.name" :value="t.name"
                            >{{ t.name }}</a-option>
                        </a-select>
                        <a-select v-if="!isCurse()" v-model="sortIndex" style="width: 120px">
                            <a-option value="relevance">相关度</a-option>
                            <a-option value="downloads">下载量</a-option>
                            <a-option value="follows">关注数</a-option>
                            <a-option value="newest">最新发布</a-option>
                            <a-option value="updated">最近更新</a-option>
                        </a-select>
                    </div>

                    <template v-if="currentHits().length">
                        <div class="mod-results">
                            <a-card
                                v-for="hit in currentHits()"
                                :key="hit.id"
                                class="mod-hit-card"
                                hoverable
                                @click="openProject(hit.slugOrId)"
                            >
                                <div class="mod-hit-content">
                                    <div class="mod-hit-icon">
                                        <img v-if="hit.iconUrl" :src="hit.iconUrl" :alt="hit.title" />
                                        <div v-else class="mod-hit-icon-empty"></div>
                                    </div>
                                    <div class="mod-hit-info">
                                        <div class="mod-hit-title">{{ hit.title }}</div>
                                        <div class="mod-hit-desc">{{ hit.description }}</div>
                                        <div class="mod-hit-meta">
                                            <a-tag v-for="cat in hit.categories" :key="cat" size="small">{{ cat }}</a-tag>
                                            <span class="mod-hit-downloads">{{ formatNumber(hit.downloads) }} 次下载</span>
                                        </div>
                                    </div>
                                </div>
                            </a-card>
                        </div>

                        <a-pagination
                            v-if="totalHits() > pageSize"
                            :total="totalHits()"
                            :page-size="pageSize"
                            :current="currentPage"
                            show-total
                            @change="goPage"
                            class="mod-pagination"
                        />

                        <a-empty v-if="currentHits().length === 0" description="没有找到模组" />
                    </template>
                    <a-empty v-else description="搜索模组以开始" />
                </template>

                <!-- 详情态 -->
                <template v-if="viewState === 'detail' && projectInfo()">
                    <div class="mod-detail">
                        <a-button type="text" @click="backToBrowse" class="mod-back-btn">
                            &larr; 返回搜索结果
                        </a-button>
                        <div class="mod-detail-header">
                            <div class="mod-detail-icon">
                                <img v-if="projectInfo()!.iconUrl" :src="projectInfo()!.iconUrl" :alt="projectInfo()!.title" />
                                <div v-else class="mod-hit-icon-empty large"></div>
                            </div>
                            <div class="mod-detail-title">
                                <h2>{{ projectInfo()!.title }}</h2>
                                <div class="mod-detail-author">{{ projectInfo()!.description }}</div>
                            </div>
                        </div>
                        <div class="mod-detail-stats">
                            <span>{{ formatNumber(projectInfo()!.downloads) }} 次下载</span>
                            <span v-if="projectInfo()!.followers > 0">{{ formatNumber(projectInfo()!.followers) }} 个关注</span>
                            <span v-if="projectInfo()!.license">许可: {{ projectInfo()!.license }}</span>
                        </div>
                        <div v-if="projectInfo()!.body" class="mod-detail-body" v-html="projectInfo()!.body" />
                        <a-button type="primary" @click="loadVersions" style="margin-top: 16px">
                            查看文件 ({{ projectInfo()!.versionCount }})
                        </a-button>
                    </div>
                </template>

                <!-- 版本态：Modrinth -->
                <template v-if="viewState === 'versions' && !isCurse()">
                    <div class="mod-versions">
                        <a-button type="text" @click="backToDetail" class="mod-back-btn">
                            &larr; 返回模组详情
                        </a-button>
                        <h3 v-if="modProject">版本列表 — {{ modProject.title }}</h3>
                        <a-card v-for="ver in modVersions" :key="ver.id" class="version-item">
                            <div class="version-item-header">
                                <div>
                                    <div class="version-item-name">
                                        {{ ver.name }}
                                        <a-tag size="small" color="arcoblue">{{ ver.version_number }}</a-tag>
                                        <a-tag v-if="ver.version_type === 'release'" size="small" color="green">Release</a-tag>
                                        <a-tag v-else-if="ver.version_type === 'beta'" size="small" color="orange">Beta</a-tag>
                                        <a-tag v-else size="small">{{ ver.version_type }}</a-tag>
                                    </div>
                                    <div class="version-item-meta">
                                        <span>{{ ver.loaders.join(', ') }}</span>
                                        <span>{{ ver.game_versions.join(', ') }}</span>
                                        <span>{{ formatNumber(ver.downloads) }} 次下载</span>
                                        <span>{{ new Date(Date.parse(ver.date_published)).toLocaleDateString() }}</span>
                                    </div>
                                </div>
                                <a-button type="primary" size="small" @click="downloadModFile(ver)">下载</a-button>
                            </div>
                            <div class="version-item-files">
                                <div v-for="f in ver.files" :key="f.hashes.sha512" class="version-item-file">
                                    {{ f.filename }} ({{ formatFileSize(f.size) }})
                                </div>
                            </div>
                        </a-card>
                        <a-empty v-if="modVersions.length === 0" description="没有版本" />
                    </div>
                </template>

                <!-- 版本态：CurseForge -->
                <template v-if="viewState === 'versions' && isCurse()">
                    <div class="mod-versions">
                        <a-button type="text" @click="backToDetail" class="mod-back-btn">
                            &larr; 返回模组详情
                        </a-button>
                        <h3 v-if="curseProject">文件列表 — {{ curseProject.name }}</h3>
                        <a-card v-for="f in curseFiles" :key="f.id" class="version-item">
                            <div class="version-item-header">
                                <div>
                                    <div class="version-item-name">
                                        {{ f.displayName }}
                                        <a-tag size="small" color="arcoblue">{{ f.fileName }}</a-tag>
                                        <a-tag v-if="f.releaseType === 1" size="small" color="green">Release</a-tag>
                                        <a-tag v-else-if="f.releaseType === 2" size="small" color="orange">Beta</a-tag>
                                        <a-tag v-else-if="f.releaseType === 3" size="small" color="purple">Alpha</a-tag>
                                    </div>
                                    <div class="version-item-meta">
                                        <span>{{ f.gameVersions?.join(', ') }}</span>
                                        <span>{{ formatFileSize(f.fileLength) }}</span>
                                    </div>
                                </div>
                                <a-button type="primary" size="small" @click="downloadCurseFile(f)" :disabled="!f.isAvailable">下载</a-button>
                            </div>
                        </a-card>
                        <a-empty v-if="curseFiles.length === 0" description="没有文件" />
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
