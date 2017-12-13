var Configuration = require('configuration');
var SearchResults = require('searchResults/model/searchResults');
//var moment = require('moment');

//require('jqm-datebox');
//require('ui/dateRangeSlider');
var dateCriteria_template = require('search/template/dateCriteriaContent');

var ONE_DAY = 1000 * 60 * 60 * 24;
var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
var ONE_MONTH = 1000 * 60 * 60 * 24 * 30;
var ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

//the maximum time slider bounds (range) taken from conf, if not set then we wil take as one year for default
//means that at most the delta between min and max (time slider) is this value
var timeSliderBoundsMax = Configuration.localConfig.timeSlider.boundsMaxLength;
if (timeSliderBoundsMax) {
	//convert into milliseconds
	timeSliderBoundsMax = timeSliderBoundsMax * ONE_DAY;
} else {
	timeSliderBoundsMax = ONE_YEAR;
}

//the minimum time slider bounds (range) taken from conf, if not set then we wil take as one year for default
//means that at leat the delta between min and max (time slider) is this value
var timeSliderBoundsMin = Configuration.localConfig.timeSlider.boundsMinLength;
if (timeSliderBoundsMin) {
	timeSliderBoundsMin = timeSliderBoundsMin * ONE_DAY;
} else {
	timeSliderBoundsMin = ONE_DAY;
}

/** 
 * Validate input date
 * 
 * @param value the value to validate
 * @param format the format of the date to validate
 * @return true if the entered value is valid date of format passed in parameter
 * 		   false otherwise
*/
var isValidDate = function (value, format) {
	var aDate = moment(value, format, true);
	return aDate.isValid();
}

/**
 * We check if the new value entered in this componenet is valid.
 * If not then we will force the new value to be the last one (i.e. lastValidDate)
 * @param theComponent the input date component, in order to revert its value if eneterd date is not valid
 * @param lastValidDate the last valid value of this componenent. If the new value is not correct then we will set the value of this comoenent to be this one
 * @return true if the component entered value was valid
 * 		   false if the component entered value was not valid and the component value was forced to be the last valid one
 */
var validateDateComponentInput = function (theComponent, lastValidDate) {
	var valueToValidate = theComponent.val();
	var componentValueWasNotForcedToLastValidDate = true;
	if (!isValidDate(valueToValidate, 'YYYY-MM-DD')) {
		theComponent.val(lastValidDate);
		componentValueWasNotForcedToLastValidDate = false;
	}
	return componentValueWasNotForcedToLastValidDate;
}


/**
 * The backbone model is DatasetSearch
 */
var TimeExtentView = Backbone.View.extend({

	initialize: function (options) {

		this.hasTimeSlider = options.hasTimeSlider;

		// Refresh the dates and time slider checkbox when the values has been changed on the model 
		//typically for shared parameters urls
		this.listenTo(this.model, "change:start", this.update);
		this.listenTo(this.model, "change:stop", this.update);

		// Add events
		_.extend(this, Backbone.Events);
	},

	events: {
		//The 2 next handlers listen to start and stop date changes
		'change .fromDateInput': function (event) {
			//validate the new entered value
			if (validateDateComponentInput(this.$fromDateInput, this.model.get("start").toISODateString())) {
				if (this.model.get("start").toISODateString() != $(event.currentTarget).val()) {
					this.model.set({
						"start": Date.fromISOString($(event.currentTarget).val() + "T00:00:00.000Z")
					});
				}
			}
		},
		'change .toDateInput': function (event) {
			//validate the new entered value
			if (validateDateComponentInput(this.$toDateInput, this.model.get("stop").toISODateString())) {
				if (this.model.get("stop").toISODateString() != $(event.currentTarget).val()) {
					this.model.set({
						"stop": Date.fromISOString($(event.currentTarget).val() + "T23:59:59.999Z")
					});
				}
			}
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
		'click .useTimeSliderLabel': function (event) {
			var $target = $(event.currentTarget);
			var checked = $target.hasClass('ui-checkbox-off');
			this.model.set({
				"useTimeSlider": checked
			});

			// Display the time slider in the bottom of the window when 
			if (checked) {
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
	updateDateRange: function (model, dateRange) {
		// The dataset has not been loaded : do nothing, because the timeslider has already been removed when the datasetId has been changed, see below.
		var useTimeSlider = this.model.get('useTimeSlider');
		if (dateRange) {
			if (useTimeSlider) {
				this.addTimeSlider();
			}

			// Retrieve key dates from configuration.json
			var keyDates = Configuration.get("keyDates").slice(0);
			keyDates.push([(new Date()).toISODateString(), "Today"]);

			// Filter keyDates which aren't in range
			var startDate = dateRange.start;
			var stopDate = dateRange.stop;
			var i = keyDates.length;
			while (i--) {
				var keyDate = new Date(keyDates[i][0]);
				var inRange = (keyDate <= stopDate && keyDate >= startDate);
				if (!inRange) {
					keyDates.splice(i, 1);
				}
			}

			// Add start/stop dates
			keyDates.push([startDate.toISODateString(), "Start dataset"]);
			keyDates.push([stopDate.toISODateString(), "Stop dataset"]);

			// Sort dates
			keyDates.sort(function (a, b) {
				return new Date(a[0]) - new Date(b[0]);
			});

			var dateRangeOptions = {
				startYear: startDate.getFullYear(),
				endYear: stopDate.getFullYear(),
				calDateList: keyDates
			};

			if (this.model.get("dateRange")) {
				this.$fromDateInput.datebox("option", Object.assign(dateRangeOptions, {
					calYearPickMin: this.model.get("start").getFullYear() - this.model.get("dateRange").start.getFullYear(),
					calYearPickMax: this.model.get("dateRange").stop.getFullYear() - this.model.get("start").getFullYear()
				})).datebox("refresh");
				this.$toDateInput.datebox("option", Object.assign(dateRangeOptions, {
					calYearPickMin: this.model.get("stop").getFullYear() - this.model.get("dateRange").start.getFullYear(),
					calYearPickMax: this.model.get("dateRange").stop.getFullYear() - this.model.get("stop").getFullYear()
				})).datebox("refresh");
			}
		} else if (useTimeSlider) {
			this.removeTimeSlider();
		}
	},

	// Add the time slider to the map
	addTimeSlider: function () {

		this.$dateRangeSlider = $('#dateRangeSlider');
		this.$dateRangeSlider.dateRangeSlider('option', {
			boundsMaxLength: Configuration.localConfig.timeSlider.boundsMaxLength,
			boundsMinLength: Configuration.localConfig.timeSlider.boundsMinLength,
			bounds: {
				min: this.model.get("start"),
				max: this.model.get("stop")
			},
			scaleBounds: {
				min: this.model.get("dateRange").start,
				max: this.model.get("dateRange").stop
			},
			change: $.proxy(this.onTimeSliderChanged, this)
		});

		this.$dateRangeSlider.dateRangeSlider('show');
	},

	// Call when time slider has changed
	onTimeSliderChanged: function (bounds) {
		// Update the model
		// Silent to avoid double update
		this.model.set({
			start: bounds.min,
			stop: bounds.max
		});
		// Update the inputs
		this.$fromDateInput.val(bounds.min.toISODateString());
		this.$toDateInput.val(bounds.max.toISODateString());

		// Launch a new search
		SearchResults.launch(this.model);
	},

	// Remove the time slider
	removeTimeSlider: function () {

		var self = this;
		this.$dateRangeSlider.dateRangeSlider('hide', function () {
			// self.$dateRangeSlider.dateRangeSlider('destroy');
			self.$dateRangeSlider = $();
			self.trigger("removeTimeSlider");

			// Hack : update panel size when slider has been hidden
			$(window).trigger('resize');
		});
	},

	/** 
	 * Update the view when the model has changed
	 * @see http://cdsv3.cs.telespazio.it/jira/browse/NGEOL-54
	*/
	update: function () {
		if (this.model.get("dateRange")) {
			//explained already here "http://cdsv3.cs.telespazio.it/jira/browse/NGEOL-54"
			//the actual selected start date
			var startDate = this.model.get("start");
			//take the previous start date
			//this is used to check wether the change comes from the start date widget or stop date widget
			//if the previous start date is same as the actual start date then it means that the date range was changed from the stop date widget
			var previousStartDate = this.model._previousAttributes.start;
			//the actual selected stop date
			var stopDate = this.model.get("stop");
			//take the previous stop date
			//this is used to check wether the change comes from the start date widget or stop date widget
			//if the previous stop date is same as the actual stop date then it means that the date range was changed from the stop date widget
			var previousStopDate = this.model._previousAttributes.stop;
			//The minimum date down which you cannot go (this information is from backend for a given dataset)
			var minDate = Date.fromISOString(this.model.get("dateRange").start.toISODateString() + "T00:00:00.000Z")
			//The maximum date beyond which you cannot go (this information is from backend for a given dataset)
			var maxDate = Date.fromISOString(this.model.get("dateRange").stop.toISODateString() + "T23:59:59.999Z")
			//This is the range between the min date and max date
			//this variable is used whenever we pick a date from start date widget or stop date widget
			//we add or remove depending on the use case we have (for exmaple we select a start date before min date ...)
			var DELTA = maxDate.getTime() - minDate.getTime();
			//as we have limitation on the date time slider (yes date time slider and date start and stop widget are synchronized)
			//we cannot have this limit that exceed "timeSliderBoundsMax" that is why we calculate it here
			if (DELTA > timeSliderBoundsMax) {
				DELTA = timeSliderBoundsMax;
			}
			//at least we should have ""timeSliderBoundsMin" limitation according to the date time slider widget limitation
			if (DELTA < timeSliderBoundsMin) {
				DELTA = timeSliderBoundsMin;
			}

			if (startDate > maxDate) {
				//if start date was selected after the max date then we set the stop date to be the max date and start date minus timeSliderBoundsMin
				//why? to be the more close possible from the date user has choosen
				startDate = new Date(maxDate.getTime() - timeSliderBoundsMin);
				stopDate = maxDate;
			} else if (startDate < minDate) {
				//force the start date to be the min date
				startDate = minDate;
				//check if the start date is beyond the limitaton, if so take the limit
				if (stopDate.getTime() - startDate.getTime() > DELTA) {
					stopDate = new Date(minDate.getTime() + DELTA);
				}
			} else if (stopDate < minDate) {
				//if the stop date choosed is before the min date date, then set the start date to be the min date and add "timeSliderBoundsMin" for the stop date
				//this is done in order to be as closest as possible from the user's request 
				startDate = minDate;
				stopDate = new Date(minDate.getTime() + timeSliderBoundsMin);
			} else if (stopDate > maxDate) {
				//force the stop date to be the max one if choosen date is beyond
				stopDate = maxDate;
				//check if the start date and stop date have reached the limitation, if so then set the start date to be DELTA before (always because of our limitation)
				if (stopDate.getTime() - startDate.getTime() > DELTA) {
					startDate = new Date(stopDate.getTime() - DELTA);
				}
			} else if ((stopDate - startDate >= DELTA) || (startDate > stopDate)) {
				if (previousStartDate == startDate) {
					//change comes from the stop date widget as the start date has not change
					//set the start date to be the limitation because user has choosed the stop date
					//so set the start date to be coherent with our limitation
					startDate = new Date(stopDate.getTime() - DELTA);
					//check if the start date is below the min date, if so then set it as the min date from which he cannot go below
					if (startDate < minDate) {
						startDate = minDate;
					}
				} else {
					//change comes from the start date widget
					//set the stop date to be the limitation because user has choosed the start date
					//so set the stop date to be coherent with our limitation
					stopDate = new Date(startDate.getTime() + DELTA);
					//check if the stop date is beyond the max date, if so then set it as the max date from which you cannot go beyond
					if (stopDate > maxDate) {
						stopDate = maxDate;
					}
				}
			}
			this.model.set({
				"start": Date.fromISOString(startDate.toISODateString() + "T00:00:00.000Z"),
				"stop": Date.fromISOString(stopDate.toISODateString() + "T23:59:59.999Z")
			});

			this.$fromDateInput.val(this.model.get("start").toISODateString());
			this.$toDateInput.val(this.model.get("stop").toISODateString());
			if (this.$dateRangeSlider.length > 0) {
				this.$dateRangeSlider.dateRangeSlider('option', 'bounds', {
					min: this.model.get("start"),
					max: this.model.get("stop")
				});
			}

			this.$fromDateInput.datebox("option", {
				calYearPickMin: this.model.get("start").getFullYear() - this.model.get("dateRange").start.getFullYear(),
				calYearPickMax: this.model.get("dateRange").stop.getFullYear() - this.model.get("start").getFullYear()
			}).datebox("refresh");
			this.$toDateInput.datebox("option", {
				calYearPickMin: this.model.get("stop").getFullYear() - this.model.get("dateRange").start.getFullYear(),
				calYearPickMax: this.model.get("dateRange").stop.getFullYear() - this.model.get("stop").getFullYear()
			}).datebox("refresh");
		}
		//Uncomment to use back times
		//		$('#fromTimeInput').val( this.model.get("startTime") );
		//		$('#toTimeInput').val( this.model.get("stopTime") );
	},

	render: function () {

		var content = dateCriteria_template({
			model: this.model,
			keyDates: JSON.stringify(Configuration.get("keyDates"))
		});
		this.$el.append(content);

		// Keep the DOM elements needed by the view
		this.$fromDateInput = this.$el.find(".fromDateInput");
		this.$toDateInput = this.$el.find(".toDateInput");
		this.$dateRangeSlider = $();

		// Need to call create to disable the datebox when timeSlider is enabled by default
		this.$el.trigger('create');
		this.$fromDateInput.datebox();
		this.$toDateInput.datebox();

		// Append time slider
		if (this.hasTimeSlider) {
			this.$el.append('<label class="useTimeSliderLabel">Use Time Slider<input type="checkbox" ' + (this.model.get('useTimeSlider') ? "checked" : "") + ' class="useTimeSliderCheckBox" data-mini="true"></label>');

			if (this.model.get("useTimeSlider")) {
				//disable the dates start and stop widgets if the time slider is enabled
				this.$fromDateInput.datebox("disable");
				this.$toDateInput.datebox("disable");
			}
		}

		return this;
	}
});

module.exports = TimeExtentView;