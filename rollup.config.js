import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
// import commonjs from 'rollup-plugin-commonjs';

// import pkg from './package.json';

const buildConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'build/index.js',
      format: 'umd',
      name: 'IM',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts'],
    }),
    terser(),
  ],
};

const bundleConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'cjs/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'es/index.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: ['mitt'],
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts'],
    }),
  ],
};

export default [buildConfig, bundleConfig];
