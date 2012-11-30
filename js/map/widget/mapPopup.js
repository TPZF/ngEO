/**
  * MapPopup module
  */


define( [ "jquery", "configuration", 'text!map/template/mapPopupContent.html', "underscore" ], function($,Configuration, mapPopup_template) {


var MapPopup = function(container) {

	/**
	 * Private variables
	 */
	var element;
	var parentElement;
	var arrow;
	var isOpened = false;

	element = $('<div></div>');
	
	// Style the content
	element.addClass( "widget-content" );
	// Use jQM to style the content
	element.addClass( "ui-body-c" );
	element.addClass( "mapPopup" );

	// Wrap with the parent div for widget
	element.wrap("<div class='widget'/>");
	parentElement = element.parent();
			
	// Add footer
	var footer = $("<div class='widget-footer'><div class='widget-footer-left'/><div class='widget-footer-right'/></div>")
		.insertAfter(element);
		
	var btn = $("<button data-role='button' data-inline='true' data-mini='true'>Add to shopcart</button>")
		.appendTo( footer.find('.widget-footer-left') );
	var btn = $("<button data-role='button' data-inline='true' data-mini='true'>Retrieve product</button>")
		.appendTo( footer.find('.widget-footer-left') );
		
	parentElement.appendTo(container);
	parentElement.trigger("create");
	
	// Add Arrow 
	arrow = $("<div class='mapPopup-arrow-left' />")
			.insertBefore(parentElement);
			
	// The popup is closed by default
	arrow.hide();
	parentElement.hide();
	
	/**
	 * Private methods
	 */
			
	/**
		Get data from a path
	 */
	var getData = function(product,path) {
		var names = path.split('.');
		var obj = product;
		for ( var i = 0; i < names.length-1; i++ ) {
			obj = obj[ names[i] ];
		}
		return obj[ names[names.length-1] ];
	};

	/**
		Build the content of the popup from the given product
	 */
	var buildContent = function(product) {
		var content = _.template(mapPopup_template, { contentDefs: Configuration.data.resultsTable.columnsDef,
						getData: getData,
						product: product });
		element.html(content);
	};
		
	/**
		Open the popup
	 */
	this.open = function(pos,product) {
	
		buildContent(product);
			
		var toolbarBottom = $("#toolbar").offset().top + $("#toolbar").outerHeight();
		
		// Compute top position for popup, limit it to the toolbar bottom
		var top = pos.y - parentElement.outerHeight() + arrow.outerHeight();
		if ( top < toolbarBottom ) {
			top = toolbarBottom + 5;
		}		
		parentElement.css('top', top );
		
		// Compute left position for popup, if too close to window right edge, "invert" its position
		var left = pos.x + arrow.outerWidth();
		if ( left + parentElement.outerWidth() >  window.innerWidth ) {
			parentElement.css( 'left', pos.x - arrow.outerWidth() - parentElement.outerWidth() );
			parentElement.show();
		
			arrow.css('top',pos.y  - arrow.outerHeight() / 2);
			arrow.css('left',pos.x - arrow.outerWidth());
			arrow.removeClass('mapPopup-arrow-left');
			arrow.addClass('mapPopup-arrow-right');
			arrow.show();
		} else {
			parentElement.css('left', left);
			parentElement.show();
			
			// position the arrow
			arrow.removeClass('mapPopup-arrow-right');
			arrow.addClass('mapPopup-arrow-left');
			arrow.css('top',pos.y  - arrow.outerHeight() / 2);
			arrow.css('left',pos.x);
			arrow.show();
		}
		
		// Close the popup when click is done outside the map
		$("header").on("click",this.close);
		$("#toolbar").on("click",this.close);
		
		isOpened = true;
	};
	
		
	/**
		Close the popup
	 */
	this.close = function() {
	
		if ( isOpened ) {
			arrow.hide();
			parentElement.hide();
			
			// Remvoe event listener
			$("header").off("click",this.close);
			$("#toolbar").off("click",this.close);
			
			isOpened = false;
		}
		
	};
};

return MapPopup;

});





