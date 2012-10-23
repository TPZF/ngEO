({
	appDir: "../client",
    baseUrl: "js",
	paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0.min",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
		"text": "externs/text"
	},
	removeCombined: true,
	shim: {
		'jquery': {
			deps: [],
			exports: 'jQuery'
		},
		'jqm-config': {
            deps: ['jquery']
        },
 		'jquery.mobile': {
            deps: ['jquery','jqm-config'],
            exports: 'jQuery'
        },
		"underscore": {
			deps: [],
			exports: '_'
		},
		"backbone": {
			deps: ["underscore"],
			exports: 'Backbone'
		}
	},
	optimizeCss: "none",
	optimize: "uglify",
	modules: [
		{ name: "main" },
		{ name: "map/map", exclude: ["configuration","backbone"]},
		{ name: "data-services-area", exclude: ["configuration","map/map","backbone","jquery","jquery.mobile"]},
	],
	dir: "output"
})