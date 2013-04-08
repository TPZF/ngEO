/**
  * Panel module
  */


define( [ "jquery", "jquery.mobile" ], 

// The function to define the Panel module
function($) {
	
/**
 * The panel manager
 */
$.widget( "ngeo.panelManager", {
	// default options
	options: {
		center: "",
		bottom: "",
		update: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
				
		this.update();
		
		$(window).resize( $.proxy(this.update,this) );
	},
	
	update: function() {
	
		// Compute size of each element
		
		// TODO : this version does not work well, the height of element is not always correct at that time
		//var centerHeight = this.element.outerHeight();
		var centerHeight = $(window).height() - this.element.offset().top;
		
		if	( this.bottom ) {
			centerHeight -= this.bottom.parent().outerHeight();
		}
		
		// Only update the panel when height has really changed
		var prevHeight = $(this.options.center).height();
		if ( prevHeight != centerHeight ) {
			$(this.options.center).css({
				width: this.element.outerWidth(),
				height: centerHeight
			});
			
			if ( this.options.update ) {
				this.options.update();
			}
		}
	},
	
	// revert other modifications here
	_destroy: function() {
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
/*	_setOptions: function() {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply( this, arguments );
		// TODO : refresh?
	},*/

	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {
		// TODO : manage options?
		// in 1.9 would use _super
		$.Widget.prototype._setOption.call( this, key, value );
		
		if ( key == 'bottom') {
			this.bottom = $(value); //.panel('option','panelManager',this);
			this.update();
		}
	}
});
	
$.widget( "ngeo.panel", {
	// default options
	options: {
		panelManager: null,
		activator: "",
		
		// events
		show: null,
		hide: null
	},

	// Constructor
	_create: function() {
	
		var self = this;
				
		// Use jQM to style the content
		this.element.addClass( "ui-body-c" );
		
		// Wrap with the parent div for panel
		this.element.wrap("<div class='panel'/>");
		this.parentElement = this.element.parent();
			
		if ( this.options.activator ) {
			this.activator = $( this.options.activator );
			this.activator.click( function() {
				if ( $(this).hasClass('toggle') ) {
					self.hide();
				} else {
					self.show();
				}
			});
		}
		
		this.parentElement.hide();
	},
	
	// Show the panel
	show: function() {
		this.parentElement.show();
		if (this.options.show) this.options.show();
		this.options.panelManager.panelManager('option', 'bottom', this.element);
		if (this.activator) this.activator.addClass('toggle');
	},
	
	// Hide the panel
	hide: function() {
		this.options.panelManager.panelManager('option', 'bottom', null);
		if (this.activator) this.activator.removeClass('toggle');
		this.parentElement.hide();
		if (this.options.hide) this.options.hide();
	},
	
	// Update the panel
	update: function() {
		this.options.panelManager.panelManager('update');
	},
	
	// Revert other modifications here
	_destroy: function() {
		// Cleanup parent element
		this.parentElement.children().not(this.element).remove();
		// Remove parent element
		this.element.unwrap();
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
/*	_setOptions: function() {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply( this, arguments );
		// TODO : refresh?
	},*/

	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {		
		// in 1.9 would use _super
		$.Widget.prototype._setOption.call( this, key, value );
	}
});


});



