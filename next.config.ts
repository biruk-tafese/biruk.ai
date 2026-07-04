import withPWAInit from "@ducanh2912/next-pwa";
import type { Configuration } from "webpack";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silences the next-16 turbopack analysis warning block
  turbopack: {}, 

  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    // Tell webpack to ignore server-side native node binary imports entirely
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), "onnxruntime-node"];
    }
    
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "sharp$": false,
        "onnxruntime-node$": false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);