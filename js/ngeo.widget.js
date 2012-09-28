/**
  * Widget module
  */


define( [ "jquery.ui", "jquery.mobile" ], 

// The function to define the Widget module
function($) {
	
$.widget( "ngeo.ngeowidget", {
	// default options
	options: {
		title: "",
		activator: null,
		buttons: null,
		
		// callbacks
		resize: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
		
		// Style the container
		this.element.addClass( "widget-content" );
		
		// Wrap with the parent div for widget
		this.element.wrap("<div class='widget'/>");
		this.parentElement = this.element.parent();
		
		// Add header
		this.header = $("<div class='widget-header' />")
			.insertBefore(this.element)
			.append("<h2 class='widget-title'>" + this.options.title + "</h2>");
			
		// Add footer
		this.footer = $("<div class='widget-footer' />")
			.insertAfter(this.element);
			
		if ( this.options.buttons )	{
			$.each( this.options.buttons, function (index,  value ) {
				//self.footer.append("<a class='button' href='#'>" + value + "</a>");
				self.footer.append("<button data-role='button' data-inline='true'>" + value + "</button>");
			});
		} else {
			this.footer.hide();
		}
		
		var timeEffect = 300;

		// Activator 
		var activator;
		if ( this.options.activator ) {
			activator = $(this.options.activator);
			activator.click( function() { 
				if ( activator.hasClass('toggle') ) {
					self.parentElement.fadeOut(timeEffect); 
					activator.removeClass('toggle');
				}
				else {
					self.parentElement.fadeIn(timeEffect); 
					activator.addClass('toggle');
				}
			});
		}
			
		// Add close icon	
//		$("<span class='widget-close'></span>")
		$('<span data-role="button" class="widget-icon" data-theme="c" data-icon="delete" data-mini="true" data-iconpos="notext"></span>')
			.appendTo(this.header)
			.click( function() { 
				self.parentElement.fadeOut(timeEffect); 
				if (activator) activator.removeClass('toggle'); 
			});		
		
		// Add max icon	
//		$("<span class='widget-max'></span>")
		$('<span data-role="button" class="widget-icon widget-max" data-theme="c" data-icon="plus" data-mini="true" data-iconpos="notext"></span>')
			.appendTo(this.header)
			.hide()
			.click( function() {
				var jThis = $(this);
				self.parentElement
					.children(":not(.widget-header)")
					.slideDown( function() { self.header.find(".widget-min").show(); jThis.hide(); } ); 
			});
			
		// Add min icon	
//		$("<span class='widget-min'></span>")
		$('<span data-role="button" class="widget-icon widget-min" data-theme="c" data-icon="minus" data-mini="true" data-iconpos="notext"></span>')
			.appendTo(this.header)
			.click( function() {
				var jThis = $(this);
				self.parentElement
					.children(":not(.widget-header)")
					.slideUp( function() { self.header.find(".widget-max").show(); jThis.hide(); } ); 
			});
			
		
		
		this.parentElement
			.trigger("create")
			//.width( this.element.width() )
			.position({my: "center center", at: "center center", of: "#mapContainer" })
			.draggable({ handle: self.header, containment: "#mapContainer"})
			.hide();
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



