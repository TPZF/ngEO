/**
  * MapPopup module
  */


define( [ "jquery", "configuration", "map/map", "dataAccess/model/simpleDataAccessRequest", "dataAccess/widget/downloadManagersWidget" ], function($,Configuration, Map, SimpleDataAccessRequest, DownloadManagersWidget) {


var MapPopup = function(container) {

	/**
	 * Private variables
	 */
	var element;
	var parentElement;
	var arrow;
	var products = null;
	var isOpened = false;

	element = $('<div class="widget-content ui-body-c mapPopup"><div id="text"></div><div id="buttons" data-mini="true" data-role="controlgroup" data-type="horizontal"></div></div>');
	
	// Wrap with the parent div for widget
	element.wrap("<div class='widget'></div>");
	parentElement = element.parent();
	
	// Add buttons for some simple actions
	
	// Info
	var btn = $("<button id='info' data-icon='info' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Information/button>")
		.appendTo( element.find('#buttons') )
		.click( function() {
			if ( $(this).parent().hasClass('ui-btn-active') ) {
				buildContent(false);
				$(this).parent().removeClass('ui-btn-active ui-focus');
			} else {
				buildContent(true);
				$(this).parent().addClass('ui-btn-active');
			}
		});

	// DAR
	var btn = $("<button data-icon='arrow-d' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Retrieve product</button>")
		.appendTo( element.find('#buttons') )
		.click( function() {
			SimpleDataAccessRequest.initialize();
			SimpleDataAccessRequest.setProducts( products );
			
			var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
			downloadManagersWidget.open();
		});
		
	parentElement.appendTo(container);
	parentElement.trigger("create");
	
	// Add Arrow 
	arrow = $("<div class='mapPopup-arrow-left' />")
			.insertBefore(parentElement);
			
	// The popup is closed by default
	arrow.hide();
	parentElement.hide();

	var self = this;
	Map.on('pickedFeatures', function(selectedFeatures) {
		if ( selectedFeatures.length == 0 ) {
			self.close();
		} else {
			self.open(selectedFeatures);
		}
	});
	Map.on('startNavigation', function() {
		self.close();
	});
	
	/**
	 * Private methods
	 */
					
	/**
		Get data from a path
	 */
	var getData = function(product,path) {
		var names = path.split('.');
		var obj = product;
		for ( var i = 0; obj && i < names.length-1; i++ ) {
			obj = obj[ names[i] ];
		}
		if ( obj && obj.hasOwnProperty(names[names.length-1]) ) {
			return obj[ names[names.length-1] ];
		} else {
			return "";
		}
	};

	/**
		Build the content of the popup from the given product
	 */
	var buildContent = function(adv) {
		var content;

		if ( products.length == 1 ) {
			content = '<p><b>Product: ' + products[0].id + '</b></p>';
			if ( adv ) {
				var columnDefs = Configuration.data.resultsTable.columnsDef;
				for ( var i = 0; i < columnDefs.length; i++ ) {
					if ( columnDefs[i].sTitle != 'Product' ) {
						var value = getData( products[0], columnDefs[i].mData );
						if ( value ) {
							content += '<p>' + columnDefs[i].sTitle + ': ' + value + '</p>';
						}
					}
				}
			} else {
				content += '<p>Date: ' + products[0].properties.EarthObservation.gml_beginPosition + '</p>';
			}
		} else {
			content = products.length + " products selected.<br>Click again to cycle through the different products.";
			if ( adv ) {
				content += "<p>Products:</p>";
				for ( var i = 0; i < products.length; i++ ) {
					content += "<p>" + products[i].id + "</p>";
				}
			}
		}
		
		element.find('#text').html(content);
	};
	
	/**
		Compute the bounding box of the features, used to compute the pop-up position
	 */
	var computeBbox = function(features) {
		var bbox = [ features[0].bbox[0], features[0].bbox[1], features[0].bbox[2], features[0].bbox[3] ];
		for ( var i = 1; i < features.length; i++ ) {
			bbox[0] = Math.min( bbox[0], features[i].bbox[0] );
			bbox[1] = Math.min( bbox[1], features[i].bbox[1] );
			bbox[2] = Math.max( bbox[2], features[i].bbox[2] );
			bbox[3] = Math.max( bbox[3], features[i].bbox[3] );
		}
		return bbox;
	};

			
	/**
		Open the popup
	 */
	this.open = function(features) {
	
		products = features;
		
		buildContent(false);
				
		var bbox = computeBbox(features);
		var pos = Map.getPixelFromLonLat( bbox[2], (bbox[1] + bbox[3])*0.5);
			
		var toolbarTop = $("#toolbar").offset().top;
		pos.y += toolbarTop;
		var toolbarBottom = toolbarTop + $("#toolbar").outerHeight();
		
		// Compute top position for popup, limit it to the toolbar bottom
		var poh = parentElement.outerHeight();
		var top = pos.y - parentElement.outerHeight() / 2;
		if ( top < toolbarBottom ) {
			top = toolbarBottom + 5;
		}		
		parentElement.css('top', top );
		
		// Compute left position for popup, if too close to window right edge, "invert" its position
		var left = pos.x + arrow.outerWidth();
		if ( left + parentElement.outerWidth() >  window.innerWidth ) {
			pos = Map.getPixelFromLonLat( bbox[0], (bbox[1] + bbox[3])*0.5);
			pos.y += toolbarTop;
			parentElement.css( 'left', pos.x - arrow.outerWidth() - parentElement.outerWidth() );
		
			arrow.css('top',pos.y - 0.5 * arrow.outerHeight());
			arrow.css('left',pos.x - arrow.outerWidth());
			arrow.removeClass('mapPopup-arrow-left');
			arrow.addClass('mapPopup-arrow-right');
		} else {
			parentElement.css('left', left);
			
			// position the arrow
			arrow.removeClass('mapPopup-arrow-right');
			arrow.addClass('mapPopup-arrow-left');
			arrow.css('top', pos.y - 0.5 * arrow.outerHeight() );
			arrow.css('left', pos.x);
		}
		
		parentElement.fadeIn();
		arrow.fadeIn();
		
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
			parentElement.fadeOut();
			arrow.fadeOut();
			
			// Remvoe event listener
			$("header").off("click",this.close);
			$("#toolbar").off("click",this.close);
			
			isOpened = false;
		}
		
	};
};

return MapPopup;

});




