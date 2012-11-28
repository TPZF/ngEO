/**
  * MapPopup module
  */


define( [ "jquery", "configuration", 'text!map/template/mapPopupContent.html', "underscore" ], function($,Configuration, mapPopup_template) {


var MapPopup = function(container) {

	var element = $('<div></div>');
	
	// Style the content
	element.addClass( "widget-content" );
	// Use jQM to style the content
	element.addClass( "ui-body-c" );
	element.addClass( "mapPopup" );

	// Wrap with the parent div for widget
	element.wrap("<div class='widget'/>");
	var parentElement = element.parent();
			
	// Add footer
/*	var footer = $("<div class='widget-footer'><div class='widget-footer-left'/><div class='widget-footer-right'/></div>")
		.insertAfter(element);*/
		
	parentElement.appendTo(container);
	
	// Add Arrow 
	var arrow = $("<div class='mapPopup-arrow' />")
			.insertBefore(parentElement);
			
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
/*		var contentDef = Configuration.data.resultsTable.columnsDef;
		for ( var i = 0; i < contentDef.length; i++ ) {
			content += "<p><b>" + contentDef[i].sTitle + " :</b> " +  getData(product,contentDef[i].mData) + "</p>";
		}*/
		element.html(content);
	};
		
	/**
		Open the popup
	 */
	this.open = function(pos,product) {
	
		buildContent(product);
		
		parentElement.css('top',pos.y - parentElement.outerHeight() + arrow.outerHeight() );
		parentElement.css('left',pos.x + arrow.outerWidth());
		parentElement.show();
		
		arrow.css('top',pos.y  - arrow.outerHeight() / 2);
		arrow.css('left',pos.x);
		arrow.show();
	};
	
		
	/**
		Close the popup
	 */
	this.close = function() {
		arrow.hide();
		parentElement.hide();
	};
};

return MapPopup;

});





