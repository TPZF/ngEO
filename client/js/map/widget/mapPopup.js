/**
 * MapPopup module
 */

var GlobalEvents = require('globalEvents');
var Logger = require('logger');
var Configuration = require('configuration');
var Map = require('map/map');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var SearchResults = require('searchResults/model/searchResults');
var Utils = require('map/utils');


var MapPopup = function(container) {

	/**
	 * Private variables
	 */
	var element;
	var parentElement;
	var arrow;
	var products = null;
	var isOpened = false;
	var advancedActivated = false;

	element = $(
		'<div class="widget-content ui-body-c mapPopup">\
			<div id="mpText"></div>\
			<div id="mpButtons" data-mini="true" data-role="controlgroup" data-type="horizontal"></div>\
		</div>');

	// Wrap with the parent div for widget
	element.wrap("<div id='mapPopup' class='widget'></div>");
	parentElement = element.parent();

	// Add buttons for some simple actions

	// Info
	var btn = $("<button id='info' data-icon='info' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Information</button>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			if ($(this).parent().hasClass('ui-btn-active')) {
				advancedActivated = false;
				buildContent(advancedActivated);
				$(this).parent().removeClass('ui-btn-active ui-focus');
			} else {
				advancedActivated = true;
				buildContent(advancedActivated);
				$(this).parent().addClass('ui-btn-active');
			}
		});

	// Select
	btn = $("<button data-icon='check' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Select product</button>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			
			// Update button's layout
			if ($(this).parent().hasClass('ui-btn-active')) {
				$(this).parent().removeClass('ui-btn-active ui-focus');
			} else {
				$(this).parent().addClass('ui-btn-active');
			}

			for (var i = 0; i < products.length; i++) {
				var p = products[i];
				if (p._featureCollection.isSelected(p)) {
					p._featureCollection.unselect(p);
				} else {
					p._featureCollection.select(p);
				}
			}
		});

	// DAR
	btn = $("<button data-icon='save' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Retrieve product</button>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {

			var allowedProducts = [];
			for (var i = 0; i < products.length; i++) {
				if (products[i]._featureCollection.downloadAccess) {
					allowedProducts.push(products[i]);
				}
			}

			if (allowedProducts.length > 0) {
				SimpleDataAccessRequest.initialize();
				SimpleDataAccessRequest.setProducts(allowedProducts);

				DataAccessWidget.open(SimpleDataAccessRequest);
			} else {
				Logger.inform("Cannot download product : missing permissions.");
			}

		});

	// Shopcart
	btn = $("<button data-icon='shop' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Add to shopcart</button>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			GlobalEvents.trigger('addToShopcart', products);
		});

	parentElement.appendTo(container);
	parentElement.trigger("create");

	parentElement.hide();

	var self = this;
	Map.on('pickedFeatures', function(highlightedFeatures, event) {
		if (highlightedFeatures.length == 0) {
			self.close();
		} else {
			self.open(highlightedFeatures, event);
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
	var getData = function(product, path) {
		var names = path.split('.');
		var obj = product;
		for (var i = 0; obj && i < names.length - 1; i++) {
			obj = obj[names[i]];
		}
		if (obj && obj.hasOwnProperty(names[names.length - 1])) {
			return obj[names[names.length - 1]];
		} else {
			return "";
		}
	};

	/**
		Build the content of the popup from the given product
	 */
	var buildContent = function(adv) {
		var content;

		if (products.length == 1) {
			content = '<p><b>Product: ' + products[0].id + '</b></p>';
			if (adv) {
				var columnDefs = Configuration.data.tableView.columnsDef;
				for (var i = 0; i < columnDefs.length; i++) {
					if (columnDefs[i].sTitle != 'Product') {
						var value = Configuration.getFromPath(products[0], columnDefs[i].mData);
						if (value) {
							content += '<p>' + columnDefs[i].sTitle + ': ' + value + '</p>';
						}
					}
				}
			} else {
				content += '<p>Date: ' + Configuration.getMappedProperty(products[0], "start") + '</p>';
			}
		} else {
			content = products.length + " products picked.<br>Click again to cycle through products.";
			if (adv) {
				content += "<p>Products:</p>";
				for (var i = 0; i < products.length; i++) {
					content += "<p>" + products[i].id + "</p>";
				}
			}
		}
		// NGEO-1770: No retrieve button if selection contains at least one planned product or product url doesn't exist
		var hasPlannedOrNoProductUrl = _.find(products, function(feature) {
			return Configuration.getMappedProperty(feature, "status", null) == "PLANNED" ||
				!Configuration.getMappedProperty(feature, "productUrl");
		});
		element.find('#mpButtons button[data-icon="save"]').button(hasPlannedOrNoProductUrl ? 'disable' : 'enable');
		if ( advancedActivated ) {
			element.find('#mpButtons button[data-icon="info"]').parent().addClass('ui-btn-active');
		}
		element.find('#mpText').html(content);
	};


	/**
		Open the popup
	 */
	this.open = function(highlightedFeatures, event) {

		products = highlightedFeatures;

		// Clean-up previou state
		$('#info').parent().removeClass('ui-btn-active ui-focus');

		buildContent(advancedActivated);

		parentElement.fadeIn();

		isOpened = true;
	};


	/**
		Close the popup
	 */
	this.close = function() {

		if (isOpened) {
			parentElement.fadeOut();
			isOpened = false;
		}

	};

	SearchResults.on('reset:features', this.close, this);

};

module.exports = MapPopup;