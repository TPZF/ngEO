/**
 * define(['jquery','jquery.mobile','externs/jquery.mousewheel'], function($) {
 */

// Helper functions
function getDaysBetween(date1, date2) {
	return Math.floor((date1 - date2) / 86400000);
};

function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

// For month representation
var monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The date slider
 */
$.widget("ui.dateRangeSlider", {
	// default options
	options: {
		// parameters
		scaleBounds: null,
		bounds: null,
		boundsMaxLength: 180, // 3 months
		boundsMinLength: 10, // 10 days
		wheelFactor: 7,
		wheelTimeout: 1000,

		// events
		change: $.noop
	},

	// the constructor
	_create: function () {

		var self = this;

		this.scalePosition = 0;

		// Create left and right arrows
		this.rightArrow = $('<div style="display: none;" class="dateSlider-rightArrow"></div>')
			.appendTo(this.element)
			.mousedown(function (event) {
				self.autoScaleDirection = self.options.wheelFactor;
				setTimeout($.proxy(self._autoScaleScroll, self), 50);
			})
			.mouseup($.proxy(this._onArrowMouseUp, this));

		this.leftArrow = $('<div style="display: none;" class="dateSlider-leftArrow"></div>')
			.appendTo(this.element)
			.mousedown(function (event) {
				self.autoScaleDirection = -self.options.wheelFactor;
				setTimeout($.proxy(self._autoScaleScroll, self), 50);
			})
			.mouseup($.proxy(this._onArrowMouseUp, this));


		// Create the bar that defines the date range
		this.dragBar = $('<div style="display: none;" class="dateSlider-bar"></div>')
			.appendTo(this.element)
			.mousedown(function (event) {
				$(document).on('mousemove', {
					lastX: event.pageX
				}, $.proxy(self._onDragBar, self));
				$(document).on('mouseup', $.proxy(self._onDragBarStop, self));
				event.preventDefault();
			});

		// Create the labels of the start and end date
		this.startLabel = $('<div style="display: none;" class="dateSlider-label"></div>')
			.appendTo(this.element)
			.mousedown(function (event) {
				$(document).on('mousemove', {
					lastX: event.pageX
				}, $.proxy(self._moveLeftDrag, self));
				$(document).one('mouseup', function () {
					$(document).off('mousemove', $.proxy(self._moveLeftDrag, self));
					self.options.change(self._computeCurrentDate());
				});
			});
		this.endLabel = $('<div style="display: none;" class="dateSlider-label"></div>')
			.appendTo(this.element)
			.mousedown(function (event) {
				$(document).on('mousemove', {
					lastX: event.pageX
				}, $.proxy(self._moveRightDrag, self));
				$(document).one('mouseup', function () {
					$(document).off('mousemove', $.proxy(self._moveRightDrag, self));
					self.options.change(self._computeCurrentDate());
				});
			});

		// Create a container for the scale bar, needed to manage scrolling
		this.container = $('<div class="dateSlider-container"></div>').appendTo(this.element);
		this.marginLeft = parseInt(this.container.css('marginLeft'));

		// Create the scale bar
		this._createScaleBar();

		// Get the initial scale postion
		this.scalePosition = this.container.scrollLeft();

		this.wheelTimeoutVar = null;
		this.element.on("mousewheel", $.proxy(this._onMouseWheel, this));

		// Cache the container width
		this.containerWidth = this.container.width();

		// Initialize dragging
		this._updateDragBar();

		this.show();
	},

	// Refresh the date range slider when container width have changed
	refresh: function (force) {
		var cw = this.container.width();
		if (cw != this.containerWidth || force) {
			this.containerWidth = cw;
			// Get the scale position
			this.scalePosition = this.container.scrollLeft();
			if (this.scalePosition + cw > this.maxDays) {
				this.scalePosition = this.maxDays - cw;
				this.container.scrollLeft(this.scalePosition);
			}
			// Update the drag bar
			this._moveDrag(0);
		}
	},

	// Call when mouse up on an arrow
	_onArrowMouseUp: function () {
		this.autoScaleDirection = 0;
		this.options.change(this._computeCurrentDate());
	},

	// On mouse wheel event handler
	_onMouseWheel: function (event) {
		var delta = Math.max(-1, Math.min(1, (event.originalEvent.wheelDelta || -event.originalEvent.detail)));
		this._moveDrag(delta * this.options.wheelFactor);

		// Call change after a few milliseconds
		if (this.options.change) {
			if (this.wheelTimeoutVar) {
				clearTimeout(this.wheelTimeoutVar);
			}
			var self = this;
			this.wheelTimeoutVar = setTimeout(function () {
				self.options.change(self._computeCurrentDate());
				self.wheelTimeoutVar = null;
			}, this.options.wheelTimeout);
		}
	},

	// Update the drag bar position
	_updateDragBar: function () {
		this.dragLeftDays = getDaysBetween(this.options.bounds.min, this.minDate);
		this.dragRightDays = getDaysBetween(this.options.bounds.max, this.minDate);

		// Check if length is valid, otherwise modify it
		var boundsLength = this.dragRightDays - this.dragLeftDays;
		if (boundsLength > this.options.boundsMaxLength) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMaxLength;
			//this.options.change( this._computeCurrentDate() ); 
		} else if (boundsLength < this.options.boundsMinLength) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMinLength;
			//this.options.change( this._computeCurrentDate() ); 
		}

		// Just for look&feel: set dragbar width min to 1 to keep it visible for user
		var dragBarWidth = this.dragRightDays - this.dragLeftDays;
		if (dragBarWidth == 0) {
			dragBarWidth += 1;
		}

		this.dragBar.width(dragBarWidth);
		this._moveDrag(0);
	},

	// Create the scale
	_createScaleBar: function () {

		this.container.empty();

		var scale = $('<div class="dateSlider-scale"></div>');

		var scaleMin = this.options.scaleBounds && this.options.scaleBounds.min ? this.options.scaleBounds.min : this.options.bounds.min;
		var scaleMax = this.options.scaleBounds && this.options.scaleBounds.max ? this.options.scaleBounds.max : this.options.bounds.max;

		var startYear = parseInt(scaleMin.getUTCFullYear());
		var endYear = parseInt(scaleMax.getUTCFullYear());

		// // HACK : try to have the time slider big enough for the screen
		// if (endYear - startYear < 6) {
		// 	startYear = endYear - 6;
		// }
		// Even a better HACK : currently not handle dynamically the startYear
		// --> some problems when dataset has been checked/unchecked, so put a const year
		startYear = 1978;

		this.minDate = new Date(Date.UTC(startYear, 0, 1, 0, 0, 0));
		var maxDate = new Date(Date.UTC(endYear, 12, 31));

		// Compute the min/max days to limit the scale bar scrolling
		this.maxDays = getDaysBetween(scaleMax, this.minDate);
		this.minDays = getDaysBetween(scaleMin, this.minDate);

		var monthDay = ["31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"];
		for (var i = startYear; i <= endYear; i++) {
			var isBissextile = ((i % 4) == 0) && ((i % 400) != 0);
			scale.append('<span class="dateSlider-year dateSlider-y' + (isBissextile ? 'bi' : 'n') + '">' + i + '</span>');
			for (var j = 2; j < 12; j++) {
				scale.append('<span class="dateSlider-month dateSlider-m' + monthDay[j] + '">' + monthArray[j] + '</span>');
			}
		}

		scale.css('width', getDaysBetween(maxDate, this.minDate));
		scale.on('selectstart', function () {
			return false;
		});

		// Add it to the DOM
		this.scaleBar = scale.appendTo(this.container);
	},

	// Move the left side of the drag bar
	_moveLeftDrag: function (event) {
		var days = event.pageX - event.data.lastX;
		this.dragLeftDays += days;

		if (this.dragLeftDays < this.scalePosition) {
			this.dragLeftDays = this.scalePosition;
		} else if (this.dragLeftDays < this.minDays) {
			this.dragLeftDays = this.minDays;
		}

		if (this.dragRightDays > this.dragLeftDays + this.options.boundsMaxLength) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMaxLength;
		} else if (this.dragLeftDays > this.dragRightDays - this.options.boundsMinLength) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMinLength;
		}

		this.dragBar.width(this.dragRightDays - this.dragLeftDays);
		var leftPos = this.dragLeftDays + this.marginLeft - this.scalePosition;
		this.dragBar.css('left', leftPos);

		this._updateLabels();

		event.data.lastX = event.pageX;

		event.preventDefault();
	},

	// Move the right side of the drag bar
	_moveRightDrag: function (event) {
		var days = event.pageX - event.data.lastX;
		this.dragRightDays += days;

		if (this.dragRightDays > this.scalePosition + this.containerWidth) {
			this.dragRightDays = this.scalePosition + this.containerWidth;
		} else if (this.dragRightDays > this.dragLeftDays + this.options.boundsMaxLength) {
			this.dragRightDays = this.dragLeftDays + this.options.boundsMaxLength;
		} else if (this.dragRightDays < this.dragLeftDays + this.options.boundsMinLength) {
			this.dragRightDays = this.dragLeftDays + this.options.boundsMinLength;
		}

		this.dragBar.width(this.dragRightDays - this.dragLeftDays);

		this._updateLabels();

		event.data.lastX = event.pageX;

		event.preventDefault();
	},

	// Compute the current date
	_computeCurrentDate: function () {
		return {
			min: new Date(this.minDate.getTime() + this.dragLeftDays * 86400000),
			max: new Date(this.minDate.getTime() + this.dragRightDays * 86400000/* + (3600 * 1000 * 24 - 1)*/)
		};
	},

	// Format a date
	_formatDate: function (date) {
		return pad(date.getUTCDate(), 2) + "-" + pad(monthArray[date.getUTCMonth()], 2) + "-" + date.getUTCFullYear();
	},

	// Update date labels
	_updateLabels: function () {

		var bounds = this._computeCurrentDate();
		// Update text
		this.startLabel.html(this._formatDate(bounds.min));
		this.endLabel.html(this._formatDate(bounds.max));

		//console.log("Updating to [" + bounds.min + " " + bounds.max +" ]");

		// Compute label position
		var leftPos = this.dragLeftDays + this.marginLeft - this.scalePosition;
		var rightPos = this.dragRightDays + this.marginLeft - this.scalePosition;

		var startLeft = leftPos - this.startLabel.outerWidth() / 2;
		var endLeft = rightPos - this.endLabel.outerWidth() / 2;
		if (startLeft + this.startLabel.outerWidth() > endLeft) {
			endLeft = leftPos + this.dragBar.width() / 2 + 1;
			startLeft = endLeft - 2 - this.startLabel.outerWidth();
		}

		this.startLabel.css({
			'left': startLeft,
			'top': -this.startLabel.outerHeight()
		});
		this.endLabel.css({
			'left': endLeft,
			'top': -this.startLabel.outerHeight()
		});
	},

	// Move the drag given the days number
	_moveDrag: function (days) {

		if (this.dragLeftDays + days <= this.minDays) {
			this.dragRightDays += this.minDays - this.dragLeftDays;
			this.dragLeftDays = this.minDays;
			$('.dateSlider-leftArrow').addClass('ui-disabled');
		} else if (this.dragRightDays + days >= this.maxDays) {
			this.dragLeftDays += this.maxDays - this.dragRightDays;
			this.dragRightDays = this.maxDays;
			$('.dateSlider-rightArrow').addClass('ui-disabled');
		} else {
			$('.dateSlider-leftArrow').removeClass('ui-disabled');
			$('.dateSlider-rightArrow').removeClass('ui-disabled');
			this.dragLeftDays += days;
			this.dragRightDays += days;
		}

		var scaleDelta = 0.0;
		if (this.dragRightDays > this.scalePosition + this.containerWidth) {
			scaleDelta = this.dragRightDays - (this.scalePosition + this.containerWidth);
		} else if (this.dragLeftDays < this.scalePosition) {
			scaleDelta = this.dragLeftDays - this.scalePosition;
		}

		if (scaleDelta != 0.0) {
			this.scalePosition += scaleDelta;
			this.container.scrollLeft(this.scalePosition);
		}

		var leftPos = this.dragLeftDays + this.marginLeft - this.scalePosition;

		this.dragBar.css('left', leftPos);

		this._updateLabels();
	},

	// To animate scale scrolling
	_autoScaleScroll: function () {
		if (this.autoScaleDirection != 0.0) {
			this._moveDrag(this.autoScaleDirection);
			setTimeout($.proxy(this._autoScaleScroll, this), 50);
		}
	},

	// Called when dragging the bar
	_onDragBar: function (event) {
		var rightBlock = (this.dragRightDays == this.scalePosition + this.containerWidth) && event.pageX > event.data.lastX;
		var leftBlock = (this.dragLeftDays == this.scalePosition) && event.pageX < event.data.lastX;

		if (!rightBlock && !leftBlock) {
			this._moveDrag(event.pageX - event.data.lastX);
			event.data.lastX = event.pageX;
			this.autoScaleDirection = 0.0;
		} else {
			this.autoScaleDirection = rightBlock ? this.options.wheelFactor : -this.options.wheelFactor;
			setTimeout($.proxy(this._autoScaleScroll, this), 50);
		}
	},

	// Called when the dragging the bar is stopped
	_onDragBarStop: function (event) {
		this.autoScaleDirection = 0.0;
		$(document).off('mousemove', $.proxy(this._onDragBar, this));
		$(document).off('mouseup', $.proxy(this._onDragBarStop, this));

		this.options.change(this._computeCurrentDate());
	},

	// revert other modifications here
	_destroy: function () {
		this.element.empty();
		this.element.off("mousewheel", $.proxy(this._onMouseWheel, this));
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	_setOptions: function () {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply(this, arguments);
		// TODO : refresh?
	},

	/**
	 *	Show date range slider by animating the height
	 */
	show: function (callback) {
		var self = this;
		//if (!self.element.height()) {
		setTimeout(function () {
			self.element.animate({
				height: 24
			}, 400, function () {
				$(self.element).find('> div').show();
				self.refresh(true);
			});
		}, 0);
		//}
	},

	/**
	 *	Hide date range slider by animating the height
	 */
	hide: function (callback) {
		var self = this;
		if (self.element.height()) {
			this.element.stop(true, true).animate({
				height: 0
			}, 400, function () {
				if (callback)
					callback();
				$(self.element).find('> div').not('.dateSlider-container').hide();
			});
		}
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	_setOptions: function () {
		// _super and _superApply handle keeping the right this-context
		this._superApply(arguments);
		this.refresh();
	},

	// _setOption is called for each individual option that is changing
	_setOption: function (key, value) {

		switch (key) {
			case 'bounds':
				if (value.min != this.options.bounds.min || value.max != this.options.bounds.max) {
					this.options.bounds = value;
					this.scalePosition = this.scalePosition = this.container.scrollLeft();
					this._updateDragBar();
				}
				break;

			case 'scaleBounds':
				this.options.scaleBounds = value;
				this._createScaleBar();
				break;

		}

		// in 1.9 would use _super
		$.Widget.prototype._setOption.call(this, key, value);

	}
});