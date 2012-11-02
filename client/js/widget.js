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
		show: null,
		hide: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
		_widgets.push(this);
		
		// Style the container
		this.element.addClass( "widget-content" );
		// Use jQM to style the content
		this.element.addClass( "ui-body-c" );
		
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
				
		this.containerElement
			.trigger("create")
			.hide();
	},
	
	// Add a button in the footer
	addButton: function(options) {
	
		if ( this.footer.find('button').length == 0 ) {
			this.footer.show();
		}
		
		var btn = $("<button data-role='button' data-inline='true' id='"+options.id+"'>" + options.name + "</button>")
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
	
	update: function() {
		// Recompute position for widget
		var posActivator = this.activator.position();	
		var widgetLeft = posActivator.left - (this.containerElement.outerWidth()/2) + (this.activator.outerWidth()/2);
		var widgetTop = posActivator.top + this.activator.outerHeight() + 20;
		this.containerElement
			.css( 'top', widgetTop )
			.css( 'left', widgetLeft );
	},
	
	show: function() {
		// Automatically hide other widgets
		for ( var i=0; i < _widgets.length; i++ ) {
			if ( _widgets[i] != this ) {
				_widgets[i].hide();
			}
		}
		
		this.update();
		this.containerElement.fadeIn(this.options.durationEffect); 
		
		this.activator.addClass('toggle');
		
		if ( this.options.show ) {
			this.options.show();
		}
	},
	
	hide: function() {
	
		this.containerElement.fadeOut(this.options.durationEffect); 
		this.activator.removeClass('toggle');
		
		if ( this.options.hide ) {
			this.options.hide();
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



