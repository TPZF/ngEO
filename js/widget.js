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
		_widgets.push(this);
		
		// Style the container
		this.element.addClass( "widget-content" );
		// Use jQM to style the content
		this.element.addClass( "ui-body-c" );
		
		// Wrap with the parent div for widget
		this.element.wrap("<div class='widget'/>");
		this.parentElement = this.element.parent();
				
		// Add Arrow 
		this.arrow = $("<div class='widget-arrow-up' />")
			.insertBefore(this.parentElement);
					
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
		this.activator = $(this.options.activator);
		this.activator.click( function() { 
			if ( self.activator.hasClass('toggle') ) {
				self.hide();
			}
			else {
				self.show();
			}
		});
			
		this.parentElement
			.trigger("create")
			.hide();
		this.arrow.hide();
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
	
	// Add a select in the footer
	addSelect: function(options) {
	
//		if ( this.footer.find('button').length == 0 ) {
//			this.footer.show();
//		}
//		
		//Browse images on the map
		var field = $('<div id="browseSliderContainer"  data-inline="true" data-role="fieldcontain class="fieldcontain-ui ui-body ui-br">' +
			'<label for="' + options.id + '" id="' + options.labelId +'" data-inline="true" data-mini="true" class="ui-slider">' + options.labelText + '</label></div>'); 
			
		var select = $('<select name="' + options.id + '" id="' + options.id + '" data-mini="true" data-inline="true" data-role="slider" class="ui-slider-switch"></select>');
		$.each( options.optionsList, function (index,  option ) {
			select.append('<option value="' + option.value + '">' + option.name +'</option>');
		});
		
		field.append(select);

		field.appendTo(this.footer).trigger('create');
//		var btn = $("<button data-role='button' data-inline='true' data-mini='true' id='"+options.id+"'>" + options.name + "</button>")
//			.appendTo(this.footer)
//			.button();
	
		return field;
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
		var widgetLeft = posActivator.left - (this.parentElement.outerWidth()/2) + (this.activator.outerWidth()/2);
		this.parentElement
			.css( 'left', widgetLeft );
		this.arrow
			.css( 'left', posActivator.left );
			
		// Set top position for both arrow and widget content
		// Top position never changed because toolbar and activator are fixed... even with a window resize!
		var $tb = $('#toolbar');
		var widgetTop = $tb.position().top + $tb.outerHeight();
		this.parentElement
			.css( 'top', widgetTop + this.arrow.outerHeight() );
		this.arrow
			.css( 'top', widgetTop );
	},
	
	show: function() {
		// Automatically hide other widgets
		for ( var i=0; i < _widgets.length; i++ ) {
			if ( _widgets[i] != this ) {
				_widgets[i].hide();
			}
		}
		
		this.update();
		this.parentElement.fadeIn(this.options.durationEffect); 
		this.arrow.fadeIn(this.options.durationEffect); 
	
		this.activator.addClass('toggle');
		
		if ( this.options.show ) {
			this.options.show();
		}
	},
	
	hide: function() {
	
		this.parentElement.fadeOut(this.options.durationEffect); 
		this.arrow.fadeOut(this.options.durationEffect); 
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



