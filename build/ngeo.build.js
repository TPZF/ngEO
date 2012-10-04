({
	appDir: "../client",
    baseUrl: "js",
	paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.ui": "externs/jquery-ui-1.8.23.custom.min",
		"jquery.mobile": "externs/jquery.mobile-1.1.1",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
	},
	removeCombined: true,
	shim: {
		'jquery': {
			deps: [],
			exports: 'jQuery'
		},
		'jquery.ui': {
			deps: ['jquery'],
			exports: 'jQuery'
		},
		'ngeo.jqm-config': {
            deps: ['jquery']
        },
 		'jquery.mobile': {
            deps: ['jquery','ngeo.jqm-config'],
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
		{ name: "ngeo.main" },
		{ name: "ngeo.menubar",  exclude: ["jquery"]},
		{ name: "ngeo.map", exclude: ["ngeo.configuration","backbone"]},
		{ name: "ngeo.data-services-area", exclude: ["ngeo.configuration","ngeo.map","backbone","jquery","jquery.mobile"]},
	],
	dir: "output"
})