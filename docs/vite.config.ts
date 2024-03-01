import { defineConfig } from "vite";
import { sveltepress } from "@sveltepress/vite";
import { defaultTheme } from "@sveltepress/theme-default";
import { sidebar } from "./config/sidebar";

const config = defineConfig({
  plugins: [
    sveltepress({
      theme: defaultTheme({
        navbar: [
          // Add your navbar configs here
        ],
        sidebar,
        github: "https://github.com/jycouet/remult-kit",
        logo: "/remult-kit.svg",
        themeColor: {
          dark: "#ff3e00",
          light: "#ff3e00",
          primary: "#5B68DF",
          gradient: {
            start: "#5B68DF",
            end: "#FCB335",
          },
          hover: "#ff3e00",
        },
        preBuildIconifyIcons: {
          fxemoji: ["constructionsign"],
          heroicons: ["square-3-stack-3d-solid"],
          "vscode-icons": [
            "file-type-svelte",
            "file-type-markdown",
            "file-type-vite",
          ],
        },
      }),

      siteConfig: {
        title: "remult-kit",
        description: "An opinionated Remult setup for SvelteKit",
      },
    }),
  ],
});

export default config;
