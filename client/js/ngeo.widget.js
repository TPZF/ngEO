/**
  * Widget module
  */


define( [ "jquery", "jquery.mobile" ], 

// The function to define the Widget module
function($) {

var _widgets = [];
	
$.widget( "ngeo.ngeowidget", {
	// default options
	options: {
		title: "",
		activator: null,
		buttons: null,
		effectDuration: 300,
		
		// callbacks
		resize: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
		_widgets.push(this);
		
		// Style the container
		this.element.addClass( "widget-content" );
		
		// Wrap with the parent div for widget
		this.element.wrap("<div class='widget'/>");
		this.parentElement = this.element.parent();
		
		this.parentElement.wrap("<div class='widget-container' />");
		this.containerElement = this.parentElement.parent();
		
		// Add Arrow 
		this.arrow = $("<div class='widget-arrow-up' />")
			.insertBefore(this.parentElement);
		
		// Add header
/*		this.header = $("<div class='widget-header' />")
			.insertBefore(this.element)
			.append("<h2 class='widget-title'>" + this.options.title + "</h2>");*/
			
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
		

		// Activator 
		this.activator = $(this.options.activator);
		this.activator.click( function() { 
			if ( self.activator.hasClass('toggle') ) {
				self.hide();
			}
			else {
				self.show();
			}
		});

/*			
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
*/			
				
		this.containerElement
			.trigger("create")
			.hide();
	},
	
	show: function() {
		// Automatically hide other widgets
		for ( var i=0; i < _widgets.length; i++ ) {
			if ( _widgets[i] != this ) {
				_widgets[i].hide();
			}
		}
		
		// Recompute position for widget
		var posActivator = this.activator.position();	
		var widgetLeft = posActivator.left - (this.containerElement.outerWidth()/2) + (this.activator.outerWidth()/2);
		var widgetTop = posActivator.top + this.activator.outerHeight() + 20;
		this.containerElement
			.css( 'top', widgetTop )
			.css( 'left', widgetLeft )
			.fadeIn(this.options.durationEffect); 
		this.activator.addClass('toggle');
	},
	
	hide: function() {
		this.containerElement.fadeOut(this.options.durationEffect); 
		this.activator.removeClass('toggle');

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



