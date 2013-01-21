
define(["jquery", "menubar", "map/map", "searchResults/model/searchResults", "search/model/datasetSearch", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "searchResults/widget/resultsTable",
		"shopcart/widget/shopcart", "map/widget/toolbarMap",
		"map/widget/mapPopup",
		"text!../pages/data-services-area.html", "context-help"], 
	function($, MenuBar, Map, SearchResults, DatasetSearch, DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget, ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea, ContextHelp) {
	
return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		var toolbar = dsa.find('#toolbar');
		
		// Wrap the image with a div to display both image and text below, and then add class for button styling
		toolbar.find('img')
			.wrap('<div class="tb-elt" />')
			.addClass('tb-button');
			
		// Add text for each element
		toolbar.find('img').each( function(index) {
			$(this).after('<div class="tb-text">' + $(this).attr('name') + '</div>');
		});
	
		return dsa;
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 *
	 * @param element The root element of the module
	 */
	initialize: function(element) {
			
		//_.extend(this, Backbone.Events);
		// Create all widgets
		DataSetSelectionWidget(element);
		var searchWidget = SearchCriteriaWidget(element);
		ResultsTableWidget(element);
		//ShopcartWidget(element);
		ToolBarMap(element);
		ContextHelp(element);
		
		// Setup the router for shared URL support
		var router = new Backbone.Router();
//		router.route("data-services-area/search", "search", function() {
//			MenuBar.showPage("data-services-area");
//			searchWidget.ngeowidget("show");
//		});
		var self = this;
		router.route(
				"data-services-area/search/:datasetId?:query", 
				"search", function(datasetId, query) {		
			
//	"data-services-area/search/:datasetId?start=:startdate&stop=:stopdate&bbox=:bbox&useExtent=:useExtent&useAdvancedCriteria=:useAdvancedCriteria&:criteria&useDownloadOptions=:useDownloadOptions&:downloadOptions)?
//	"search", function(datasetId, startdate, stopdate, bbox, useExtent, useAdvancedCriteria, criteria, useDownloadOptions, downloadOptions) {		
			

			DatasetSearch.set({"datasetId" : datasetId});
			//load the dataset
			DatasetSearch.updateDatasetModel();
			//set the attribute when the dataset has been loaded in order to 
			//not overwrite the start/stop dates 
			DatasetSearch.on("datasetLoaded", function(){
				
				var vars = query.split("&");
			    var attributes = {};
				for (var i = 0; i < vars.length; i++) {
			        
			    	var pair = vars[i].split("=");
			        
			    	//console.log(pair[1]);
		    		//console.log(pair[0]);
			    		
					switch (pair[0]) {
						case "bbox": 
							var coords = pair[1].split(",");
							console.log(coords);
							DatasetSearch.set({west : coords[0]});
							DatasetSearch.set({south : coords[1]});
							DatasetSearch.set({east : coords[2]});
							DatasetSearch.set({north: coords[3]});
							break;
						case "start" : 
							DatasetSearch.set({startdate: pair[1]});
							break;
						case "stop" : 
							DatasetSearch.set({stopdate: pair[1]});
							break;
						default :
							//set the parameters if there are avanced attributes, download options or attributes of the model
							//skip any other parameter
							if (_.has(DatasetSearch.dataset.attributes.datasetSearchInfo.attributes, pair[0]) ||
									_.has(DatasetSearch.dataset.attributes.datasetSearchInfo.downloadOptions, pair[0]) ||
									_.has(DatasetSearch.attributes, pair[0])){ 
								
								attributes[pair[0]] = pair[1];
								console.log("attributes");
								console.log(attributes);
							}
							break;
			    	}
			    }
				
				DatasetSearch.set(attributes);	
			    //console.log("----------------------------------");
			    //console.log("model attributes");
			    //console.log(DatasetSearch.attributes);	
	
				MenuBar.showPage("data-services-area");
				//simulate a click on the correct tab id 
	//			var selector = "li a[href=#" + viewId + "]";
	//			element.find(selector).click();
				//display the search widget 
				searchWidget.ngeowidget("show");
				
			});
		});
		
		// Create the popup for map
		var mapPopup = new MapPopup('.ui-page-active');
		mapPopup.close();
		
		// Display a message about dataset in the map
		DatasetSearch.on('change:datasetId', function(model) {
			var datasetId = model.get('datasetId');
			if ( datasetId ) {
				$('#datasetMessage').html( "Current dataset : " + model.get('datasetId') );
			} else {
				$('#datasetMessage').html( "Current dataset : None" );
			}
		});

		// Connect with map feature picking
		Map.on('pickedFeatures',SearchResults.setSelection,SearchResults);
	
		// Connect search results events with map
		SearchResults.on('change',Map.setResults);
		SearchResults.on('zoomToProductExtent',Map.zoomToFeature);
		SearchResults.on('selectFeatures',Map.selectFeatures);
		SearchResults.on('unselectFeatures',Map.unselectFeatures);		
	}
};

});
