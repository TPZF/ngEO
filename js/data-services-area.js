
define(["jquery", "menubar", "map/map", "map/selectHandler", "searchResults/model/searchResults", "search/model/datasetSearch",  
        "dataAccess/model/standingOrderDataAccessRequest", "dataAccess/widget/standingOrderWidget", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "searchResults/widget/resultsTable", 
		"shopcart/widget/shopcart", "map/widget/toolbarMap", "map/widget/mapPopup", 
		"text!../pages/data-services-area.html", "context-help", 'jquery.dateRangeSlider'], 
	function($, MenuBar, Map, SelectHandler, SearchResults, DatasetSearch, StandingOrderDataAccessRequest, StandingOrderWidget,
			DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget,
			ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea, ContextHelp) {
	
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
		var searchWidget = SearchCriteriaWidget.create(element);
		ResultsTableWidget(element);
		//ShopcartWidget(element);
		ToolBarMap(element);
		ContextHelp(element);
		
		// Setup the router for shared URL support
		var router = new Backbone.Router();
		var self = this;
		
		router.route(
				"data-services-area/search/:datasetId?:query", 
				"search", function(datasetId, query) {		
			
//	"data-services-area/search/:datasetId?start=:startdate&stop=:stopdate&bbox=:bbox&useExtent=:useExtent&useAdvancedCriteria=:useAdvancedCriteria&:criteria&useDownloadOptions=:useDownloadOptions&:downloadOptions)?
//	"search", function(datasetId, startdate, stopdate, bbox, useExtent, useAdvancedCriteria, criteria, useDownloadOptions, downloadOptions) {		
					
			DatasetSearch.set({"datasetId" : datasetId});
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.on("datasetLoaded", function(){
				
				DatasetSearch.populateModelfromURL(query);
				MenuBar.showPage("data-services-area");
				//refresh the search widget after the model has been update
				SearchCriteriaWidget.refresh();
				searchWidget.ngeowidget("show");
			});
		});
		
		//Route standing order url
		router.route(
				"data-services-area/sto/:datasetId?:query", 
				"sto", function(datasetId, query) {		
						
			DatasetSearch.set({"datasetId" : datasetId});
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.on("datasetLoaded", function(){
				
				DatasetSearch.populateModelfromURL(query);
				StandingOrderDataAccessRequest.populateModelfromURL(query);
				
				//Display the STO widget
				MenuBar.showPage("data-services-area");
				
				var standingOrderWidget = new StandingOrderWidget();
				standingOrderWidget.open();			
			});
		});
		
		// Create the popup for the map
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
			
			//if the selection has changed and a time slider exists remove it
			if ($('#timeSlider').children().length != 0){
				self.removeTimeSlider();
			}
		});
		
		/** This handler shall be called after the user has chosen a dataset, 
		 * activated the timeslider checkbox and then selected a new dataset.
		 * It is used to creta e time slider for the dataset.
		 */
		DatasetSearch.on("datasetLoaded", function(){
			
			var useTimeSlider = DatasetSearch.get('useTimeSlider');
			if ( useTimeSlider  ) {
				self.addTimeSlider();
			}		
		});

		
		// Display the time slider in the bottom of the window when 
		// the useTimeSlider check box is checked unless destroy the widget and hide the timeslider element
		DatasetSearch.on('change:useTimeSlider', function() {
			var useTimeSlider = DatasetSearch.get('useTimeSlider');
			if ( useTimeSlider ) {
				self.addTimeSlider();

			}else{
				self.removeTimeSlider();
			}
		});
		
		
		// TODO : maybe find a better way for the default handler ?
		SelectHandler.start();

		// Connect with map feature picking
		Map.on('pickedFeatures', SearchResults.setSelection, SearchResults);
	
		// Connect search results events with map
		SearchResults.on('change',Map.setResults);
		SearchResults.on('zoomToProductExtent',Map.zoomToFeature);
		SearchResults.on('selectFeatures',Map.selectFeatures);
		SearchResults.on('unselectFeatures',Map.unselectFeatures);		
	},
	
	/** add the time slider to the bottom of the map view  and
	 * move the dataset message up */
	addTimeSlider : function(){
		$('#datasetMessage').css('bottom', '70px');
		$('#timeSlider').addClass('ui-timeSlider-container ');
		$('#timeSlider').dateRangeSlider({bounds: {min : DatasetSearch.getSliderStartDate(), max : DatasetSearch.getStopDate()},
										scaleBounds: {min : DatasetSearch.getSliderScaleDate(), max : DatasetSearch.getStopDate()},
										defaultValues : {min : DatasetSearch.getSliderStartDate(), max : DatasetSearch.getStopDate()}});
	},
	
	/** remove the time slider from the bottom of the map view  and
	 * move the dataset message down */
	removeTimeSlider : function(){
		$('#timeSlider').dateRangeSlider('destroy');
		$('#timeSlider').removeClass('ui-timeSlider-container ');
		$('#datasetMessage').css('bottom', '0px');
	} 
};

});
