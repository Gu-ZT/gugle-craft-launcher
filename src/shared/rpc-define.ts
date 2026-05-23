import {RPCSchema} from "electrobun";
import {Config} from "@shared/config";
import {VersionManifest} from "@shared/mojang";
import {
    ModSearchParams,
    ModSearchResponse,
    ModrinthProject,
    ModrinthVersion,
    ModTagsResponse,
} from "@shared/modrinth";

export interface AppRPCSchema extends RPCSchema {
    bun: {
        requests: {
            exit: {
                params: void;
                response: void;
            },
            minimize: {
                params: void;
                response: void;
            },
            getConfig: {
                params: void,
                response: Config;
            },
            setConfig: {
                params: Config,
                response: void,
            },
            getMemSize: {
                params: void,
                response: [number, number],
            },
            getVersionManifest: {
                params: void,
                response: VersionManifest
            },
            searchMods: {
                params: ModSearchParams,
                response: ModSearchResponse,
            },
            getModProject: {
                params: { slug: string },
                response: ModrinthProject,
            },
            getModVersions: {
                params: { slug: string },
                response: ModrinthVersion[],
            },
            downloadModFile: {
                params: { versionId: string; filename: string },
                response: { success: boolean; path?: string; error?: string },
            },
            getModTags: {
                params: void,
                response: ModTagsResponse,
            },
        },
        messages: {}
    },
    webview: {
        requests: {},
        messages: {}
    }
}