/**
 * MapPopup module
 */

var GlobalEvents = require('globalEvents');
var Logger = require('logger');
var Configuration = require('configuration');
var Map = require('map/map');
var DownloadOptions = require('search/model/downloadOptions');
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
		'<div class="widget-content mapPopup">\
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
			
			var isSelected = $(this).parent().hasClass('ui-btn-active');
			// Update button's layout
			if (isSelected) {
				$(this).parent().removeClass('ui-btn-active ui-focus');
			} else {
				$(this).parent().addClass('ui-btn-active');
			}

			for (var i = 0; i < products.length; i++) {
				var p = products[i];
				if (isSelected) {
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
	Map.on('pickedFeatures', function(pickedFeatures) {
		self.openOrCloseDialog(pickedFeatures);
	});

	/**
	* When we hightligth feature, update information linked to those features if the dialod is open.
	* Otherwise , do nothing
	*/
	Map.on('highlightFeatures', function(highlightedFeatures) {
		if (isOpened){
			self.openOrCloseDialog(highlightedFeatures);
		}
	});

	/**
	* When we unselect features, just close the window
	*/
	Map.on('unselectFeatures', function() {
		self.close();
	});

	/*Map.on('extent:change', function() {
		self.close();
	});

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
			var product = products[0];
			// Build product title according to NGEO-1969
			var productTitle = Configuration.getMappedProperty(product, "sensor") + " / "
							+ Configuration.getMappedProperty(product, "operationalMode") + " / "
							+ Configuration.getMappedProperty(product, "productType")
			content = '<p><b>' + productTitle + '</b></p>';
			if (adv) {
				var columnDefs = Configuration.data.tableView.columnsDef;
				for (var i = 0; i < columnDefs.length; i++) {
					if (columnDefs[i].sTitle != 'Product') {
						var value = Configuration.getFromPath(product, columnDefs[i].mData);
						if ( columnDefs[i].sTitle == 'Download options' && value ) {
							// HACK: Skip it for now, we should store it somewhere, or WEBS should send it for us
								continue;
							/*
							// Snippet to handle download options depending on current search area
								var downloadOptions = new DownloadOptions();
								downloadOptions.initFromUrl(value);
								var value = downloadOptions.getParameters();
								if ( !value.length )
									value = "No download options";
							*/
							
						}

						if (value) {
							content += '<p>' + columnDefs[i].sTitle + ': <span title="'+value+'">' + value + '</span></p>';
						}
					}
				}
			} else {
				content += '<p>Date: ' + Configuration.getMappedProperty(product, "start") + '</p>';
			}
		} else {
			content = products.length + " products picked.<br>Click again to cycle through products.";
			if (adv) {
				content += "<p>Products: </p>";
				for (var i = 0; i < products.length; i++) {
					content += "<p title='"+ products[i].id +"'>" + products[i].id + "</p>";
				}
			}
		}


		var hasSelected = _.find(products, function(feature) { return feature._featureCollection.isSelected(feature); });
		if ( hasSelected ) {
			element.find('#mpButtons button[data-icon="check"]').parent().addClass('ui-btn-active');
		} else {
			element.find('#mpButtons button[data-icon="check"]').parent().removeClass('ui-btn-active');
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
	this.open = function(highlightedFeatures) {

		products = highlightedFeatures;

		// Clean-up previous state
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

	/**
	* Depending on the feature list, if empty, close the dialog, otherwise open the dialog and update content
	*/
	this.openOrCloseDialog = function(featuresList) {
		if (featuresList.length == 0) {
			this.close();
		} else {
			this.open(featuresList);
		}
	};

	SearchResults.on('reset:features', this.close, this);

};

module.exports = MapPopup;