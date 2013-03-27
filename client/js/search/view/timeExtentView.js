

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults', 'text!search/template/dateCriteriaContent.html', 
         'jqm-datebox-calbox', 'dateRangeSlider'], 
		function($, Backbone , Configuration, SearchResults, dateCriteria_template) {

	/**
	 * The backbone model is DatasetSearch
	 */
var TimeExtentView = Backbone.View.extend({

	initialize : function(options){
		// Refresh the dates and time slider checkbox when the values has been changed on the model 
		//typically for shared parameters urls
		this.listenTo( this.model, "change:start", this.update);
		this.listenTo( this.model, "change:stop", this.update);
		this.searchCriteriaView = options.searchCriteriaView;
		
		/** 
		 * This handler is called after the user has chosen a dataset, 
		 * activated the timeslider checkbox and then selected a new dataset.
		 * It is used to recreate time slider for the dataset.
		 */
		this.listenTo( this.model, "datasetLoaded", function(){
			
			var useTimeSlider = this.model.get('useTimeSlider');
			if ( useTimeSlider  ) {
				this.addTimeSlider();
			}		
		});
		
		/**
		 * This handler is called when the dataset has been changed and the time slider is active.
		 * Remove the time slider because the scale bounds needs to be changed
		 */
		this.listenTo( this.model, "change:datasetId", function(){
			//if the selection has changed and a time slider exists remove it
			if ($('#dateRangeSlider').length != 0){
				this.removeTimeSlider();
			}
		});
		
	},
	
	events :{
		//The 2 next handlers listen to start and stop date changes
		'change #fromDateInput' : function(event){
			this.model.set({"start" : Date.fromISOString($(event.currentTarget).val()+"T00:00:00.000Z")});
		},
		'change #toDateInput' : function(event){
			this.model.set({"stop" : Date.fromISOString($(event.currentTarget).val()+"T23:59:59.999Z")});
		},
/*		//the 2 following handlers deal with time setting: COMMENTED FOR THE MOMENT
		'change #fromTimeInput' : function(event){
			this.model.set({"startTime" : $(event.currentTarget).val()});
		},
		'change #toTimeInput' : function(event){
			this.model.set({"stopTime" : $(event.currentTarget).val()});
		},
*/		
		//check box changes to display or not the time slider widget
		'click #useTimeSliderLabel' : function(event){
			var $target = $(event.currentTarget);	
			var checked = $target.hasClass('ui-checkbox-off');
			this.model.set({"useTimeSlider" : checked});
					
			// Display the time slider in the bottom of the window when 
			if ( checked ) {
				//disable the dates start and stop widgets if the time slider is enabled
				$("#fromDateInput").datebox("disable");
				$("#toDateInput").datebox("disable");
				//disable the submit search button
				//this.searchCriteriaView.searchButton.button('disable');
				//hide the search criteria widget when the time slider is enabled
				//this is to keep the map visible 
				//this.searchCriteriaView.$el.ngeowidget('hide');
				this.addTimeSlider();
			} else {
				this.removeTimeSlider();
				
				//enable the dates start and stop widgets if the time slider is disabled
				$("#fromDateInput").datebox("enable");
				$("#toDateInput").datebox("enable");
				//this.searchCriteriaView.searchButton.button('enable');
			} 
			
		}
		
	},
	
	// Add the time slider to the map
	addTimeSlider: function() {
		var dateRangeSlider = $('<div id="dateRangeSlider"></div>').appendTo('#map');
		
		// Compute the range for the full time slider scale
		var width = Configuration.localConfig.timeSlider.scaleYearsWidth; 
		var scaleDate = new Date( this.model.get("stop").getTime() );
		scaleDate.setUTCFullYear( scaleDate.getUTCFullYear() - width );
		
		// Compute the range for time slider to begin, max to 1 month before the stop date
		// Reset the time to 0 to have the full day in the range
		var start = new Date( this.model.get("stop").getTime() - Configuration.localConfig.timeSlider.startRangeWidthInDays * 24 * 3600 * 1000 );
		start.setUTCHours(0);
		start.setUTCMinutes(0);
		start.setUTCSeconds(0);
		start.setUTCMilliseconds(0);
		this.model.set( "start", start );

		var self = this;
		dateRangeSlider.dateRangeSlider({
			boundsMaxLength: Configuration.localConfig.timeSlider.boundsMaxLength,
			boundsMinLength: Configuration.localConfig.timeSlider.boundsMinLength,
			bounds: { min : this.model.get("start"), 
				max : this.model.get("stop")
			},
			scaleBounds: { min : scaleDate, 
				max : this.model.get("stop")
			},
			change: function(bounds) {
					self.model.set({ start: bounds.min,
						stop: bounds.max });
					SearchResults.launch( self.model.getOpenSearchURL() );
				}
			});
	},
	
	// Remove the time slider
	removeTimeSlider: function() {
		$('#dateRangeSlider').remove();
	},
	
	update: function() {
		$('#fromDateInput').val( this.model.get("start").toISODateString() );
		$('#toDateInput').val( this.model.get("stop").toISODateString() );
		//Uncomment to use back times
//		$('#fromTimeInput').val( this.model.get("startTime") );
//		$('#toTimeInput').val( this.model.get("stopTime") );
	},
	
	render: function(){
		var content = _.template(dateCriteria_template, this.model);
		this.$el.append($(content));
		return this;
	}
		
});

return TimeExtentView;

});