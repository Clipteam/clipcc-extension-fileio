const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');

const info = require('./src/info.json');

const config = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'build'),
        module: true,
        library: {
            type: 'commonjs2'
        }
    },
    experiments: {
        outputModule: true
    },
    externals: {
        'clipcc-extension': 'ClipCCExtension',
        'electron': 'commonjs electron',
        '@electron/remote': 'commonjs @electron/remote',
        'fs': 'commonjs fs'
    },
    externalsType: 'global',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: path.join(__dirname, 'src/locales'),
                to: path.join(__dirname, 'build/locales')
            }, {
                from: path.join(__dirname, 'src/assets'),
                to: path.join(__dirname, 'build/assets')
            }, {
                from: path.join(__dirname, 'src/info.json'),
                to: path.join(__dirname, 'build/info.json')
            }]
        }),
        new ZipWebpackPlugin({
            path: path.join(__dirname, 'dist'),
            filename: `${info.id}@${info.version}`,
            extension: 'ccx'
        })
    ]
};

module.exports = config;
