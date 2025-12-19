import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        environment: "jsdom",
        setupFiles: [path.resolve(__dirname, "./test/vitest.setup.ts")],
        css: false,
        server: {
            deps: {
                inline: ["next-intl"],
            },
        },
    },
});
