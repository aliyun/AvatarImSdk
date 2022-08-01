// import babel from 'rollup-plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
// import commonjs from 'rollup-plugin-commonjs';

import pkg from './package.json';

const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'avatar-im',
        file: pkg.main,
        format: 'umd',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      },
      {
        file: pkg.unpkg,
        format: 'cjs',
        plugins: [terser()],
        sourcemap: true
      }
    ],

    plugins: [
      json(),
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
