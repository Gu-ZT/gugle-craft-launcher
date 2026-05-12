import {RPCSchema} from "electrobun";
import {Config} from "@shared/config";
import {VersionManifest} from "@shared/mojang";

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
            }
        },
        messages: {}
    },
    webview: {
        requests: {},
        messages: {}
    }
}