import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  typescript: {
    // Safe only because CI runs `npm run typecheck` after the build; without that step this must be `false`
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
