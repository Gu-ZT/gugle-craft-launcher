import StartPage from "@renderer/views/StartPage.vue";
import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";


export type Page = 'start' | 'download' | 'settings' | 'apps';

export const pageMap: Record<Page, string> = {
    start: "/",
    download: "/download",
    settings: "/settings",
    apps: "/apps"
}

const routes: RouteRecordRaw[] = [
    {path: pageMap.start, component: StartPage},
    {path: pageMap.download, component: StartPage},
    {path: pageMap.settings, component: StartPage},
    {path: pageMap.apps, component: StartPage}
]

console.log(routes)

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
