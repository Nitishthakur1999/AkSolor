import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';


const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;


const certificateName = 'akerpsuite.client';

const certFilePath = path.join(
    baseFolder,
    `${certificateName}.pem`
);

const keyFilePath = path.join(
    baseFolder,
    `${certificateName}.key`
);


if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, {
        recursive: true
    });
}


if (
    !fs.existsSync(certFilePath) ||
    !fs.existsSync(keyFilePath)
) {
    const result = child_process.spawnSync(
        'dotnet',
        [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password'
        ],
        {
            stdio: 'inherit'
        }
    );

    if (result.status !== 0) {
        throw new Error(
            'Could not create certificate.'
        );
    }
}


const target =
    env.ASPNETCORE_HTTPS_PORT
        ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
        : env.ASPNETCORE_URLS
            ? env.ASPNETCORE_URLS.split(';')[0]
            : 'https://localhost:7272';


export default defineConfig({

    plugins: [
        react()
    ],


    resolve: {

        alias: {

            '@': fileURLToPath(
                new URL(
                    './src',
                    import.meta.url
                )
            )

        }

    },


    build: {
        outDir: 'build',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        }
    },


    server: {

        port: parseInt(
            env.DEV_SERVER_PORT || '55087',
            10
        ),


        https: {

            key: fs.readFileSync(
                keyFilePath
            ),

            cert: fs.readFileSync(
                certFilePath
            )

        },


        proxy: {

            '^/weatherforecast': {
                target,
                secure: false
            },

            '^/api': {
                target,
                secure: false
            }

        }

    }

});