import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// Cert sirf dev server ke liye. Production build me ye chalta hi nahi.
function getCerts() {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const name = 'akerpsuite.client';
    const certFilePath = path.join(baseFolder, `${name}.pem`);
    const keyFilePath = path.join(baseFolder, `${name}.key`);

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        const result = child_process.spawnSync(
            'dotnet',
            ['dev-certs', 'https', '--export-path', certFilePath, '--format', 'Pem', '--no-password'],
            { stdio: 'inherit' }
        );
        if (result.status !== 0) {
            throw new Error('Could not create certificate.');
        }
    }

    return {
        key: fs.readFileSync(keyFilePath),
        cert: fs.readFileSync(certFilePath)
    };
}

const target = env.ASPNETCORE_HTTPS_PORT
    ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
    : env.ASPNETCORE_URLS
        ? env.ASPNETCORE_URLS.split(';')[0]
        : 'https://localhost:7272';

export default defineConfig(({ command }) => ({
    plugins: [react()],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },

    build: {
        outDir: 'build',
        emptyOutDir: true,
        target: 'es2020',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]',

                // Ye chunks tabhi alag load honge jab code me dynamic import / React.lazy ho.
                manualChunks(id) {
                    if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
                        return 'vendor';
                    }
                    if (/node_modules[\\/](three|@react-three)[\\/]/.test(id)) {
                        return 'three';
                    }
                    if (/node_modules[\\/]recharts[\\/]/.test(id)) {
                        return 'charts';
                    }
                    if (/node_modules[\\/]xlsx[\\/]/.test(id)) {
                        return 'xlsx';
                    }
                }
            }
        }
    },

    server: command === 'serve'
        ? {
            port: parseInt(env.DEV_SERVER_PORT || '55087', 10),
            https: getCerts(),
            proxy: {
                '^/weatherforecast': { target, secure: false },
                '^/api': { target, secure: false }
            }
        }
        : undefined
}));