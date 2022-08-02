// import babel from 'rollup-plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
// import { DEFAULT_EXTENSIONS } from '@babel/core';
// import commonjs from 'rollup-plugin-commonjs';

// import pkg from './package.json';

const config = [
  {
    input: 'index.ts',
    output: [
      {
        file: 'demo/index.js',
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
  },
  // {
  //   input: 'demo/testAudioSource.js',
  //   output: [
  //     {
  //       file: 'demo/testAudio.js',
  //       format: 'umd',
  //       name: 'Test',
  //     },
  //   ],
  //   external: ['react', 'react-dom', 'chat-ui'],
  //   plugins: [
  //     nodeResolve({
  //       extensions:['.ts','.js']
  //     }),
  //     typescript({
  //       useTsconfigDeclarationDir: true,
  //     }),
  //     // babel({
  //     //   // exclude: 'node_modules/**',
  //     //   // extensions: ['.ts'],
  //     //   extensions: [
  //     //     ...DEFAULT_EXTENSIONS,
  //     //     '.ts',
  //     //     '.tsx'
  //     //   ]
  //     // }),
  //     // terser(),
  //     // babel({
  //     //   runtimeHelpers: true,
  //     //   exclude: 'node_modules/**',
  //     // }),
  //     // livereload(),
  //     // serve('demo'),
  //   ],
  // },
];

export default config;
