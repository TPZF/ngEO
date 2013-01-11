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
		effectDuration: 1000,
		
		// callbacks
		show: null,
		hide: null
	},

	// the constructor
	_create: function() {
	
		var self = this;
		
		// Style the container
		this.element.addClass( "widget-content" );
		// Use jQM to style the content
		this.element.addClass( "ui-body-c" );
		
		// Wrap with the parent div for widget
		this.element.wrap("<div class='widget'/>");
		this.parentElement = this.element.parent();
		
		if ( this.options.title ) {
			this.parentElement.prepend('<h2>' + this.options.title + '</h2>');
		}
									
		// Add footer
		this.footer = $("<div class='widget-footer'><div class='widget-footer-left'/><div class='widget-footer-right'/></div>")
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
		if ( this.options.activator ) {
			this.activator = $(this.options.activator);
			this.activator.click( function() { 
				if ( self.activator.hasClass('toggle') ) {
					self.hide();
				}
				else {
					self.show();
				}
			});
		} else {
			$('<a class="ui-btn-right" data-iconpos="notext" data-icon="delete" data-theme="a"\
				data-role="button" data-corners="true" data-shadow="true"\
				data-iconshadow="true" data-wrapperels="span" title="Close">')
					.prependTo(this.parentElement)
					.click( $.proxy(this.hide,this) ); 
		}
			
		this.parentElement
			.trigger("create")
			.hide();
			
		if ( this.activator ) {
			// Add Arrow
			this.arrow = $("<div class='widget-arrow-up' />")
				.insertBefore(this.parentElement);
			this.arrow.hide();
		}
		_widgets.push(this);
	},

	// Add a button in the footer
	addButton: function(options) {
	
		if ( this.footer.find('button').length == 0 ) {
			this.footer.show();
		}
		
		var pos = options.position || 'right';
		
		var btn = $("<button data-role='button' data-inline='true' data-mini='true' id='"+options.id+"'>" + options.name + "</button>")
			.appendTo( pos == "right" ? this.footer.find('.widget-footer-right') : this.footer.find('.widget-footer-left') )
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
		var $tb = $('#toolbar');
		var toolbarBottom = $tb.position().top + $tb.outerHeight();
		if ( this.activator ) {
			// Recompute position for widget
			var posActivator = this.activator.position();
			var widgetLeft = Math.max( 10, posActivator.left - (this.parentElement.outerWidth()/2) + (this.activator.outerWidth()/2) );
			this.parentElement
				.css( 'left', widgetLeft );
			this.arrow
				.css( 'left', posActivator.left );
				
			// Set top position for both arrow and widget content
			// Top position never changed because toolbar and activator are fixed... even with a window resize!
			this.parentElement
				.css( 'top', toolbarBottom + this.arrow.outerHeight() );
			this.arrow
				.css( 'top', toolbarBottom );
		} else {
			var widgetLeft = $(window).width()/2 - (this.parentElement.outerWidth()/2);
			var widgetTop = ($(window).height() - toolbarBottom)/2- (this.parentElement.outerHeight()/2);
			this.parentElement.css({ top: widgetTop, left: widgetLeft });
		}
	},
	
	show: function() {
		// Automatically hide other popup
		for ( var i=0; i < _widgets.length; i++ ) {
			if ( _widgets[i] != this ) {
				_widgets[i].hide();
			}
		}
			
		this.update();
		this.parentElement.fadeIn(this.options.durationEffect); 
		if (this.arrow) this.arrow.fadeIn(this.options.durationEffect); 
	
		if (this.activator) this.activator.addClass('toggle');
		
		if ( this.options.show ) {
			this.options.show();
		}
	},
	
	hide: function() {
		this.parentElement.fadeOut(this.options.durationEffect,this.options.hide ); 
		if (this.arrow) this.arrow.fadeOut(this.options.durationEffect); 
		if (this.activator) this.activator.removeClass('toggle');
	},
		
	// events bound via _bind are removed automatically
	// revert other modifications here
	_destroy: function() {
		// Cleanup parent element
		this.parentElement.children().not(this.element).remove();
		// Remove parent element
		this.element.unwrap();
		//Remove arrow
		if (this.arrow) this.arrow.remove();
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



