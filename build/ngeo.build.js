({
    baseUrl: "../js",
    name: "ngeo.main",
    out: "ngeo.main.js",
	paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.ui": "externs/jquery-ui-1.8.23.custom.min",
		"jquery.mobile": "externs/jquery.mobile-1.1.1",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
	},
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
	}
})