
define(['jquery','jquery.mobile','externs/jquery.mousewheel'], function($) {

// Helper function
function getDaysBetween(date1,date2) {
	return Math.floor(( date1 - date2 ) / 86400000);
};

// For month representation
var monthArray=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * The date slider
 */
$.widget( "ui.dateRangeSlider", {
	// default options
	options: {
		// parameters
		scaleBounds: null,
		bounds: null,
		boundsMaxLength: 180, // 3 months
		boundsMinLength: 10, // 10 days
		wheelFactor : 10,
		wheelTimeout : 1000,
		
		// events
		change: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
		
		this.scalePosition = 0;
						
		// Create left and righ arrows
		$('<div class="dateSlider-rightArrow"></div>')
			.appendTo(this.element)
			.mousedown( function(event) {
				self.autoScaleDirection = 10;
				setTimeout( $.proxy(self._autoScaleScroll,self), 50 );
			})
			.mouseup( $.proxy(this._onArrowMouseUp,this) );

		$('<div class="dateSlider-leftArrow"></div>')
			.appendTo(this.element)
			.mousedown( function(event) {
				self.autoScaleDirection = -10;
				setTimeout( $.proxy(self._autoScaleScroll,self), 50 );
			})
			.mouseup( $.proxy(this._onArrowMouseUp,this) );
			

		// Create the bar that defines the date range
		this.dragBar = $('<div class="dateSlider-bar"></div>')
			.appendTo(this.element)
			.mousedown( function(event) {
				$(document).on( 'mousemove', { lastX: event.pageX }, $.proxy(self._onDragBar,self) );
				$(document).on( 'mouseup', $.proxy(self._onDragBarStop,self) );
				event.preventDefault();
			});
			
		// Create the labels of the start and end date
		this.startLabel = $('<div class="dateSlider-label">20-May-2017</div>')
			.appendTo(this.element)
			.mousedown( function(event) {
				$(document).on('mousemove', { lastX: event.pageX }, $.proxy(self._moveLeftDrag,self) );
				$(document).one('mouseup', function() {
					$(document).off('mousemove', $.proxy(self._moveLeftDrag,self) );
					if ( self.options.change ) {
						self.options.change( self._computeCurrentDate() ); 
					}
				});
			});
		this.endLabel = $('<div class="dateSlider-label">20-May-2017</div>')
			.appendTo(this.element)
			.mousedown( function(event) {
				$(document).on('mousemove', { lastX: event.pageX }, $.proxy(self._moveRightDrag,self) );
				$(document).one('mouseup', function() {
					$(document).off('mousemove', $.proxy(self._moveRightDrag,self) );
					if ( self.options.change ) {
						self.options.change( self._computeCurrentDate() ); 
					}
				});
			});
		
		// Create the scale bar
		this._createScaleBar();
		
		this.wheelTimeoutVar = null;
		this.element.mousewheel( function(event,delta) {
			 self._moveDrag(delta * self.options.wheelFactor);
			 
			 // Call change after a few milliseconds
			 if ( self.options.change ) {
				 if ( self.wheelTimeoutVar ) {
					clearTimeout( self.wheelTimeoutVar );
				}
				self.wheelTimeoutVar = setTimeout( function() {
					self.options.change( self._computeCurrentDate() );
					self.wheelTimeoutVar = null;
				}, self.options.wheelTimeout );
			}
		});
					
		// Compute the max days to limit the scale bar scrolling
		this.maxDays = getDaysBetween( this.options.scaleBounds.max, this.minDate );
		
		// Initialize dragging
		this.dragLeftDays = getDaysBetween( this.options.bounds.min, this.minDate );
		this.dragRightDays = getDaysBetween( this.options.bounds.max, this.minDate );
		this.dragBar.width(this.dragRightDays - this.dragLeftDays );
		this._moveDrag( 0 );
		
		// Manage window resize
		$(window).resize( function() {
			// Recompute the scale position
			self.scalePosition = self.dragRightDays - self.container.width();
			self.container.scrollLeft( self.scalePosition );
			// Update the drag bar
			self._moveDrag( 0 );
		});
	},
	
	// Call when mouse up on an arrow
	_onArrowMouseUp: function() {
		this.autoScaleDirection = 0;
		if ( this.options.change ) {
			this.options.change( this._computeCurrentDate() ); 
		}
	},
	
	// Create the scale
	_createScaleBar: function() {
				
		var scale = $('<div class="dateSlider-scale"></div>');
		
		var startYear = parseInt( this.options.scaleBounds.min.getUTCFullYear() );
		var endYear = parseInt( this.options.scaleBounds.max.getUTCFullYear() );
		
		this.minDate = new Date();
		this.minDate.setUTCFullYear(startYear);
		this.minDate.setUTCMonth(0);
		this.minDate.setUTCDate(1);
		this.minDate.setUTCHours(0);
		this.minDate.setUTCMinutes(0);
		this.minDate.setUTCSeconds(0);
		this.minDate.setUTCMilliseconds(0);
	
		var maxDate = new Date();
		maxDate.setUTCFullYear(endYear);
		maxDate.setUTCMonth(12);
		maxDate.setUTCDate(31);
		
		var monthDay=["31","28","31","30","31","30","31","31","30","31","30","31"];
		for ( var i = startYear; i <= endYear; i++ ) {
			var isBissextile = ((i % 4) == 0) && ((i % 400) != 0);
			scale.append('<span class="dateSlider-year dateSlider-y' + (isBissextile ? 'bi' : 'n') + '">'+i+'</span>');
			for ( var j = 2; j < 12; j++ ) {
				scale.append('<span class="dateSlider-month dateSlider-m' + monthDay[j] + '">'+monthArray[j]+'</span>');
			}
		}
		
		scale.css('width', getDaysBetween( maxDate, this.minDate) );	
		scale.on('selectstart', function() { return false; });
		
		// Add it to the DOM
		// Create a container for the scale bar, needed to manage scrolling
		this.container = $('<div class="dateSlider-container"></div>').appendTo(this.element);
		this.scaleBar = scale.appendTo(this.container);
	},
		
	// Move the left side of the drag bar
	_moveLeftDrag: function(event) {
		var days = event.pageX - event.data.lastX;
		this.dragLeftDays += days;
		
		if ( this.dragLeftDays < this.scalePosition ) {
			this.dragLeftDays = this.scalePosition;
		} else if (this.dragRightDays > this.dragLeftDays + this.options.boundsMaxLength) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMaxLength;
		} else if ( this.dragLeftDays > this.dragRightDays - this.options.boundsMinLength ) {
			this.dragLeftDays = this.dragRightDays - this.options.boundsMinLength;
		}
		
		this.dragBar.width( this.dragRightDays - this.dragLeftDays );
		var leftPos = this.dragLeftDays + 30 - this.scalePosition;
		this.dragBar.css('left', leftPos );
		
		this._updateLabels();
		
		event.data.lastX = event.pageX;
		
		event.preventDefault();
	},
		
	// Move the right side of the drag bar
	_moveRightDrag: function(event) {
		var days = event.pageX - event.data.lastX;
		this.dragRightDays += days;
		
		if ( this.dragRightDays > this.scalePosition + this.container.width() ) {
			this.dragRightDays = this.scalePosition + this.container.width();
		} else if (this.dragRightDays > this.dragLeftDays + this.options.boundsMaxLength) {
			this.dragRightDays = this.dragLeftDays + this.options.boundsMaxLength;
		} else if ( this.dragRightDays < this.dragLeftDays + this.options.boundsMinLength ) {
			this.dragRightDays = this.dragLeftDays + this.options.boundsMinLength;
		}
		
		this.dragBar.width( this.dragRightDays - this.dragLeftDays );
		
		this._updateLabels();
		
		event.data.lastX = event.pageX;
		
		event.preventDefault();
	},
	
	// Compute the current date
	_computeCurrentDate: function() {
		return {
			min: new Date( this.minDate.getTime() + this.dragLeftDays * 86400000 ),
			max: new Date( this.minDate.getTime() + this.dragRightDays * 86400000 + (3600 * 1000 * 24 - 1) )
		};
	},
	
	// Format a date
	_formatDate: function(date) {
		return date.getUTCDate() + "-" + monthArray[date.getUTCMonth()] + "-" + date.getUTCFullYear();
	},
			
	// Update date labels
	_updateLabels : function() {
	
		var bounds = this._computeCurrentDate();
		// Update text
		this.startLabel.html( this._formatDate(bounds.min) );
		this.endLabel.html( this._formatDate(bounds.max) );
		
		// Compute label position
		var leftPos = this.dragLeftDays + 30 - this.scalePosition;
		var rightPos = this.dragRightDays + 30 - this.scalePosition;
		
		var startLeft = leftPos - this.startLabel.outerWidth()/2;
		var endLeft = rightPos - this.endLabel.outerWidth()/2;
		if ( startLeft + this.startLabel.outerWidth() > endLeft ) {
			endLeft = leftPos + this.dragBar.width()/2 + 1;
			startLeft = endLeft - 2 - this.startLabel.outerWidth();
		}
		
		this.startLabel.css({'left': startLeft,
							'top': -this.startLabel.outerHeight() });
		this.endLabel.css({'left': endLeft,
							'top': -this.startLabel.outerHeight() });
	},
	
	// Move the drag given the days number
	_moveDrag: function(days) {
		if ( this.dragLeftDays + days <= 0 ) {
			this.dragRightDays -= this.dragLeftDays;
			this.dragLeftDays = 0;
			$('.dateSlider-leftArrow').addClass('ui-disabled');
		} 
		else if ( this.dragRightDays + days >= this.maxDays ) {
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
		if (this.dragRightDays > this.scalePosition + this.container.width() ) {
			scaleDelta = this.dragRightDays - (this.scalePosition + this.container.width());
		} else if ( this.dragLeftDays < this.scalePosition ) {
			scaleDelta = this.dragLeftDays - this.scalePosition;
		}

		if ( scaleDelta != 0.0 ) {
			this.scalePosition += scaleDelta;
			this.container.scrollLeft( this.scalePosition );
		}

		var leftPos = this.dragLeftDays + 30 - this.scalePosition;
		
		this.dragBar.css('left', leftPos );
		
		this._updateLabels();
	},

	// To animate scale scrolling
	_autoScaleScroll: function() {
		if ( this.autoScaleDirection != 0.0 ) {
			this._moveDrag( this.autoScaleDirection );
			setTimeout( $.proxy(this._autoScaleScroll,this), 50 );
		}
	},
	
	// Called when dragging the bar
	_onDragBar: function(event) {	
		var rightBlock = (this.dragRightDays == this.scalePosition + this.container.width())
			&& event.pageX > event.data.lastX;
		var leftBlock = (this.dragLeftDays == this.scalePosition)
			&& event.pageX < event.data.lastX;
			
		if ( !rightBlock && !leftBlock ) {
			this._moveDrag( event.pageX - event.data.lastX );
			event.data.lastX = event.pageX;
			this.autoScaleDirection = 0.0;
		} else {
			this.autoScaleDirection = rightBlock ? 10 : - 10;
			setTimeout( $.proxy(this._autoScaleScroll,this), 50 );
		}
	},
	
	// Called when the dragging the bar is stopped
	_onDragBarStop: function(event) {
		this.autoScaleDirection = 0.0;
		$(document).off( 'mousemove', $.proxy(this._onDragBar,this) );
		$(document).off( 'mouseup', $.proxy(this._onDragBarStop,this) );
		
		if ( this.options.change ) {
			this.options.change( this._computeCurrentDate() ); 
		}
	},
	
	// revert other modifications here
	_destroy: function() {
		this.element.empty();
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	_setOptions: function() {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply( this, arguments );
		// TODO : refresh?
	},

	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {
		// TODO : manage options?
		// in 1.9 would use _super
		$.Widget.prototype._setOption.call( this, key, value );
		
	}
});
});