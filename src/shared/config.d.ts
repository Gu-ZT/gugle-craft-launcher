export type DownloadSource = 'official' | 'mirror' | 'official_preference';
export type VersionSource = DownloadSource;
export type ModApiSource = 'modrinth' | 'curseforge';

export interface DownloadConfig {
    download_source: DownloadSource;
    version_source: VersionSource;
    mod_source: DownloadSource;
    mod_api_source: ModApiSource;
    curseforge_api_key?: string;
}

export type VersionIsolation = 'all' | 'none' | 'mod' | 'informal' | 'mod_informal';
export type WindowSize = 'default' | 'fullscreen' | [number, number];

export interface LaunchConfig {
    version_isolation: VersionIsolation;
    game_title: string | undefined;
    window_size: WindowSize;
    java_path: string | undefined;
}

export type MemoryConfig = 'auto' | number;

export interface Config {
    download_config: DownloadConfig;
    launch_config: LaunchConfig;
    memory_config: MemoryConfig;
}
