import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
  external: ['react', 'react-dom', '@huefy/sdk'],
  banner: {
    js: '/* Huefy React SDK - https://huefy.com */',
  },
});