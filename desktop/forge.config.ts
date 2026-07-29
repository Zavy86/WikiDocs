import * as path from 'node:path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const iconBasePath = path.resolve(__dirname, 'assets/icons/app');
const iconDirectoryPath = path.resolve(__dirname, 'assets/icons');
const backendNodeModulesPath = path.resolve(__dirname, '../backend/node_modules');
const backendDistPath = path.resolve(__dirname, '../backend/dist/backend');
const frontendBrowserDistPath = path.resolve(__dirname, '../frontend/dist/wikidocs-frontend/browser');

const config:ForgeConfig = {
  packagerConfig: {
    asar: true,
    // Icons are versioned manually from ../frontend/public/favicon.ico.
    // Keep this basename extensionless so Electron Packager can resolve .ico/.icns.
    icon: iconBasePath,
    extraResource: [
      iconDirectoryPath,
      backendNodeModulesPath,
      backendDistPath,
      frontendBrowserDistPath,
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: `${iconBasePath}.ico`,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: `${iconBasePath}.png`,
      },
    }),
    new MakerDeb({
      options: {
        icon: `${iconBasePath}.png`,
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
          {
            html: './src/settings.html',
            js: './src/settings.ts',
            name: 'settings_window',
            preload: {
              js: './src/settings.preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [ FuseV1Options.RunAsNode ]: true,
      [ FuseV1Options.EnableCookieEncryption ]: true,
      [ FuseV1Options.EnableNodeOptionsEnvironmentVariable ]: false,
      [ FuseV1Options.EnableNodeCliInspectArguments ]: false,
      [ FuseV1Options.EnableEmbeddedAsarIntegrityValidation ]: true,
      [ FuseV1Options.OnlyLoadAppFromAsar ]: true,
    }),
  ],
};

export default config;
