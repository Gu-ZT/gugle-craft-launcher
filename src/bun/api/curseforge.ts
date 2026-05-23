import {AxiosInstance, create} from "axios";
import type {
    CurseforgeSearchResponse,
    CurseforgeProject,
    CurseforgeFile,
    CurseforgeFilesResponse,
    CurseSearchParams,
} from "@shared/api/curseforge";
import {mkdirSync} from "node:fs";

export class Curseforge {
    private axios: AxiosInstance;

    constructor(baseUrl: string, apiKey?: string) {
        this.axios = create({
            baseURL: baseUrl,
            headers: apiKey ? {"x-api-key": apiKey} : {},
        });
    }

    /** 搜索项目 */
    async search(params: CurseSearchParams): Promise<CurseforgeSearchResponse> {
        const {data} = await this.axios.get("/mods/search", {
            params: {
                gameId: 432,
                searchFilter: params.query,
                pageSize: params.pageSize ?? 20,
                index: params.index ?? 0,
                classId: params.classId,
                sortField: params.sortField ?? 2,
                sortOrder: params.sortOrder ?? "desc",
                gameVersion: params.gameVersion,
                modLoaderType: params.modLoaderType,
            },
        });
        return data;
    }

    /** 获取项目详情 */
    async getProject(projectId: number): Promise<CurseforgeProject> {
        const {data} = await this.axios.get(`/mods/${projectId}`);
        return data.data;
    }

    /** 获取项目文件列表 */
    async getFiles(projectId: number): Promise<CurseforgeFilesResponse> {
        const {data} = await this.axios.get(`/mods/${projectId}/files`, {
            params: {pageSize: 10000},
        });
        return data;
    }

    /** 下载模组文件到 ./mods/ 目录 */
    async downloadFile(downloadUrl: string, filename: string): Promise<string> {
        const response = await this.axios.get(downloadUrl, {
            responseType: "arraybuffer",
            // 下载可能通过 CDN，不走 API base URL
            baseURL: "",
        });
        mkdirSync("./mods", {recursive: true});
        const outPath = `./mods/${filename}`;
        await Bun.write(outPath, new Uint8Array(response.data as ArrayBuffer));
        return outPath;
    }
}

/** MCIMirror URL 映射：API 端点 */
export function mirrorApiUrl(original: string): string {
    return original
        .replace("https://api.modrinth.com", "https://mod.mcimirror.top/modrinth")
        .replace("https://api.curseforge.com", "https://mod.mcimirror.top/curseforge");
}

/** MCIMirror URL 映射：文件下载 CDN */
export function mirrorDownloadUrl(original: string): string {
    return original
        .replace("https://cdn.modrinth.com", "https://mod.mcimirror.top")
        .replace("https://edge.forgecdn.net", "https://mod.mcimirror.top");
}
