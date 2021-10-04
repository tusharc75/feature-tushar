module.exports = {
	globDirectory: 'build/',
	globPatterns: [
		'**/*.{png,json,xml,ico,html,txt,js,css,svg}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'build/sw.js',
	maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 * 1024
};