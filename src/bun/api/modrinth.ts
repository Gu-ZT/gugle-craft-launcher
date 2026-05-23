import {AxiosInstance, create} from "axios";
import {
    ModrinthProject,
    ModrinthVersion,
    ModrinthTag,
    ModSearchParams,
    ModSearchResponse,
    ModTagsResponse
} from "@shared/api/modrinth";
import {mkdirSync} from "node:fs";

const USER_AGENT = "GugleCraftLauncher/0.0.1 (electrobun)";
const TIMEOUT = 30_000;

export class Modrinth {
    private axios: AxiosInstance;

    constructor(baseUrl: string) {
        this.axios = create({
            baseURL: baseUrl,
            timeout: TIMEOUT,
            headers: {"User-Agent": USER_AGENT},
        });
    }

    /** 搜索模组 */
    async search(params: ModSearchParams): Promise<ModSearchResponse> {
        return (await this.axios.get("/search", {params})).data;
    }

    /** 获取项目详情 */
    async getProject(slug: string): Promise<ModrinthProject> {
        return (await this.axios.get(`/project/${slug}`)).data;
    }

    /** 获取项目的所有版本 */
    async getVersions(slug: string): Promise<ModrinthVersion[]> {
        return (await this.axios.get(`/project/${slug}/version`)).data;
    }

    /** 获取单个版本信息 */
    async getVersion(id: string): Promise<ModrinthVersion> {
        return (await this.axios.get(`/version/${id}`)).data;
    }

    /** 下载模组文件到 ./mods/ 目录 */
    async downloadFile(url: string, filename: string): Promise<string> {
        const response = await this.axios.get(url, {
            responseType: "arraybuffer",
            timeout: 120_000, // 下载超时 2 分钟
        });
        mkdirSync("./mods", {recursive: true});
        const outPath = `./mods/${filename}`;
        await Bun.write(outPath, new Uint8Array(response.data as ArrayBuffer));
        return outPath;
    }

    /** 获取所有标签（loader / game_version / category） */
    async getTags(): Promise<ModTagsResponse> {
        const [loaders, gameVersions, categories] = await Promise.all([
            (await this.axios.get<ModrinthTag[]>("/tag/loader")).data,
            (await this.axios.get<ModrinthTag[]>("/tag/game_version")).data,
            (await this.axios.get<ModrinthTag[]>("/tag/category")).data,
        ]);
        return {loaders, gameVersions, categories};
    }
}
