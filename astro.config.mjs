// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    imageService: "compile",
  }),
  experimental: {
    fonts: [
      {
        provider: "local",
        name: "soehne",
        cssVariable: "--font-soehne",
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
    ],
  },
  integrations: [mdx()],
});
