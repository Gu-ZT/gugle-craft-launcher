import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [vue()],
	root: "src/mainview",
	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},
	server: {
		port: 5173,
		strictPort: true,
	},
	resolve:{
		alias: {
			'@shared': path.resolve(__dirname, 'src/shared'),
			'@renderer': path.resolve(__dirname, 'src/mainview')
		},
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
	}
});
