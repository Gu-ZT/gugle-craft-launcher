/** Modrinth 搜索命中项 */
export interface ModrinthSearchHit {
    project_id: string;
    project_type: string;
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    display_categories: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string | null;
    date_created: string;
    date_modified: string;
    latest_version: string;
    license: string;
    client_side: string;
    server_side: string;
    gallery: string[];
    featured_gallery: string | null;
    color: number | null;
}

/** Modrinth 项目详情 */
export interface ModrinthProject {
    id: string;
    slug: string;
    project_type: string;
    team: string;
    title: string;
    description: string;
    body: string;
    published: string;
    updated: string;
    status: string;
    moderator_message: string | null;
    license: { id: string; name: string; url: string | null };
    client_side: string;
    server_side: string;
    downloads: number;
    followers: number;
    categories: string[];
    additional_categories: string[];
    game_versions: string[];
    loaders: string[];
    versions: string[];
    icon_url: string | null;
    issues_url: string | null;
    source_url: string | null;
    wiki_url: string | null;
    discord_url: string | null;
    donation_urls: Array<{ id: string; platform: string; url: string }>;
}

/** Modrinth 版本 */
export interface ModrinthVersion {
    id: string;
    project_id: string;
    author_id: string;
    featured: boolean;
    name: string;
    version_number: string;
    changelog: string;
    changelog_url: string | null;
    date_published: string;
    downloads: number;
    version_type: string;
    status: string;
    requested_status: string | null;
    files: ModrinthVersionFile[];
    dependencies: ModrinthDependency[];
    game_versions: string[];
    loaders: string[];
}

/** 版本中的文件 */
export interface ModrinthVersionFile {
    hashes: { sha512: string; sha1: string };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
}

/** 模组依赖 */
export interface ModrinthDependency {
    version_id: string | null;
    project_id: string | null;
    file_name: string | null;
    dependency_type: string;
}

/** Modrinth 标签（loader / game_version / category） */
export interface ModrinthTag {
    name: string;
    display_name: string;
    icon: string;
    applicable_to: string[];
}

// --- RPC 参数与响应类型 ---

export interface ModSearchParams {
    query: string;
    facets?: string[][];
    offset?: number;
    limit?: number;
    index?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
}

export interface ModSearchResponse {
    hits: ModrinthSearchHit[];
    offset: number;
    limit: number;
    total_hits: number;
}

export interface ModTagsResponse {
    loaders: ModrinthTag[];
    gameVersions: ModrinthTag[];
    categories: ModrinthTag[];
}
