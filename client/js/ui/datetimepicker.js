var datetime_template = require('ui/template/datetime_template');

/**
 * Datetimepicker widget
 */
$.widget("ngeo.datetimepicker", {

	// default options
	options: {

		// A theme to be applied, added as a class on the whole tab
		theme: "a",
		date: null,
		time: null,
		keyDates: [],

		// Callbacks
		onUpdate: null
	},

	// the constructor
	_create: function() {

		var self = this;

		// Add some container styling to input
		this.parentElement = this.element.wrap('\
			<div class="ui-input-text ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-a ui-mini"></div>');
		this.element.wrap('\
				<div class="ui-input-datebox ui-corner-all ui-mini ui-body-a" style="border: none;">')

		// Update styling to have the "edit" button on right
		this.element.after('<a href="#" class="ui-input-clear ui-btn ui-btn-up-a ui-shadow ui-btn-corner-all ui-btn-icon-notext" title="Open Date Picker" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-icon="clock" data-iconpos="notext" data-theme="a" style="vertical-align: middle; display: inline-block;">\
				<span class="ui-btn-inner">\
					<span class="ui-btn-text">Open Date Picker</span>\
					<span class="ui-icon ui-icon-clock ui-icon-shadow">&nbsp;</span>\
				</span>\
			</a>');
		this.element.addClass("ui-input-text ui-body-a")

		// Avoid jqm update out beautiful input
		this.element.attr("data-role", "none");

		// Open widget on click
		this.element.siblings('a').click(function() {
			// Popup body
			var $popup = $('<div data-role="popup" data-transition="flip" data-theme="a" id="datetimepickerPopup"></div>').appendTo('.ui-page-active');

			var datetime_content = $(datetime_template({
				date: self.options.date,
				time: self.options.time,
				keyDates: self.options.keyDates
			}));
			$popup.html(datetime_content).popup({
				afterclose: function(event, ui) {

					var date = $(this).find(".dateInput").val();
					var time = $(this).find(".timeInput").val();

					self.updateDateTimeFromPopup(date, time);
					self.refresh();

					if ( self.options.onUpdate ) {
						self.options.onUpdate(self.options.date, self.options.time);
					}
						
					$(this).remove();
					$popup = null;
				}
			});
			$popup.trigger("create");

			$popup.popup('open', {
				positionTo: self.element
			});
		});

		this.element.change(function(event) {
			self.updateDateTimeFromInput();
			if ( self.options.onUpdate ) {
				self.options.onUpdate(self.options.date, self.options.time);
			}
		});
	},

	updateDateTimeFromInput: function() {
		var datetime = Date.fromISOString(this.element.val());

		// TODO: check if parsable
		this.options.date.setUTCFullYear(datetime.getUTCFullYear());
		this.options.date.setUTCMonth(datetime.getUTCMonth());
		this.options.date.setUTCDate(datetime.getUTCDate());
		this.options.time.setUTCHours(datetime.getUTCHours());
		this.options.time.setUTCMinutes(datetime.getUTCMinutes());
		this.options.time.setUTCSeconds(datetime.getUTCSeconds());
		this.refresh();		
	},

	updateDateTimeFromPopup: function(date, time) {
		var isoDate = date+"T00:00:00.000Z";
		var modifiedDate = Date.fromISOString(isoDate);
		var isoDateTime = date+'T'+time+":00.000Z";
		var modifiedTime = Date.fromISOString(isoDateTime);

		this.options.date = modifiedDate;
		this.options.time = modifiedTime;
	},

	refresh: function() {
		this.element.val(this.options.date.toISODateString() +" "+this.options.time.toISODateString(true).split(" ")[1]);
	},

	disable: function() {
		this.element.parent().parent().addClass('ui-disabled');
	},

	enable: function() {
		this.element.parent().parent().removeClass('ui-disabled');
	},

	// events bound via _bind are removed automatically
	// revert other modifications here
	_destroy: function() {
		// TODO 
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	_setOptions: function() {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply(this, arguments);
		this.refresh();
	},

	// _setOption is called for each individual option that is changing
	_setOption: function(key, value) {
		// TODO : manage options?
		// in 1.9 would use _super
		$.Widget.prototype._setOption.call(this, key, value);
	}
});