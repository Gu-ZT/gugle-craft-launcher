import {RPCSchema} from "electrobun";

export interface AppRPCSchema extends RPCSchema {
    bun: {
        requests: {
            exit: {
                params: { exit: boolean };
                response: { exit: boolean };
            },
            minimize: {
                params: { minimize: boolean };
                response: { minimize: boolean };
            }
        },
        messages: {}
    },
    webview: {
        requests: {},
        messages: {}
    }
}