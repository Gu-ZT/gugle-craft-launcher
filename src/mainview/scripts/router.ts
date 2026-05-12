import StartPage from "@renderer/views/StartPage.vue";
import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";
import DownloadPage from "@renderer/views/DownloadPage.vue";
import SettingsPage from "@renderer/views/SettingsPage.vue";
import AppsPage from "@renderer/views/AppsPage.vue";


export type Page = 'start' | 'download' | 'settings' | 'apps';

export const pageMap: Record<Page, string> = {
    start: "/start",
    download: "/download",
    settings: "/settings",
    apps: "/apps"
}

const routes: RouteRecordRaw[] = [
    {path: pageMap.start, component: StartPage},
    {path: pageMap.download, component: DownloadPage},
    {path: pageMap.settings, component: SettingsPage},
    {path: pageMap.apps, component: AppsPage}
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
