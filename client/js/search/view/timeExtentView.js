var Configuration = require('configuration');
var SearchResults = require('searchResults/model/searchResults');
//require('jqm-datebox');
//require('ui/dateRangeSlider');
var dateCriteria_template = require('search/template/dateCriteriaContent');
require('ui/datetimepicker');

/**
 * The backbone model is DatasetSearch
 */
var TimeExtentView = Backbone.View.extend({

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
			this.model.set("start", Date.fromISOString($(event.currentTarget).val()));
		},
		'change .toDateInput': function(event) {
			this.model.set("stop", Date.fromISOString($(event.currentTarget).val()));
		},

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
				this.$el.find('[name="datetimeinput"]').datetimepicker('disable');
				this.addTimeSlider();
			} else {
				this.removeTimeSlider();
				// Enable the dates start and stop widgets if the time slider is disabled
				this.$el.find('input[type="text"]').datebox('enable');
				this.$el.find('[name="datetimeinput"]').datetimepicker('enable');
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

			// TODO: make the same thing with datetimepicker...
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

		// Update the model   
		this.model.set({  
			start: bounds.min,
			stop: bounds.max
		});

		this.updateDateTimePicker();

		// Launch a new search
		SearchResults.launch(this.model);
	},

	// Update datetimepicker widget with model's values
	updateDateTimePicker: function() {
		// Update the date inputs
		// this.$fromDateInput.val(this.model.get("start").toISODateString());
		// this.$toDateInput.val(this.model.get("stop").toISODateString());
		this.$el.find('.startDateTime').datetimepicker('option', {
			date: this.model.get("start"),
			time: this.model.get("startTime")
		});
		this.$el.find('.stopDateTime').datetimepicker('option', {
			date: this.model.get("stop"),
			time: this.model.get("stopTime")
		});
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

		this.updateDateTimePicker();

		if (this.$dateRangeSlider.length > 0) {
			this.$dateRangeSlider.dateRangeSlider('option', 'bounds', {
				min: this.model.get("start"),
				max: this.model.get("stop")
			});
		}
	},

	render: function() {

		var self = this;
		var content = dateCriteria_template({
			model: this.model,
			keyDates: JSON.stringify(Configuration.get("keyDates"))
		});
		this.$el.append(content);

		// Keep the DOM elements needed by the view
		// this.$fromDateInput = this.$el.find(".fromDateInput");
		// this.$toDateInput = this.$el.find(".toDateInput");
		this.$dateRangeSlider = $();

		// // Initialize datetime picker widgets
		this.$el.find('.startDateTime').datetimepicker({
			date: this.model.get("start"),
			time: this.model.get("startTime"),
			keyDates: JSON.stringify(Configuration.get("keyDates")),
			onUpdate: function(date, time) {
				self.model.set({
					"start": date,
					"startTime": time
				});
			}	
		});

		this.$el.find('.stopDateTime').datetimepicker({
			date: this.model.get("stop"),
			time: this.model.get("stopTime"),
			keyDates: JSON.stringify(Configuration.get("keyDates")),
			onUpdate: function(date, time) {
				self.model.set({
					"stop": date,
					"stopTime": time
				});
			}	
		});

		// Need to call create to disable the datebox when timeSlider is enabled by default
		this.$el.trigger('create');

		// Append time slider
		if (this.hasTimeSlider) {
			this.$el.append('<label class="useTimeSliderLabel">Use Time Slider<input type="checkbox" ' + (this.model.get('useTimeSlider') ? "checked" : "") + ' class="useTimeSliderCheckBox" data-mini="true"></label>');

			if (this.model.get("useTimeSlider")) {
				// Disable the dates start and stop widgets if the time slider is enabled
				this.$el.find('input[type="text"]').datebox("disable");
				this.$el.find('[name="datetimeinput"]').datetimepicker('disable');
			}
		}

		return this;
	}
});

module.exports = TimeExtentView;