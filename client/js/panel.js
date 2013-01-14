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
		
		var centerHeight = this.element.outerHeight();
		if	( this.bottom ) {
			centerHeight -= this.bottom.parent().outerHeight();
		}
	
		$(this.options.center).css({
			width: this.element.outerWidth(),
			height: centerHeight
		});
		
		if ( this.options.update ) {
			this.options.update();
		}
	},
	
	// revert other modifications here
	_destroy: function() {
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
		activator: ""
	},

	// Constructor
	_create: function() {
	
		var self = this;
				
		// Use jQM to style the content
		this.element.addClass( "ui-body-c" );
		
		// Wrap with the parent div for panel
		this.element.wrap("<div class='panel'/>");
		this.parentElement = this.element.parent();
		
		// Add footer
		this.footer = $("<div class='panel-footer'></div>")
			.insertAfter(this.element);
		this.footer.hide();
		
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
	},
	
	// Show the panel
	show: function() {
		this.parentElement.show();
		this.options.panelManager.panelManager('option', 'bottom', this.element);
		if (this.activator) this.activator.addClass('toggle');
	},
	
	// Hide the panel
	hide: function() {
		this.options.panelManager.panelManager('option', 'bottom', null);
		if (this.activator) this.activator.removeClass('toggle');
		this.parentElement.hide();
	},
	
	// Add a button in the footer
	addButton: function(options) {
	
		if ( this.footer.find('button').length == 0 ) {
			this.footer.show();
		}
		
		var pos = options.position || 'right';
		
		var btn = $("<button data-role='button' data-inline='true' data-mini='true' id='"+options.id+"'>" + options.name + "</button>")
			.appendTo(this.footer)
			.button();
			
		return btn;
	},
	
	// Remove a button from the footer
	removeButton: function(el) {
		var $el = typeof el == "string" ? this.footer.find(el) : $(el);
		$el.parent().remove();
		if ( this.footer.find('button').length == 0 ) {
			this.footer.hide();
		}
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



