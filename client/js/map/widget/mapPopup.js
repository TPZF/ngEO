/**
  * MapPopup module
  */


define( [ "jquery", "configuration", "map/map", "dataAccess/model/simpleDataAccessRequest", "dataAccess/widget/downloadManagersWidget", 
          "searchResults/model/searchResults", "map/utils", "shopcart/model/shopcartCollection" ], 
	function($,Configuration, Map, SimpleDataAccessRequest, DownloadManagersWidget, SearchResults, Utils, ShopcartCollection) {


var MapPopup = function(container) {

	/**
	 * Private variables
	 */
	var element;
	var parentElement;
	var arrow;
	var products = null;
	var isOpened = false;

	element = $('<div class="widget-content ui-body-c mapPopup"><div id="mpText"></div><div id="mpButtons" data-mini="true" data-role="controlgroup" data-type="horizontal"></div></div>');
	
	// Wrap with the parent div for widget
	element.wrap("<div id='mapPopup' class='widget'></div>");
	parentElement = element.parent();
	
	// Add buttons for some simple actions
	
	// Info
	var btn = $("<button id='info' data-icon='info' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Information</button>")
		.appendTo( element.find('#mpButtons') )
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
	var btn = $("<button data-icon='save' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Retrieve product</button>")
		.appendTo( element.find('#mpButtons') )
		.click( function() {
			SimpleDataAccessRequest.initialize();
			SimpleDataAccessRequest.setProducts( products );
			
			var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
			downloadManagersWidget.open();
		});
		
	var btn = $("<button data-icon='check' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Select product</button>")
		.appendTo( element.find('#mpButtons') )
		.click( function() {
			
			for (var i=0;i<products.length;i++){
				if (SearchResults.isSelected(products[i])){
					SearchResults.unselect(products[i]);
				}else{
					SearchResults.select(products[i]);
				}
			}
		});
		
	var btn = $("<button data-icon='shopcart' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Add to shopcart</button>")
		.appendTo( element.find('#mpButtons') )
		.click( function() {
			ShopcartCollection.getCurrent().addItems( SearchResults.getProductUrls(products), products );
		});
	
	parentElement.appendTo(container);
	parentElement.trigger("create");
	
	parentElement.hide();

	var self = this;
	Map.on('pickedFeatures', function(highlightedFeatures,event) {
		if ( highlightedFeatures.length == 0 ) {
			self.close();
		} else {
			self.open(highlightedFeatures,event);
		}
	});
	
	/*Map.on('extent:change', function() {
		self.close();
	});*/
	
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
			content = products.length + " products picked.<br>Click again to cycle through products.";
			if ( adv ) {
				content += "<p>Products:</p>";
				for ( var i = 0; i < products.length; i++ ) {
					content += "<p>" + products[i].id + "</p>";
				}
			}
		}
		
		element.find('#mpText').html(content);
	};

			
	/**
		Open the popup
	 */
	this.open = function(highlightedFeatures,event) {
	
		products = highlightedFeatures;
		
		// Clean-up previou state
		$('#info').parent().removeClass('ui-btn-active ui-focus');
		
		buildContent(false);

		parentElement.fadeIn();
		
		isOpened = true;
	};
	
		
	/**
		Close the popup
	 */
	this.close = function() {
	
		if ( isOpened ) {
			parentElement.fadeOut();	
			isOpened = false;
		}
		
	};
};

return MapPopup;

});





