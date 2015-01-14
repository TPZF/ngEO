

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults', 'text!search/template/dateCriteriaContent.html', 
         'jqm-datebox-calbox', 'ui/dateRangeSlider'], 
		function($, Backbone , Configuration, SearchResults, dateCriteria_template) {

	/**
	 * The backbone model is DatasetSearch
	 */
var TimeExtentView = Backbone.View.extend({

	initialize : function(options) {
			
		this.hasTimeSlider = options.hasTimeSlider;
		
		// Refresh the dates and time slider checkbox when the values has been changed on the model 
		//typically for shared parameters urls
		this.listenTo( this.model, "change:start", this.update);
		this.listenTo( this.model, "change:stop", this.update);						
	},
	
	events :{
		//The 2 next handlers listen to start and stop date changes
		'change .fromDateInput' : function(event){
			this.model.set({"start" : Date.fromISOString($(event.currentTarget).val()+"T00:00:00.000Z")});
		},
		'change .toDateInput' : function(event){
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
		'click .useTimeSliderLabel' : function(event){
			var $target = $(event.currentTarget);	
			var checked = $target.hasClass('ui-checkbox-off');
			this.model.set({"useTimeSlider" : checked});
					
			// Display the time slider in the bottom of the window when 
			if ( checked ) {
				//disable the dates start and stop widgets if the time slider is enabled
				this.$fromDateInput.datebox("disable");
				this.$toDateInput.datebox("disable");
				this.addTimeSlider();
			} else {
				this.removeTimeSlider();
				//enable the dates start and stop widgets if the time slider is disabled
				this.$fromDateInput.datebox("enable");
				this.$toDateInput.datebox("enable");
			} 
			
		}
		
	},
	
	// Call to update the date range
	updateDateRange: function(model,dateRange) {
		// The dataset has not been loaded : do nothing, because the timeslider has already been removed when the datasetId has been changed, see below.
		var useTimeSlider = this.model.get('useTimeSlider');
		if (dateRange)
		{
			if ( useTimeSlider  ) {
				this.addTimeSlider();
			}

			// Retrieve key dates from configuration.json
			var keyDates = Configuration.get("keyDates").slice(0);
			keyDates.push([(new Date()).toISODateString(), "Today"]);

			// Filter keyDates which aren't in range
			var startDate = dateRange.start;
			var stopDate = dateRange.validityStop;
			var i = keyDates.length;
			while(i--)
			{
				var keyDate = new Date(keyDates[i][0]);
				var inRange = (keyDate <= stopDate && keyDate >= startDate);
				if ( !inRange )
				{
					keyDates.splice(i, 1);
				}
			}

			// Add start/stop dates
			keyDates.push([startDate.toISODateString(), "Start dataset"]);
			keyDates.push([stopDate.toISODateString(), "Stop dataset"]);

			// Sort dates
			keyDates.sort(function(a,b){
				return new Date(a[0]) - new Date(b[0]);
			});
			
			var dateRangeOptions = {
				startYear: startDate.getFullYear(),
				endYear: stopDate.getFullYear(),
				calDateList: keyDates
			};
			this.$fromDateInput.datebox("option", dateRangeOptions );
			this.$toDateInput.datebox("option", dateRangeOptions );
		}
		else if ( useTimeSlider )
		{
			this.removeTimeSlider();
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
			scaleBounds: { min : this.model.get("dateRange").start, 
				max : this.model.get("dateRange").stop
			},
			change: $.proxy( this.onTimeSliderChanged, this )
		});
		
	},
	
	// Call when time slider has changed
	onTimeSliderChanged: function(bounds) {
		// Update the model
		// Silent to avoid double update
		this.model.set({
			start: bounds.min,
			stop: bounds.max
		}, {
			silent: true
		});
		// Update the inputs
		this.$fromDateInput.val( bounds.min.toISODateString() );
		this.$toDateInput.val( bounds.max.toISODateString() );
		
		// Launch a new search
		SearchResults.launch( this.model );
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

		var content = _.template(dateCriteria_template, { model: this.model, keyDates: JSON.stringify(Configuration.get("keyDates")) });
		this.$el.append(content);
		
		// Keep the DOM elements needed by the view
		this.$fromDateInput = this.$el.find(".fromDateInput");
		this.$toDateInput = this.$el.find(".toDateInput");
		this.$dateRangeSlider = $();
		
		// Need to call create to disable the datebox when timeSlider is enabled by default
		this.$el.trigger('create');
		
		
		// Append time slider
		if ( this.hasTimeSlider ) {
			this.$el.append('<label class="useTimeSliderLabel">Use Time Slider<input type="checkbox" '+ (this.model.get('useTimeSlider') ? "checked" : "") +' class="useTimeSliderCheckBox" data-mini="true" data-theme="c"></label>');

			if ( this.model.get("useTimeSlider") ) {
				//disable the dates start and stop widgets if the time slider is enabled
				this.$fromDateInput.datebox("disable");
				this.$toDateInput.datebox("disable");
			}
		}

		return this;
	}
		
});

return TimeExtentView;

});