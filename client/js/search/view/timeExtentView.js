var Configuration = require('configuration');
var SearchResults = require('searchResults/model/searchResults');
//require('jqm-datebox');
//require('ui/dateRangeSlider');
var dateCriteria_template = require('search/template/dateCriteriaContent');

/**
 *	Extract time from the given ISO date 
 *
 *	@param isoDate Date in ISO format (ex: 2005/07/07T03:14:15Z)
 *	@return time in following format: "HH:MM" (ex: 03:14)
 */
var _buildTime = function(isoDate) {
	var time = isoDate.split(" ")[1];
	return time.substr(0, time.lastIndexOf(":")); // Cut seconds since jqm widget handles H:M only
};

/**
 * The backbone model is DatasetSearch
 */
var TimeExtentView = Backbone.View.extend({

	/**
	 *	Set Y/M/D only for the given date attribute in model
	 *
	 *	@param newDate {Date} containing new year/month/day to update
	 *	@param attribute {string} "start" or "stop"
	 *
	 */
	_setDate: function(newDate, attribute) {
		var prevDate = this.model.get(attribute);
		this.model.set(attribute, new Date(Date.UTC( newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), prevDate.getUTCHours(), prevDate.getUTCMinutes(), prevDate.getUTCSeconds() )));
	},

	/**
	 *	Set H:M:S for the given date attribute in model
	 *
	 *	@param newTime {String} containing new hour:minute:second to update
	 *	@param attribute {string} "start" or "stop"
	 */
	_setTime: function(newTime, attribute) {
		var prevDate = this.model.get(attribute);
		var time = newTime.split(':');
		this.model.set(attribute, new Date(Date.UTC( prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate(), time[0], time[1], time[2] )));
	},

	initialize: function(options) {

		this.hasTimeSlider = options.hasTimeSlider;

		// Refresh the dates and time slider checkbox when the values has been changed on the model 
		// typically for shared parameters urls
		this.listenTo(this.model, "change:start", this.update);
		this.listenTo(this.model, "change:stop", this.update);

		// Add events
		_.extend(this, Backbone.Events);
	},

	events: {
		// The 2 next handlers listen to start and stop date changes
		'change .fromDateInput': function(event) {
			this._setDate(Date.fromISOString($(event.currentTarget).val()), "start");
		},
		'change .toDateInput': function(event) {
			this._setDate(Date.fromISOString($(event.currentTarget).val()), "stop");
		},

		//The 2 following handlers deal with time setting: COMMENTED FOR THE MOMENT
		/*
		'change #fromTimeInput': function(event) {
			this._setTime($(event.currentTarget).val()+":00", "start");
		},

		'change #toTimeInput': function(event) {
			this._setTime($(event.currentTarget).val()+":59", "stop");
		},
		*/

		// Check box changes to display or not the time slider widget
		'click .useTimeSliderLabel': function(event) {
			var $target = $(event.currentTarget);
			var checked = $target.hasClass('ui-checkbox-off');
			this.model.set({
				"useTimeSlider": checked
			});

			// Display the time slider in the bottom of the window when 
			if (checked) {
				// Disable the dates start and stop widgets if the time slider is enabled
				this.$el.find('input[type="text"]').datebox('disable');
				this.addTimeSlider();
			} else {
				this.removeTimeSlider();
				// Enable the dates start and stop widgets if the time slider is disabled
				this.$el.find('input[type="text"]').datebox('enable');
			}

		}

	},

	// Call to update the date range
	updateDateRange: function(model, dateRange) {
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
			keyDates.sort(function(a, b) {
				return new Date(a[0]) - new Date(b[0]);
			});

			var dateRangeOptions = {
				startYear: startDate.getFullYear(),
				endYear: stopDate.getFullYear(),
				calDateList: keyDates
			};
			this.$fromDateInput.datebox("option", dateRangeOptions);
			this.$toDateInput.datebox("option", dateRangeOptions);
		} else if (useTimeSlider) {
			this.removeTimeSlider();
		}
	},

	// Add the time slider to the map
	addTimeSlider: function() {

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
	onTimeSliderChanged: function(bounds) {

		// Update model
		this._setDate(bounds.min, "start");
		this._setDate(bounds.max, "stop");

		// Update the date inputs
		this.$fromDateInput.val(this.model.get("start").toISODateString());
		this.$toDateInput.val(this.model.get("stop").toISODateString());

		// Launch a new search
		SearchResults.launch(this.model);
	},

	// Remove the time slider
	removeTimeSlider: function() {

		var self = this;
		this.$dateRangeSlider.dateRangeSlider('hide', function() {
			// self.$dateRangeSlider.dateRangeSlider('destroy');
			self.$dateRangeSlider = $();
			self.trigger("removeTimeSlider");

			// Hack : update panel size when slider has been hidden
			$(window).trigger('resize');
		});
	},

	// Update the view when the model has changed
	update: function() {
		this.$fromDateInput.val(this.model.get("start").toISODateString());
		this.$toDateInput.val(this.model.get("stop").toISODateString());

		if (this.$dateRangeSlider.length > 0) {
			this.$dateRangeSlider.dateRangeSlider('option', 'bounds', {
				min: this.model.get("start"),
				max: this.model.get("stop")
			});
		}

		// Uncomment when time input should be updated
		/*
		this.$el.find('#fromTimeInput').val(_buildTime(this.model.get("start").toISODateString(true)));
		this.$el.find('#toTimeInput').val(_buildTime(this.model.get("stop").toISODateString(true)));
		*/
	},

	render: function() {

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
		// this.$fromDateInput.datebox();
		// this.$toDateInput.datebox();

		// Append time slider
		if (this.hasTimeSlider) {
			this.$el.append('<label class="useTimeSliderLabel">Use Time Slider<input type="checkbox" ' + (this.model.get('useTimeSlider') ? "checked" : "") + ' class="useTimeSliderCheckBox" data-mini="true"></label>');

			if (this.model.get("useTimeSlider")) {
				// Disable the dates start and stop widgets if the time slider is enabled
				this.$el.find('input[type="text"]').datebox("disable");
			}
		}

		return this;
	}
});

module.exports = TimeExtentView;