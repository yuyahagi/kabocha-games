const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        'launcher': './src/launcher.js',
        'pumpkins': './src/pumpkins.js',
        'kana': './src/kana.js',
        'maze': './src/maze.js',
        'liar': './src/liar.js'
    },
    output: {
        path: path.join(__dirname, '/dist/app'),
        publicPath: '/app/',
        filename: '[name].bundle.js'
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: false,
        port: 5500,
        open: false
    },
    watchOptions: {
        ignored: '/node_modules/'
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: 'initial'
        }
    }
};
