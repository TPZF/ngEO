/*var require = {
	shim: {
		"vendor/underscore": {
			exports: "_"
		}
	}
};*/


var require = {
     paths: {
        "jquery": "../vendor/jquery-1.11.1.min",
        "jquery.mobile": "../vendor/jquery.mobile-1.3.2.min",
        "underscore": "../vendor/underscore",
		"backbone": "../vendor/backbone",
		"text": "../vendor/text"
   },
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
	}
 };
