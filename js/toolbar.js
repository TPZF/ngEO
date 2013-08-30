/**
  * Toolbar module
  */


define( [ "jquery" ], 

// The function to define the Widget module
function($) {
 
	
$.widget( "ngeo.toolbar", {
	// default options
	options: {
		onlyIcon: false
	},

	// the constructor
	_create: function() {
	
		// Wrap the image with a div to display both image and text below, and then add class for button styling
		this.element.find('command')
			.addClass('tb-elt');
			
		// Add text for each element
		this.element.find('command').append('<div class="tb-button"><div class="tb-icon"></div></div>');
		
		// Take care to set the data-help on the tb-icon (now the element to receive click)
		this.element.find('command').each( function() {
			var $this = $(this);
			var contextHelp = $this.data('help');
			if ( contextHelp ) {
				// Add it to the lowest element
				$this.find('.tb-icon').attr('data-help', contextHelp);
				// Remove it from the container, not needed anymore
				$this.removeAttr('data-help');
			}
		});
	
		if ( this.options.onlyIcon ) {
			this.element.find('.tb-separator').css({ height: '24px' });
			this.element.find('command').attr( 'title', function() { return $(this).attr('label'); } );
		} else {
			this.element.find('command').append( function() { return '<div class="tb-text">' + $(this).attr('label') + '</div>'; } );
		}

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



