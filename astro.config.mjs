// @ts-check
import {
  defineConfig,
  passthroughImageService,
  fontProviders,
} from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://jonheslop.com",
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: passthroughImageService(),
  },
  adapter: cloudflare(),
  experimental: {
    fonts: [
      {
        provider: fontProviders.local(),
        name: "soehne",
        cssVariable: "--font-soehne",
        options: {
          variants: [
            {
              weight: 400,
              style: "normal",
              src: ["./src/fonts/soehne-web-buch.woff2"],
            },
            {
              weight: 400,
              style: "italic",
              src: ["./src/fonts/soehne-web-buch-kursiv.woff2"],
            },
            {
              weight: 600,
              style: "normal",
              src: ["./src/fonts/soehne-halbfett.woff2"],
            },
          ],
        },
      },
    ],
  },
  integrations: [mdx()],
});
