// import babel from 'rollup-plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
// import commonjs from 'rollup-plugin-commonjs';

import pkg from './package.json';

const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'build/index.js',
        format: 'umd',
        name: 'avatar-im',
        sourcemap: true
      },
    ],

    plugins: [
      nodeResolve({
        browser:true
      }),
      typescript({
        useTsconfigDeclarationDir: true,
      }),
      // babel({
      //   exclude: 'node_modules/**',
      //   extensions: ['.ts'],
      // }),
      // terser(),
    ],
  }
];
// export default [buildConfig, bundleConfig];
export default config;
