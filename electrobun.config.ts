import type {ElectrobunConfig} from "electrobun";

export default {
    app: {
        name: "gugle-craft-launcher",
        identifier: "launcher.dubhe.dev",
        version: "0.0.1",
    },
    build: {
        // Vite builds to dist/, we copy from there
        copy: {
            "dist/index.html": "views/mainview/index.html",
            "dist/assets": "views/mainview/assets",
        },
        useAsar: true,
        asarUnpack: ["*.node", "*.dll", "*.dylib", "*.so"],
        // Ignore Vite output in watch mode — HMR handles view rebuilds separately
        watchIgnore: ["dist/**"],
        mac: {
            bundleCEF: false,
            icons: "icon.iconset"
        },
        linux: {
            bundleCEF: false,
            icon: "icon.iconset/icon_256x256.png"
        },
        win: {
            bundleCEF: false,
            icon: "icon.iconset/icon_256x256.png"
        },
    },
} satisfies ElectrobunConfig;
