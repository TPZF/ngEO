({
	appDir: "../client",
    baseUrl: "js",
	paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0.min",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-datebox" : "externs/jqm-datebox-1.1.0.mode.datebox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
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
		},
		
    	'jqm-datebox-core' : {
    		deps: ['jquery', 'jquery.mobile'],
         		exports: 'jQuery'
    	},
    	'jqm-datebox-calbox': {
        	deps: ['jqm-datebox-core'],
       		exports: 'jQuery'
    	},
    	
    	'jqm-datebox-datebox': {
    		deps: ['jqm-datebox-core'],
    		exports: 'jQuery'
    	},
    	
    	'jquery.dataTables' : {
    	 deps: ['jquery'],
         	exports: 'jQuery'
   		}
	},
	optimizeCss: "none",
	optimize: "uglify",
	modules: [
		{ name: "main" },
		{ name: "map/map", exclude: ["configuration","backbone","underscore"]},
		{ name: "data-services-area", exclude: ["configuration","map/map","backbone","underscore","jquery","jquery.mobile","jquery.dataTables"]},
		{ name: "account", exclude: ["configuration","map/map","backbone","underscore","jquery","jquery.mobile","jquery.dataTables"]},
	],
	dir: "output"
})
