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
		'<div class="widget-content mapPopup">\
			<div id="mpText"></div>\
			<div id="mpButtons" data-mini="true" data-role="controlgroup" data-type="horizontal"></div>\
		</div>');

	// Wrap with the parent div for widget
	element.wrap("<div id='mapPopup' class='widget'></div>");
	parentElement = element.parent();

	// Add buttons for some simple actions

	// Select
	btn = $("<button data-icon='check' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Check highlighted products</button>")
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
					p._featureCollection.unselect([p]);
					p._featureCollection.unsetHighlight([p]);
				} else {  
					p._featureCollection.select([p]);
					p._featureCollection.setHighlight([p]);
				}
			}
			self.openOrCloseDialog();
		});

	// Browse
	btn = $("<button data-icon='browse' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Display browse</button>")
		.appendTo(element.find("#mpButtons"))
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
				if (ProductService.getBrowsedProducts().indexOf(p) >= 0) {
					p._featureCollection.hideBrowses([p]);
					ProductService.removeBrowsedProducts([p]);
				} else {
					p._featureCollection.showBrowses([p]);
					ProductService.addBrowsedProducts([p]);
				}
			}
		});
	// Multiple browse management
	btn = $("<button data-icon='browse-multiple' data-iconpos='notext' data-role='button' data-inline='true' data-mini='true'>Multiple browse management</button>")
		.appendTo(element.find("#mpButtons"))
		.click(function() {
			MultipleBrowseWidget.open({
				feature: products[0],
				featureCollection: products[0]._featureCollection
			});
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
	var buildContent = function(nbProducts, indice) {

		// Show default browse / Hide multiple browse by default
		element.find('#mpButtons button[data-icon="browse"]').parent().show();
		element.find('#mpButtons button[data-icon="browse-multiple"]').parent().hide();

		var content = "";
		if (nbProducts === 1) {
			currentIndice = 0;
		} else {
			currentIndice = indice;
			content += "" + products.length + " products highlighted. <span class='ui-icon btnNext' title='Focus on next product'></span><br>";
			content += "Click on arrow to cycle through products.<br>";
		}

		if ((nbProducts > 1 && currentIndice !== null) || (nbProducts===1)) {
			var product = products[currentIndice];
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

			// Show only if product has multiple browses
			var browses = Configuration.getMappedProperty(product, "browses");
			if ( browses && browses.length > 1 ) {
				element.find('#mpButtons button[data-icon="browse-multiple"]').parent().show();
				element.find('#mpButtons button[data-icon="browse"]').parent().hide();
			}

		} else {
			content += "<p>Products: </p>";
			for (var i = 0; i < products.length; i++) {
				content += "<p title='"+ products[i].id +"'>";
				var type = Configuration.getMappedProperty(products[i], "productType", null);
				if (type !== null) {
					content += type + " / ";
				} else {
					var sensor = Configuration.getMappedProperty(products[i], "sensor", null);
					if (sensor !== null) {
						content += sensor + ' / ';
					}
				}
				content += Configuration.getMappedProperty(products[i], "start");
				content += "</p>";
			}
		}

		// if feature is highlighted >> save and shop are enable
		var isHighlighted = _.find(products, function(feature) { return feature._featureCollection.isHighlighted(feature); });
		if ( isHighlighted ) {
			element.find('#mpButtons button[data-icon="save"]').button('enable');
			element.find('#mpButtons button[data-icon="shop"]').button('enable');
		} else {
			element.find('#mpButtons button[data-icon="save"]').button('disable');
			element.find('#mpButtons button[data-icon="shop"]').button('disable');
		}
		// if feature is selected >> check button is active
		var isSelected = _.find(products, function(feature) { return feature._featureCollection.isSelected(feature); });
		if (isSelected) {
			element.find('#mpButtons button[data-icon="check"]').parent().addClass('ui-btn-active');
		} else {
			element.find('#mpButtons button[data-icon="check"]').parent().removeClass('ui-btn-active');
		}
		//active browse if feature is highlighted
		element.find('#mpButtons button[data-icon="browse"]').button('disable');

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
			element.find('#mpButtons button[data-icon="browse-multiple"]').button('enable');
		} else {
			element.find('#mpButtons button[data-icon="browse-multiple"]').button('disable');
		}

		// NGEO-1770: No retrieve button if selection contains at least one planned product or product url doesn't exist
		var hasPlannedOrNoProductUrl = _.find(products, function(feature) {
			return Configuration.getMappedProperty(feature, "status", null) == "PLANNED" ||
				!Configuration.getMappedProperty(feature, "productUrl");
		});
		if (hasPlannedOrNoProductUrl) {
			element.find('#mpButtons button[data-icon="save"]').button('disable');
		}
		element.find('#mpText').html(content);
		element.find('#mpText .btnNext').click(function() {
			var next;
			var changeDataset = false;
			if (currentIndice === null) {
				next = 0;
			} else if (currentIndice === nbProducts - 1) {
				next = null;
			} else {
				next = currentIndice + 1;
			}
			if (next !== null) {
				if (currentIndice === null) {
					changeDataset = true;
				} else if (products[currentIndice]._featureCollection.id !== products[next]._featureCollection.id) {
					changeDataset = true;
				}
				if (changeDataset) {
					if (!products[next]._featureCollection.dataset) {
						$('#shopcart').click();
					} else {
						$('#result' + products[next]._featureCollection.id).click();
					}
				}
				products[next]._featureCollection.focus(products[next]);
			}
			if (currentIndice !== null) {
				products[currentIndice]._featureCollection.unfocus(products[currentIndice]);
			}
			buildContent(nbProducts, next);
		});
	};


	/**
		Open the popup
	 */
	this.open = function(highlightedFeatures) {

		products = highlightedFeatures;

		// Clean-up previous state
		$('#info').parent().removeClass('ui-btn-active ui-focus');

		buildContent(products.length, null);

		parentElement.fadeIn();

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