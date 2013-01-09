
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-datebox" : "externs/jqm-datebox-1.1.0.mode.datebox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
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
        },
        
		'underscore': {
            deps: [],
            exports: '_'
		},
		'backbone': {
            deps: ['underscore'],
            exports: 'Backbone'
		}
	}, 
	
	config : {
		
		"configuration" : {
			
			"inputLabelSuffix" : "label",
			
			"fieldIdSuffixSepartor" : "_",
				
			"rangeStartSuffix" : "from",
			
			"rangeStopSuffix" : "to",
				
			"inputSuffix" : "input",
			
			"widgetSuffix" : "widget",
			
			"searchCriteriaToOpenSearchMapping" : {
				"orbit" : "on",
				"pass" : "od",
				"status" : "status",
				"sensor" : "isn",
				"sensorType" : "st",
				"sensorMode" : "som",
				"satellite" : "psn",
				"startTimeFromAscendingNode" : "axsa",
				"completionTimeFromAscendingNode" : "axso", 
				"track" : "track",
				"daynight flag" : "daynight flag",
				"granule": "granule"
			},
			
			
			"downloadManager" : {
				
				"undefinedDownloadManagerId"	: "undefined download manager id",
		        "activeStatus": {
		            "value": "ACTIVE"
		        },
		        "inactiveStatus": {
		            "value": "INACTIVE"
		        },
		        "stoppedStatus": {
		            "value": "STOPPED"
		        },
		        "stopCommand": {
		            "value": "STOP",
		            "message": "The server has received a STOP command"
		        },
		        "stopImmediatelyCommand": {
		            "value": "STOP_IMMEDIATELY",
		            "message": "The server has received a STOP_IMMEDIATELY command"
		        }
			},
	
			"directDownload" : {
				"productColumnIndex" : 8
			},
			
			"dataAccessRequestStatuses" : {
			   	   
			   "validationRequestStage" : "validation",
			   
			   "confirmationRequestStage" : "confirmation",
			   
			    "validStatuses": {
			        "inProgressStatus": {
			            "value": 0,
			            "status" : "Processing",
			            "message": "Request In Process..."
			        },
			        "pausedStatus": {
			            "value": 1,
			            "status" : "Paused",
			            "message": "Request Paused"
			        },
			        "completedStatus": {
			            "value": 2,
			            "status" : "Completed",
			            "message": "Request Completed"
			        },
			        "cancelledStatus": {
			            "value": 3,
			            "status" : "Cancelled",
			            "message": "Request Cancelled"
			        },
			        "validatedStatus": {
			            "value": 4,
			            "status" : "Validated",
			            "message": "Request Acknowledged"
			        },
			        "bulkOrderStatus": {
			            "value": 5,
			            "status" : "BulkOrdered",
			            "message": "Request Max Size Exceeded"
			        }
			    },
			    "unExpectedStatusError": "ERROR: The server returned an expected status",
			    "requestSubmissionError": "FAILURE: Request Submission Failed",
			    "invalidDownloadManagersError": "Invalid Request : Please select a download manager first.", 
				"invalidConfirmationRequest" : "Invalid Confirmation Request: The selected download manager has been changed.",
				"pauseButtonSuffix" : "pause",
				"stopButtonSuffix" : "stop"
			},
			
			"simpleDataAccess" : {
				"invalidProductURLsError": "Invalid Request: Please check products having a url."
			}, 
			
			"standingOrder" : {
				"invalidOpenSearchURLError": "Invalid OpenSearch URL : Empty URL.",
				"invalidDownloadOptionsError": "Invalid Download options : Empty Value."
			}
		}
	}
		
  });

/**
 * Main ngEO module
 */
require( ["require", "jquery", "configuration", "menubar", "backbone", "jquery.mobile"] ,
		function(require, $, Configuration, MenuBar, Backbone) {

/** Console fix	: create a dummy console.log when console is not present. Otherwise it is not working on some browser configuration */
window.console || (console={log:function(){}});

/** Use a defered object for document ready */
var doc_ready = $.Deferred();

/** When the document is ready and configuration is loaded load the rest of the application */
$.when(doc_ready, Configuration.load())
	.done( function() {
	
		$.mobile.loading("show");
	
		// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
		$("body").removeClass("ui-mobile-viewport");
		$("header").find("a").removeClass("ui-link");

		// Load the map module and initialize it
		require(["map/map"], function(Map) {
		
			// Initialize menu bar
			MenuBar.initialize("header nav");
			Map.initialize("mapContainer");
			
		});
		
	})
	.fail( function() {
		// Create a pop-up to warn the user
		$('<div><p>Error : Cannot load configuration</p></div>')
			.appendTo('#mapContainer')
			.popup()
			.popup('open');
	});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});