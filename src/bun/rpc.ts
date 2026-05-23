import {defineElectrobunRPC, Utils} from "electrobun";
import {AppRPCSchema} from "@shared/rpc-define";
import {mainWindow} from "./index";
import {Config, DownloadSource} from "@shared/config";
import * as os from "node:os";
import {Mojang} from "./api/mojang";
import {Modrinth} from "./api/modrinth";
import {Curseforge, mirrorApiUrl, mirrorDownloadUrl} from "./api/curseforge";
import {VersionManifest} from "@shared/api/mojang";
import {
    ModSearchParams,
    ModSearchResponse,
    ModrinthProject,
    ModrinthVersion,
    ModTagsResponse,
} from "@shared/api/modrinth";
import {
    CurseSearchParams,
    CurseforgeSearchResponse,
    CurseforgeProject,
    CurseforgeFilesResponse,
} from "@shared/api/curseforge";

const mojang: Mojang = new Mojang();

const MODRINTH_OFFICIAL = "https://api.modrinth.com/v2";
const MODRINTH_MIRROR = "https://mod.mcimirror.top/modrinth/v2";
const CURSEFORGE_OFFICIAL = "https://api.curseforge.com/v1";
const CURSEFORGE_MIRROR = "https://mod.mcimirror.top/curseforge/v1";

/** 根据配置选择 API 源并创建 Modrinth 客户端 */
function getModrinthClient(config: Config): Modrinth {
    const source: DownloadSource = config.download_config.mod_source;
    const baseUrl = source === 'mirror' ? MODRINTH_MIRROR : MODRINTH_OFFICIAL;
    return new Modrinth(baseUrl);
}

/** 根据配置选择 API 源并创建 CurseForge 客户端 */
function getCurseforgeClient(config: Config): Curseforge {
    const source: DownloadSource = config.download_config.mod_source;
    const baseUrl = source === 'mirror' ? CURSEFORGE_MIRROR : CURSEFORGE_OFFICIAL;
    const apiKey = config.download_config.curseforge_api_key;
    // 官方源必须有 API Key，镜像源不需要
    if (source !== 'mirror' && !apiKey) {
        throw new Error(
            "CurseForge 官方 API 需要 API Key。请在设置中填写 curseforge_api_key，或切换到镜像源（mirror）"
        );
    }
    return new Curseforge(baseUrl, apiKey);
}

async function exit(): Promise<void> {
    Utils.quit();
}

async function minimize(): Promise<void> {
    mainWindow.minimize();
}

async function getConfig(): Promise<Config> {
    const cfg = Bun.file('config.json');
    if (!await cfg.exists()) {
        const config: Config = {
            download_config: {
                download_source: 'official_preference',
                version_source: 'official_preference',
                mod_source: 'official',
                mod_api_source: 'modrinth',
            },
            launch_config: {
                version_isolation: 'all',
                window_size: 'default',
                game_title: undefined,
                java_path: undefined
            },
            memory_config: 'auto'
        };
        await Bun.write('config.json', JSON.stringify(config));
        return config;
    }
    return await cfg.json() as Config;
}

async function setConfig(config: Config): Promise<void> {
    await Bun.write('config.json', JSON.stringify(config));
}

async function getMemSize(): Promise<[number, number]> {
    return [os.totalmem(), os.freemem()]
}

async function getVersionManifest(): Promise<VersionManifest> {
    return await mojang.getVersionManifest();
}

// ---- Modrinth handlers ----

async function searchMods(params: ModSearchParams): Promise<ModSearchResponse> {
    const config = await getConfig();
    return await getModrinthClient(config).search(params);
}

async function getModProject(params: { slug: string }): Promise<ModrinthProject> {
    const config = await getConfig();
    return await getModrinthClient(config).getProject(params.slug);
}

async function getModVersions(params: { slug: string }): Promise<ModrinthVersion[]> {
    const config = await getConfig();
    return await getModrinthClient(config).getVersions(params.slug);
}

async function downloadModFile(
    params: { versionId: string; filename: string },
): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const config = await getConfig();
        const client = getModrinthClient(config);
        const version = await client.getVersion(params.versionId);
        const file = version.files.find((f) => f.filename === params.filename) ?? version.files[0];
        if (!file) {
            return {success: false, error: "No file found in version"};
        }
        // 根据配置决定是否使用 MCIMirror 下载 CDN
        const downloadUrl = config.download_config.mod_source === 'mirror'
            ? mirrorDownloadUrl(file.url) : file.url;
        const path = await client.downloadFile(downloadUrl, file.filename);
        return {success: true, path};
    } catch (e: any) {
        return {success: false, error: e?.message ?? String(e)};
    }
}

async function getModTags(): Promise<ModTagsResponse> {
    const config = await getConfig();
    return await getModrinthClient(config).getTags();
}

// ---- CurseForge handlers ----

async function searchCurseMods(params: CurseSearchParams): Promise<CurseforgeSearchResponse> {
    const config = await getConfig();
    try {
        return await getCurseforgeClient(config).search(params);
    } catch (e: any) {
        throw new Error(e?.message ?? "CurseForge 搜索失败");
    }
}

async function getCurseProject(params: { projectId: number }): Promise<CurseforgeProject> {
    const config = await getConfig();
    try {
        return await getCurseforgeClient(config).getProject(params.projectId);
    } catch (e: any) {
        throw new Error(e?.message ?? "获取 CurseForge 项目信息失败");
    }
}

async function getCurseFiles(params: { projectId: number }): Promise<CurseforgeFilesResponse> {
    const config = await getConfig();
    try {
        return await getCurseforgeClient(config).getFiles(params.projectId);
    } catch (e: any) {
        throw new Error(e?.message ?? "获取 CurseForge 文件列表失败");
    }
}

async function downloadCurseFile(
    params: { downloadUrl: string; filename: string },
): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const config = await getConfig();
        // MCIMirror 下载 CDN 映射
        const downloadUrl = config.download_config.mod_source === 'mirror'
            ? mirrorDownloadUrl(params.downloadUrl) : params.downloadUrl;
        const client = getCurseforgeClient(config);
        const path = await client.downloadFile(downloadUrl, params.filename);
        return {success: true, path};
    } catch (e: any) {
        return {success: false, error: e?.message ?? String(e)};
    }
}

export default function defineRPC() {
    return defineElectrobunRPC<AppRPCSchema>("bun", {
        handlers: {
            requests: {
                exit,
                minimize,
                getConfig,
                setConfig,
                getMemSize,
                getVersionManifest,
                searchMods,
                getModProject,
                getModVersions,
                downloadModFile,
                getModTags,
                searchCurseMods,
                getCurseProject,
                getCurseFiles,
                downloadCurseFile,
            },
            messages: {}
        }
    })
}
