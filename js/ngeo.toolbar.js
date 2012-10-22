/**
 * ToolBar module
 *  jQuery plugin to build a toolbar from img element.
 */
define(['jquery'], function() {
 
$.widget( "ngeo.toolbar", {
	// default options
	options: {
		// No options for now!
	},

	// the constructor
	_create: function() {
		// Wrap the image with a div to display both image and text below, and then add class for button styling
		this.element.find('img')
			.wrap('<div class="tb-elt" />')
			.addClass('tb-button');
			
		// Add text for each element
		this.element.find('img').each( function(index) {
			$(this).after('<div class="tb-text">' + $(this).attr('name') + '</div>');
		});
	},
	
	// Add a separator
	addSeparator: function() {
		this.element.append('<div class="tb-separator"></div>');
	},
	
	// Add an action on the toolbar
	addAction: function(item) {
		var html = '<div class="tb-elt"><img id="' + item.id + '" class="tb-button" src="images/' + item.id + '.png" /><div class="tb-text">' + item.text + '</div></div>';
		this.element.append(html);
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