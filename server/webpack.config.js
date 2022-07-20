const path = require('path');

module.exports = {
	entry: './src/index.ts',
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname),
	},
	mode: 'production',
	// very important lol
	target: 'node',
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				options: {
					configFile: path.join(path.resolve(__dirname), "tsconfig.json")
				},
			},
		]
	},
	devtool: 'source-map',
	optimization: {
		minimize: true
	}
};
