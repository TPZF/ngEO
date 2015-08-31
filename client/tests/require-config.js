/*var require = {
	shim: {
		"vendor/underscore": {
			exports: "_"
		}
	}
};*/


var require = {
     paths: {
        "jquery": "externs/jquery-1.11.1.min",
        "jquery.mobile": "externs/jquery.mobile-1.3.2.min",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
		"text": "externs/text"
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
