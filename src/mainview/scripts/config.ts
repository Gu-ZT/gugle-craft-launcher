import {Config} from "@shared/config";
import {rpc} from "@renderer/scripts/rpc";
import {Ref, ref, watch} from "vue";

let loading: boolean = true;

export const config: Ref<Config | undefined> = ref();

getConfig().then((cfg: Config) => {
    config.value = cfg;
    loading = false;
})

async function getConfig(): Promise<Config> {
    return await rpc.request.getConfig();
}

async function setConfig(config: Config): Promise<void> {
    await rpc.request.setConfig(config);
}

watch(config, async (_, config) => {
    if (config && !loading) {
        await setConfig(config);
    }
})
