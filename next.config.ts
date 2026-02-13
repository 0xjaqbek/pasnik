import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  env: {
    NEXT_PUBLIC_DISABLE_REGISTRATION: process.env.NEXT_PUBLIC_DISABLE_REGISTRATION || 'false',
  },
};

export default withPWA(nextConfig);
