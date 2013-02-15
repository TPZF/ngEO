

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
		this.model.on("change:start", this.update, this);
		this.model.on("change:stop", this.update, this);
		this.searchCriteriaView = options.searchCriteriaView;
	},
	
	events :{
		//The 2 next handlers listen to start and stop date changes
		'change #fromDateInput' : function(event){
			this.model.set({"start" : Date.fromISOString($(event.currentTarget).val()+"T00:00:00.000Z")});
		},
		'change #toDateInput' : function(event){
			this.model.set({"stop" : Date.fromISOString($(event.currentTarget).val()+"T23:59:59.999Z")});
		},
		//the 2 following handlers deal with time setting: COMMENTED FOR THE MOMENT
		'change #fromTimeInput' : function(event){
			//this.model.set({"startTime" : $(event.currentTarget).val()});
		},
		'change #toTimeInput' : function(event){
			//this.model.set({"stopTime" : $(event.currentTarget).val()});
		},
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
				
				var dateRangeSlider = $('<div id="dateRangeSlider"></div>').appendTo('#map');
				
				var width = Configuration.localConfig.timeSlider.scaleYearsWidth; 
				var scaleDate = new Date( this.model.get("stop").getTime() );
				scaleDate.setUTCFullYear( scaleDate.getUTCFullYear() - width );
				
				this.model.set( "start", new Date( this.model.get("stop").getTime() - 31 * 24 * 3600 * 1000 ) );

				var self = this;
				dateRangeSlider.dateRangeSlider({
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
				$('#datasetMessage').css('bottom', dateRangeSlider.outerHeight() + 12);
			} else {
			
				$('#dateRangeSlider').remove();
				$('#datasetMessage').css('bottom', '0px');
				
				//enable the dates start and stop widgets if the time slider is disabled
				$("#fromDateInput").datebox("enable");
				$("#toDateInput").datebox("enable");
				//this.searchCriteriaView.searchButton.button('enable');
			} 
			
		}
		
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