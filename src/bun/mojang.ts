import {AxiosInstance, create} from "axios";
import {VersionManifest} from "@shared/mojang";

export class Mojang {
    private static readonly base_url: string = "https://launchermeta.mojang.com/";
    private static readonly version_manifest_url = "mc/game/version_manifest_v2.json";
    private axios: AxiosInstance = create({
        baseURL: Mojang.base_url
    })

    public async getVersionManifest(): Promise<VersionManifest> {
        return (await this.axios.get(Mojang.version_manifest_url)).data as VersionManifest
    }
}
