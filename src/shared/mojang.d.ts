export interface VersionManifestVersion {
    "id": string;
    "type": "snapshot" | "release";
    "url": string;
    "time": string;
    "releaseTime": string;
    "sha1": string;
    "complianceLevel": number;
}

export interface VersionManifest {
    latest: {
        release: string,
        snapshot: string
    },
    versions: VersionManifestVersion[]
}
