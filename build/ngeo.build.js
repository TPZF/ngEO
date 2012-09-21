({
    baseUrl: "../js",
    name: "ngeo.main",
    out: "ngeo.main.js",
	paths: {
		"jquery": "externs/jquery-1.8.2.min",
		"jquery.ui": "externs/jquery-ui-1.8.23.custom.min",
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