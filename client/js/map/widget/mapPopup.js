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
var UserPrefs = require('userPrefs');
var MultipleBrowseWidget = require('searchResults/widget/multipleBrowseWidget');
var ProductService = require('ui/productService');

var MapPopup = function(container) {

	/**
	 * Private variables
	 */
	var self = this;
	var element;
	var parentElement;
	var arrow;
	var products = null;
	var isOpened = false;
	var currentIndice = null;

	element = $(
		'<div class="mapPopup">\
			<div id="mpText"></div>\
			<div id="mpButtons"></div>\
		</div>');

	// Wrap with the parent div for widget
	element.wrap("<div id='mapPopup'></div>");
	parentElement = element.parent();

	// Add buttons for some simple actions

	// Select
	btn = $("<a class='check' title='Pin/Unpin products'><span></span></a>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			
			var isSelected = $(this).hasClass('select');
			// Update button's layout
			if (isSelected) {
				$(this).removeClass('select');
			} else {
				$(this).addClass('select');
			}
			var _wProducts = products;
			for (var i = 0; i < _wProducts.length; i++) {  
				var p = _wProducts[i];  
				if (isSelected) {  
					p._featureCollection.unselect([p]);
				} else {  
					p._featureCollection.select([p]);
				}
			}
			self.openOrCloseDialog();
		});

	// Multiple browse management
	btn = $("<a class='browse-multiple' title='Multiple browse management'><span></span></a>")
		.appendTo(element.find("#mpButtons"))
		.click(function(event) {
			var isActive = $(this).hasClass('active');
			if (!isActive) {
				return;
			}
			MultipleBrowseWidget.open({
				feature: products[0],
				featureCollection: products[0]._featureCollection
			});
		});

	// Direct download
	btn = $("<a class='download' title='Direct download product'><span></span></a>")
		.appendTo(element.find('#mpButtons'))
		.click(function(event) {
			var isActive = $(this).hasClass('active');
			if (!isActive) {
				return;
			}
			var _productUrl = Configuration.getMappedProperty(products[0], "productUrl", null);
			window.open(_productUrl);
		});

	// DAR
	btn = $("<a class='save' title='Retrieve product'><span></span></a>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			var isActive = $(this).hasClass('active');
			if (!isActive) {
				return;
			}
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
	btn = $("<a class='shop' title='Add to shopcart'><span></span></a>")
		.appendTo(element.find('#mpButtons'))
		.click(function() {
			var isActive = $(this).hasClass('active');
			if (!isActive) {
				return;
			}
			GlobalEvents.trigger('addToShopcart', products);
		});

	parentElement.appendTo(container);
	parentElement.trigger("create");

	parentElement.hide();

	/**
	* When we hightligth feature, update information linked to those features if the dialod is open.
	* Otherwise , do nothing
	*/
	Map.on('highlightFeatures', function(highlightedFeatures) {
		self.openOrCloseDialog('highlight', highlightedFeatures);
	});
	Map.on('unhighlightFeatures', function(highlightedFeatures) {
		self.openOrCloseDialog('highlight', highlightedFeatures);
	});
	Map.on('pickedFeatures', function(pickedFeatures) {
		//self.openOrCloseDialog('pick', pickedFeatures);
	});

	/**
	* When we unselect features, just close the window
	*/
	
	Map.on('unselectFeatures', function() {
		self.openOrCloseDialog('select', []);
	});

	Map.on('selectFeatures', function(selectedFeatures) {
		self.openOrCloseDialog('select', selectedFeatures);
	});
	
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
	var buildContent = function(nbProducts) {

		// pin button is always active
		element.find('#mpButtons a.check').addClass('active');

		// Hide retrieve button in accordance with configuration settings
		// no downloadmanager => no retrieve button
		if (!Configuration.data.downloadManager.enable) {
			element.find('#mpButtons a.save').hide();
		}

		// disable direct download by default
		element.find('#mpButtons a.download').removeClass('active');

		var content = "";
		if (nbProducts > 1) {
			content += "" + nbProducts + " products picked.<br>Click to cycle through products.<br>";
			element.find('#mpButtons a.browse-multiple').removeClass('active');
		}

		if (nbProducts===1) {
			var product = products[0];
			// Build product title according to NGEO-1969
			var productTitle = '';
			var param = Configuration.getMappedProperty(product, "sensor");
			if (param) {
				productTitle += param + ' / ';
			}
			param = Configuration.getMappedProperty(product, "operationalMode");
			if (param) {
				productTitle += param + ' / ';
			}
			param = Configuration.getMappedProperty(product, "productType");
			if (param) {
				productTitle += param;
			}
			content += '<p><b>' + productTitle + '</b></p>';
			var columnDefs = Configuration.data.tableView.columnsDef;
			for (var i = 0; i < columnDefs.length; i++) {
				if (columnDefs[i].sTitle != 'Product URL') {
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

			// Show only if product has multiple browses
			var browses = Configuration.getMappedProperty(product, "browses");
			if ( browses && browses.length > 1 ) {
				element.find('#mpButtons a.browse-multiple').addClass('active');
			} else {
				element.find('#mpButtons a.browse-multiple').removeClass('active');
			}

			// activate direct download if productUrl exists
			var productUrl = Configuration.getMappedProperty(product, "productUrl", null);
			if (productUrl !== null) {
				element.find('#mpButtons a.download').addClass('active');
			}

			var isSelected = product._featureCollection.isSelected(product);
			if (isSelected) {
				element.find('#mpButtons a.check').addClass('select');
			} else {
				element.find('#mpButtons a.check').removeClass('select');
			}

		} else {
			content += "<p>Products: </p>";
			var isAllSelected = true;
			for (var i = 0; i < products.length; i++) {
				var _product = products[i];
				content += "<p class='oneproduct' title='"+ _product.id +"'>";
				var type = Configuration.getMappedProperty(_product, "productType", null);
				if (type !== null) {
					content += type + " / ";
				} else {
					var sensor = Configuration.getMappedProperty(_product, "sensor", null);
					if (sensor !== null) {
						content += sensor + ' / ';
					}
				}
				content += Configuration.getMappedProperty(_product, "start");
				content += "</p>";
				var isSelected = _product._featureCollection.isSelected(_product);
				if (!isSelected) {
					isAllSelected = false;
				}
			}
			if (isAllSelected) {
				element.find('#mpButtons a.check').addClass('select');
			} else {
				element.find('#mpButtons a.check').removeClass('select');
			}

		}

		// if feature is highlighted >> save and shop are enable
		var isHighlighted = _.find(products, function(feature) { return feature._featureCollection.isHighlighted(feature); });
		if ( isHighlighted ) {
			element.find('#mpButtons a.save').addClass('active');
			element.find('#mpButtons a.shop').addClass('active');
		} else {
			element.find('#mpButtons a.save').removeClass('active');
			element.find('#mpButtons a.shop').removeClass('active');
		}

		/*
		var isMultipleBrowsed = _.find(products, function(feature) {
			var browses = Configuration.getMappedProperty(feature, "browses");
			var bDisplay = false;
			if (browses && browses.length > 0 && browses[0] !== undefined) {
				_.each(browses, function(browse) {
					let url = browse.BrowseInformation.fileName.ServiceReference["@"]["href"];
					if (url.indexOf('SERVICE') > -1) {
						bDisplay = true;
					}
				});
			}
			return bDisplay;
		});
		if ( isMultipleBrowsed ) {
			element.find('#mpButtons a.browse-multiple').addClass('active');
		} else {
			element.find('#mpButtons a.browse-multiple').removeClass('active');
		}
		*/

		// NGEO-1770: No retrieve button if selection contains at least one planned product or product url doesn't exist
		var hasPlannedOrNoProductUrl = _.find(products, function(feature) {
			return Configuration.getMappedProperty(feature, "status", null) == "PLANNED" ||
				!Configuration.getMappedProperty(feature, "productUrl");
		});
		if (hasPlannedOrNoProductUrl) {
			element.find('#mpButtons a.save').removeClass('active');
		}
		element.find('#mpText').html(content);
	};


	/**
		Open the popup
	 */
	this.open = function(featuresList) {

		products = featuresList;

		buildContent(products.length);

		parentElement.fadeIn();
		//parentElement.show();

		isOpened = true;
	};


	/**
		Close the popup
	 */
	this.close = function() {

		if (isOpened) {
			parentElement.stop(true).fadeOut();
			isOpened = false;
		}

	};

	/**
	* Depending on the feature list, if empty, close the dialog, otherwise open the dialog and update content
	*/
	this.openOrCloseDialog = function(from, featuresList) {
		if (from !== 'pick') {
			featuresList = ProductService.getHighlightedProducts();
		}
		if (!featuresList || featuresList.length == 0) {
			this.close();
		} else {
			this.open(featuresList);
		}
	};

	SearchResults.on('reset:features', this.close, this);

};

module.exports = MapPopup;