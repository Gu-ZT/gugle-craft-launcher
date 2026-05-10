import {defineElectrobunRPC, Utils} from "electrobun";
import {AppRPCSchema} from "../shared/rpc-define";
import {mainWindow} from "./";

async function exit(params: { exit: boolean }) {
    if (!params.exit) return params;
    Utils.quit();
    return params;
}

async function minimize(params: { minimize: boolean }) {
    if (!params.minimize) return params;
    mainWindow.minimize();
    return params;
}

export default function defineRPC() {
    return defineElectrobunRPC<AppRPCSchema>("bun", {
        handlers: {
            requests: {
                exit,
                minimize
            },
            messages: {}
        }
    })
}
