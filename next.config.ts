import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://qsrapi.signfeed.in/:path*'
      }
    ]
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qsrapi.signfeed.in',
        pathname: '/uploads/**',
      },
    ],
  },

  ...(isProd && {
    output: 'export',
    distDir: 'out',
    assetPrefix: './',
    basePath: '',
    trailingSlash: true,

    webpack: (config: Configuration) => {
      if (config.output) {
        config.output.publicPath = './';
      }

      if (config.resolve) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          os: false,
        };
      }

      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: {
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
          },
        },
      };

      return config;
    },
  }),
};

export default nextConfig;
