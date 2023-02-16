import  terser from '@rollup/plugin-terser'
import ts from '@rollup/plugin-typescript'
export default {
    input: './src/index.ts',
    output: [
      {
        entryFileNames: '[name].js',
        dir: 'dist',
        exports: 'named',
        format: 'cjs',
        sourcemap: true,
      },
      {
        entryFileNames: '[name].mjs',
        format: 'es',
        dir: 'dist',
        sourcemap: true,
      },
    ],
    plugins:[ts(),terser()]
  }