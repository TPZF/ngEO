/**
  * Tabs module
  */


define( [ "jquery" ], 

// The function to define the tabs module
function($) {
	
$.widget( "ngeo.tabs", {

	// default options
	options: {
		
		// callbacks
	},

	// the constructor
	_create: function() {
		this.element.find('ul').addClass('tabs-ul');
		this.element.find('li').addClass('tabs-li');
		var self = this;
		
		// Style the link and div content
		// Also store the active link and div
		this.element.find('a')
			.each( function(index) {
				$(this).addClass('tabs-a')
				var $div = self.element.find( $(this).attr('href') );
				$div.addClass('ui-body-c').addClass('tabs-content');
				
				if ( index == 0 ) {
					self.activeLink = $(this).addClass('tabs-a-active');
					self.activeDiv = $div.show();
				} else {
					$div.hide();
				}
			});
				
		// Show/hide when a tab is clicked
		this.element.find('a').click( function(event) {
		
			var href = $(this).attr('href');
			self.activeLink.removeClass('tabs-a-active');
			self.activeDiv.hide();
			$(this).addClass('tabs-a-active');
			$(href).show();
			
			self.activeDiv = $(href);
			self.activeLink = $(this);
			
			event.preventDefault();
		});

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



