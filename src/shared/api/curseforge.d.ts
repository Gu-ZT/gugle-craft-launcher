/** CurseForge 搜索响应 */
export interface CurseforgeSearchResponse {
    data: CurseforgeProject[];
    pagination: {
        index: number;
        pageSize: number;
        resultCount: number;
        totalCount: number;
    };
}

/** CurseForge 项目 */
export interface CurseforgeProject {
    id: number;
    gameId: number;
    name: string;
    slug: string;
    links: {
        websiteUrl: string;
        wikiUrl: string;
        issuesUrl: string;
        sourceUrl: string;
    };
    summary: string;
    status: number;
    downloadCount: number;
    isFeatured: boolean;
    primaryCategoryId: number;
    categories: CurseforgeCategory[];
    classId: number;
    authors: CurseforgeAuthor[];
    logo: {
        id: number;
        modId: number;
        title: string;
        description: string;
        thumbnailUrl: string;
        url: string;
    };
    screenshots: CurseforgeScreenshot[];
    mainFileId: number;
    latestFiles: CurseforgeFile[];
    /** API 返回的完整文件列表（需单独请求） */
    latestFilesIndexes?: CurseforgeFileIndex[];
    dateCreated: string;
    dateModified: string;
    dateReleased: string;
    allowModDistribution: boolean;
}

/** CurseForge 分类 */
export interface CurseforgeCategory {
    id: number;
    gameId: number;
    name: string;
    slug: string;
    url: string;
    iconUrl: string;
    dateModified: string;
    isClass: boolean;
    classId: number;
    parentCategoryId: number;
    displayIndex: number;
}

/** CurseForge 作者 */
export interface CurseforgeAuthor {
    id: number;
    name: string;
    url: string;
}

/** CurseForge 截图 */
export interface CurseforgeScreenshot {
    id: number;
    modId: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
}

/** CurseForge 文件 */
export interface CurseforgeFile {
    id: number;
    gameId: number;
    modId: number;
    isAvailable: boolean;
    displayName: string;
    fileName: string;
    releaseType: number;
    fileStatus: number;
    hashes: Array<{ value: string; algo: number }>;
    fileLength: number;
    downloadUrl: string;
    gameVersions: string[];
    sortableGameVersions: Array<{ gameVersionName: string; gameVersionPadded: string }>;
    dependencies: CurseforgeDependency[];
    exposeAsAlternative?: boolean;
    parentProjectFileId?: number;
    alternateFileId?: number;
    isServerPack?: boolean;
    serverPackFileId?: number;
    isEarlyAccessContent?: boolean;
    earlyAccessEndDate?: string;
    fileFingerprint: number;
    modules: CurseforgeModule[];
}

/** CurseForge 文件索引（来自 latestFilesIndexes） */
export interface CurseforgeFileIndex {
    fileId: number;
    filename: string;
    releaseType: number;
    fileStatus: number;
    gameVersion: string;
    gameVersions: string[];
}

/** CurseForge 依赖 */
export interface CurseforgeDependency {
    modId: number;
    relationType: number;
}

/** CurseForge 模块 */
export interface CurseforgeModule {
    name: string;
    fingerprint: number;
}

/** CurseForge 文件列表响应 */
export interface CurseforgeFilesResponse {
    data: CurseforgeFile[];
    pagination: {
        index: number;
        pageSize: number;
        resultCount: number;
        totalCount: number;
    };
}

/** 批量获取项目响应 */
export interface CurseforgeProjectsResponse {
    data: CurseforgeProject[];
}

// --- RPC 参数 ---

export interface CurseSearchParams {
    query: string;
    pageSize?: number;
    index?: number;
    classId?: number;
    sortField?: number;
    sortOrder?: 'asc' | 'desc';
    gameVersion?: string;
    modLoaderType?: number;
}
