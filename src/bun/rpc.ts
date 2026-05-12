import {defineElectrobunRPC, Utils} from "electrobun";
import {AppRPCSchema} from "@shared/rpc-define";
import {mainWindow} from "./index";
import {Config} from "@shared/config";
import * as os from "node:os";
import {Mojang} from "./mojang";
import {VersionManifest} from "@shared/mojang";

const mojang: Mojang = new Mojang();

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
                version_source: 'official_preference'
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

export default function defineRPC() {
    return defineElectrobunRPC<AppRPCSchema>("bun", {
        handlers: {
            requests: {
                exit,
                minimize,
                getConfig,
                setConfig,
                getMemSize,
                getVersionManifest
            },
            messages: {}
        }
    })
}
