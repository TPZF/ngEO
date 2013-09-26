

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
		 * This handler is called after the user has chosen a dataset, and the dataset has been loaded.
		 * It is used to recreate time slider for the dataset.
		 */
		this.listenTo( this.model, "change:dataset", function(dataset) {
			
			// The dataset has not been loaded : do nothing, because the timeslider has already been removed when the datasetId has been changed, see below.
			if (!dataset)
				return;
				
			var useTimeSlider = this.model.get('useTimeSlider');
			if ( useTimeSlider  ) {
				this.addTimeSlider();
			}
			
			var dateRangeOptions = {
				startYear: this.model.dataset.get("startDate").getFullYear(),
				endYear: this.model.dataset.get("endDate").getFullYear()
			};
			this.$fromDateInput.datebox("option", dateRangeOptions );
			this.$toDateInput.datebox("option", dateRangeOptions );

		});
		
		/**
		 * This handler is called when the dataset has been changed and the time slider is active.
		 * Remove the time slider because the scale bounds needs to be changed, and the user cannot do an automatic search
		 */
		this.listenTo( this.model, "change:datasetId", function(){
			//if the selection has changed and a time slider exists remove it
			if ( this.$dateRangeSlider.length != 0){
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
				this.$fromDateInput.datebox("disable");
				this.$toDateInput.datebox("disable");
				//disable the submit search button
				//this.searchCriteriaView.searchButton.button('disable');
				//hide the search criteria widget when the time slider is enabled
				//this is to keep the map visible 
				//this.searchCriteriaView.$el.ngeowidget('hide');
				this.addTimeSlider();
			} else {
				this.removeTimeSlider();
				
				//enable the dates start and stop widgets if the time slider is disabled
				this.$fromDateInput.datebox("enable");
				this.$toDateInput.datebox("enable");
				//this.searchCriteriaView.searchButton.button('enable');
			} 
			
		}
		
	},
	
	// Add the time slider to the map
	addTimeSlider: function() {
		
		this.$dateRangeSlider = $('#dateRangeSlider');
		this.$dateRangeSlider.dateRangeSlider({
			boundsMaxLength: Configuration.localConfig.timeSlider.boundsMaxLength,
			boundsMinLength: Configuration.localConfig.timeSlider.boundsMinLength,
			bounds: { min : this.model.get("start"), 
				max : this.model.get("stop")
			},
			scaleBounds: { min : this.model.dataset.get("startDate"), 
				max : this.model.dataset.get("endDate")
			},
			change: $.proxy( this.onTimeSliderChanged, this )
		});
		
	},
	
	// Call when time slider has changed
	onTimeSliderChanged: function(bounds) {
		// Update the model
		// Silent to avoid double update
		this.model.set({ start: bounds.min,
			stop: bounds.max }, {
				silent: true
			});
		// Update the inputs
		this.$fromDateInput.val( bounds.min.toISODateString() );
		this.$toDateInput.val( bounds.max.toISODateString() );
		
		// Launch a new search
		SearchResults.launch( this.model.getOpenSearchURL() );
	},
	
	// Remove the time slider
	removeTimeSlider: function() {
		this.$dateRangeSlider.dateRangeSlider('destroy');
		this.$dateRangeSlider = $();
	},
	
	// Update the view when the model has changed
	update: function() {
		this.$fromDateInput.val( this.model.get("start").toISODateString() );
		this.$toDateInput.val( this.model.get("stop").toISODateString() );
		
		if ( this.$dateRangeSlider.length > 0 ) {
			this.$dateRangeSlider.dateRangeSlider('option','bounds', { 
				min : this.model.get("start"), 
				max : this.model.get("stop")
			});
		}
		//Uncomment to use back times
//		$('#fromTimeInput').val( this.model.get("startTime") );
//		$('#toTimeInput').val( this.model.get("stopTime") );
	},
	
	render: function(){
		var content = _.template(dateCriteria_template, this.model);
		this.$el.append(content);
		
		// Keep the DOM elements needed by the view
		this.$fromDateInput = this.$el.find("#fromDateInput");
		this.$toDateInput = this.$el.find("#toDateInput");
		this.$dateRangeSlider = $();
		
		// Need to call create to disable the datebox when timeSlider is enabled by default
		this.$el.trigger('create');

		if ( this.model.get("useTimeSlider") ) {
			//disable the dates start and stop widgets if the time slider is enabled
			this.$fromDateInput.datebox("disable");
			this.$toDateInput.datebox("disable");
		}

		return this;
	}
		
});

return TimeExtentView;

});