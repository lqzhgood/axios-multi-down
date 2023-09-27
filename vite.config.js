import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [dts()],
	build: {
		outDir: 'lib',
		lib: {
			entry: resolve(__dirname, './src/index.ts'),
			name: 'AxiosMultiDown',
			fileName: 'AxiosMultiDown',
		},
		rollupOptions: {
			// 确保外部化处理那些你不想打包进库的依赖
			external: ['axios'],
			output: {
				// 在 UMD 构建模式下,全局模式下为这些外部化的依赖提供一个全局变量
				globals: {
					axios: 'axios',
				},
			},
		},
	},
});