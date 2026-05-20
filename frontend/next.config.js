/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'troika-three-text'],
  webpack: (config) => {
    config.resolve.alias['webgl-sdf-generator$'] = path.resolve(__dirname, 'src/lib/webgl-sdf-generator-wrapper.js');
    config.resolve.alias['bidi-js$'] = path.resolve(__dirname, 'src/lib/bidi-js-wrapper.js');
    return config;
  }
}

module.exports = nextConfig
