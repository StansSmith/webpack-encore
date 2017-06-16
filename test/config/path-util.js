/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

'use strict';

const expect = require('chai').expect;
const WebpackConfig = require('../../lib/WebpackConfig');
const RuntimeConfig = require('../../lib/config/RuntimeConfig');
const pathUtil = require('../../lib/config/path-util');
const process = require('process');

function createConfig() {
    const runtimeConfig = new RuntimeConfig();
    runtimeConfig.context = __dirname;
    runtimeConfig.environment = 'dev';
    runtimeConfig.babelRcFileExists = false;

    return new WebpackConfig(runtimeConfig);
}

/**
 * Some tests are very specific to different operating systems.
 * We use this to only run them when needed.
 *
 * @returns {boolean}
 */
function isWindows() {
    return process.platform === 'win32';
}

describe('path-util getContentBase()', () => {
    describe('getContentBase()', () => {
        it('contentBase is calculated correctly', function() {
            if (isWindows()) {
                this.skip();
            }

            const config = createConfig();
            config.runtimeConfig.useDevServer = true;
            config.runtimeConfig.devServerUrl = 'http://localhost:8080/';
            config.outputPath = '/tmp/public/build';
            config.setPublicPath('/build/');
            config.addEntry('main', './main');

            const actualContentBase = pathUtil.getContentBase(config);
            // contentBase should point to the "document root", which
            // is calculated as outputPath, but without the publicPath portion
            expect(actualContentBase).to.equal('/tmp/public');
        });

        it('contentBase works ok with manifestKeyPrefix', function() {
            if (isWindows()) {
                this.skip();
            }

            const config = createConfig();
            config.runtimeConfig.useDevServer = true;
            config.runtimeConfig.devServerUrl = 'http://localhost:8080/';
            config.outputPath = '/tmp/public/build';
            config.setPublicPath('/subdirectory/build');
            // this "fixes" the incompatibility between outputPath and publicPath
            config.setManifestKeyPrefix('/build/');
            config.addEntry('main', './main');

            const actualContentBase = pathUtil.getContentBase(config);
            expect(actualContentBase).to.equal('/tmp/public');
        });

        it('contentBase is calculated correctly on Windows', function() {
            if (!isWindows()) {
                this.skip();
            }

            const config = createConfig();
            config.runtimeConfig.useDevServer = true;
            config.runtimeConfig.devServerUrl = 'http://localhost:8080/';
            config.outputPath = 'C:\\projects\\webpack-encore\\public\\build';
            config.setPublicPath('/build/');
            config.addEntry('main', './main');

            const actualContentBase = pathUtil.getContentBase(config);
            expect(actualContentBase).to.equal('C:\\projects\\webpack-encore\\public');
        });
    });

    describe('generateManifestKeyPrefix', () => {
        it('manifestKeyPrefix is correctly not required on windows', () => {
            const config = createConfig();
            config.outputPath = 'C:\\projects\\webpack-encore\\web\\build';
            config.setPublicPath('/build/');
            config.addEntry('main', './main');

            const actualPrefix = pathUtil.generateManifestKeyPrefix(config);
            expect(actualPrefix).to.equal('build/');
        });

        it('with absolute publicPath, manifestKeyPrefix must be set', () => {
            const config = createConfig();
            config.outputPath = '/tmp/public/build';
            config.setPublicPath('/build');
            config.addEntry('main', './main');
            config.setPublicPath('https://cdn.example.com');

            expect(() => {
                pathUtil.generateManifestKeyPrefix(config);
            }).to.throw('Cannot determine how to prefix the keys in manifest.json. Call Encore.setManifestKeyPrefix() to choose what path (e.g. build/) to use');
        });

        it('when outputPath and publicPath are incompatible, manifestKeyPrefix must be set', () => {
            const config = createConfig();
            config.outputPath = '/tmp/public/build';
            config.addEntry('main', './main');
            // pretend we're installed to a subdirectory
            config.setPublicPath('/subdirectory/build');

            expect(() => {
                pathUtil.generateManifestKeyPrefix(config);
            }).to.throw('Cannot determine how to prefix the keys in manifest.json. Call Encore.setManifestKeyPrefix() to choose what path (e.g. build/) to use');
        });
    });
});
