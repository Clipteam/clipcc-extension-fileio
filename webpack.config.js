const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');

const info = require('./src/info.json');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'build')
    },
    externals: {
        'clipcc-extension': 'ClipCCExtension',
        'electron': 'commonjs electron',
        'fs': 'commonjs fs'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: path.join(__dirname, 'src'),
                to: path.join(__dirname, 'build'),
                globOptions: {
                    ignore: ['**/*.js']
                }
            }]
        }),
        new ZipWebpackPlugin({
            path: path.join(__dirname, 'dist'),
            filename: `${info.id}@${info.version}`,
            extension: 'ccx'
        })
    ]
};
