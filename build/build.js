({
	appDir: "../client",
   	baseUrl: "js",
	mainConfigFile: '../client/js/main.js',
	removeCombined: true,
	optimizeCss: "none",
	optimize: "uglify",
	modules: [
		{ name: "help" },
		{ name: "main" },
		{ name: "map/map", exclude: ["main"]},
		{ name: "data-services-area", exclude: ["main", "map/map","jquery.dataTables"]},
		{ name: "account", exclude: ["main","map/map"]},
	],
	dir: "output",
	// Text plugin : inline everything and remove it
	inlineText: true,
	stubModules: ['text']
})
