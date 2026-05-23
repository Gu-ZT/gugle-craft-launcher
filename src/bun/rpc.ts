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

/** Modrinth API 调用，根据 source 决定使用官方/镜像/优先官方回退 */
async function withModrinth<T>(
    config: Config,
    fn: (client: Modrinth) => Promise<T>,
): Promise<T> {
    const source: DownloadSource = config.download_config.mod_source;

    if (source === 'official_preference') {
        try {
            return await fn(new Modrinth(MODRINTH_OFFICIAL));
        } catch (e1: any) {
            console.log("[Modrinth] 官方源失败，回退到镜像源:", e1?.message);
            return await fn(new Modrinth(MODRINTH_MIRROR));
        }
    }

    const baseUrl = source === 'mirror' ? MODRINTH_MIRROR : MODRINTH_OFFICIAL;
    return await fn(new Modrinth(baseUrl));
}

/** CurseForge API 调用，根据 source 决定使用官方/镜像/优先官方回退 */
async function withCurseforge<T>(
    config: Config,
    fn: (client: Curseforge) => Promise<T>,
): Promise<T> {
    const source: DownloadSource = config.download_config.mod_source;
    const apiKey = config.download_config.curseforge_api_key;

    if (source === 'official_preference') {
        // 有 API Key 时先试官方
        if (apiKey) {
            try {
                return await fn(new Curseforge(CURSEFORGE_OFFICIAL, apiKey));
            } catch (e1: any) {
                console.log("[CurseForge] 官方源失败，回退到镜像源:", e1?.message);
                return await fn(new Curseforge(CURSEFORGE_MIRROR));
            }
        }
        // 无 API Key 直接走镜像
        return await fn(new Curseforge(CURSEFORGE_MIRROR));
    }

    if (source === 'mirror') {
        return await fn(new Curseforge(CURSEFORGE_MIRROR));
    }

    // official
    if (!apiKey) {
        throw new Error(
            "CurseForge 官方 API 需要 API Key。请在设置中填写 curseforge_api_key，或切换到镜像源（mirror）"
        );
    }
    return await fn(new Curseforge(CURSEFORGE_OFFICIAL, apiKey));
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
    return await withModrinth(config, c => c.search(params));
}

async function getModProject(params: { slug: string }): Promise<ModrinthProject> {
    const config = await getConfig();
    return await withModrinth(config, c => c.getProject(params.slug));
}

async function getModVersions(params: { slug: string }): Promise<ModrinthVersion[]> {
    const config = await getConfig();
    return await withModrinth(config, c => c.getVersions(params.slug));
}

async function downloadModFile(
    params: { versionId: string; filename: string },
): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const config = await getConfig();
        const result = await withModrinth(config, async (client) => {
            const version = await client.getVersion(params.versionId);
            const file = version.files.find((f) => f.filename === params.filename) ?? version.files[0];
            if (!file) throw new Error("No file found in version");
            const downloadUrl = config.download_config.mod_source === 'mirror'
                ? mirrorDownloadUrl(file.url) : file.url;
            return await client.downloadFile(downloadUrl, file.filename);
        });
        return {success: true, path: result};
    } catch (e: any) {
        return {success: false, error: e?.message ?? String(e)};
    }
}

async function getModTags(): Promise<ModTagsResponse> {
    const config = await getConfig();
    return await withModrinth(config, c => c.getTags());
}

// ---- CurseForge handlers ----

async function searchCurseMods(params: CurseSearchParams): Promise<CurseforgeSearchResponse> {
    const config = await getConfig();
    return await withCurseforge(config, c => c.search(params));
}

async function getCurseProject(params: { projectId: number }): Promise<CurseforgeProject> {
    const config = await getConfig();
    return await withCurseforge(config, c => c.getProject(params.projectId));
}

async function getCurseFiles(params: { projectId: number }): Promise<CurseforgeFilesResponse> {
    const config = await getConfig();
    return await withCurseforge(config, c => c.getFiles(params.projectId));
}

async function downloadCurseFile(
    params: { downloadUrl: string; filename: string },
): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const config = await getConfig();
        const result = await withCurseforge(config, async (client) => {
            const downloadUrl = config.download_config.mod_source === 'mirror'
                ? mirrorDownloadUrl(params.downloadUrl) : params.downloadUrl;
            return await client.downloadFile(downloadUrl, params.filename);
        });
        return {success: true, path: result};
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
