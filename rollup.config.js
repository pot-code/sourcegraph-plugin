import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import banner from './banner'

export default {
  input: 'src/index.ts',
  output: {
    banner,
    file: 'build/bundle.js',
    format: 'iife'
  },
  plugins: [
    resolve({
      extensions: ['.ts']
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts']
    })
  ]
}
