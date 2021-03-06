var Logger = require('logger');
var Configuration = require('configuration');
var Map = require('map/map');
var MapUtils = require('map/utils');
var UserPrefs = require('userPrefs');
//require('highchecktree');
var layerManager_template = require('account/template/layerManagerContent');
var layerSearchPopup_template = require('account/template/layerSearchPopupContent');

/**
 *	Private module variables
 */
var $openedPopup;

/**
 *	OVER UGLY METHOD to make delete action on the object for the given key=value
 */
var nestedOp = function(theObject, key, value, action) {
	var result = null;
	if (theObject instanceof Array) {
		for (var i = 0; i < theObject.length && result == null; i++) {
			result = nestedOp(theObject[i], key, value, action);
		}

		// Remove the object from the array
		if (result && action == "delete") {
			theObject.splice(i - 1, 1);
			result = false;
		}
	} else {
		for (var prop in theObject) {

			if (result != null)
				break;

			if (prop == key && theObject[prop] == value) {
				if (action == "delete") {
					console.log("Deleting " + prop + ': ' + theObject[prop]);
					theObject = undefined;
					return true;
				}

				if (action == "get") {
					console.log(prop + ': ' + theObject[prop]);
					return theObject;
				}
			}

			if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
				result = nestedOp(theObject[prop], key, value, action);
			}
		}
	}
	return result;
}

// var findObjectById = function(root, prop, value, action) {
//     if (root.nestedLayers) {
//     	for ( var i=root.nestedLayers.length-1; i>=0; i-- ) {
//     		var nLayer = root.nestedLayers[i];
//     		for ( var key in nLayer ) {
//     			if ( key == prop && nLayer[key] == value ) {
//     				if ( action == "fetch" ) {
//     					console.log("Fetching : ");
//     					return nLayer;
//     				} else {
//     					console.log("Deleting : " + key);
//     					delete nLayer;
//     					break;
//     				}
//     			} else if ( key == "nestedLayers" ) {
//     				return findObjectById( nLayer.nestedLayers, prop, value, action );
//     			}
//     		}
//     	}
//         // for (var k in root.nestedLayers) {
//         //     if (root.nestedLayers[k][prop] == value) {
//         //         if(action=="fetch") {
//         //           return root.nestedLayers[k]; 
//         //         }
//         //         else 
//         //         {
//         //         	console.log("Deleting " + k);
//         //            delete root.nestedLayers[k];
//         //         }
//         //     }
//         //     else if (root.nestedLayers[k].nestedLayers.length) {
//         //         return findObjectById(root.nestedLayers[k], prop, value, action);
//         //     }
//         // }
//     }
// }

/**
 * Callback called when a layer is checked
 */
var layerCheckedCallback = function() {
	var $this = $(this);
	$this.data('layer').setVisible($this.prop('checked'));
};

/**
 *	Build highchecktree item for the given layer
 *	@param layer
 *		Could come from 3 cases:
 *			<ul>
 *				<li>WMS layer coming from configuration</li>
 *				<li>Added by user within mapserver url(coming from "wmsCapabilitiesFormat.read")</li>
 *				<li>Added by user within full wms/wmts request(coming from "MapUtils.createWmsLayerFromUrl")</li>
 *			</ul>
 *	@return
 *		Item object for highCheckTree plugin
 */
var buildItem = function(layer) {
	var params;
	var isConfigurationLayer = layer.engineLayer;
	if (isConfigurationLayer) {
		// Already created layer by conf
		params = layer.params;
	} else if (layer.baseUrl || layer.type == "KML") {
		// WMS/KML url added by user
		params = layer;
	} else if (layer.name) {
		// Layers coming from get capabilities of WMS mapserver
		// Only layers with name attribute are accepted, otherwise it's just a group of layers
		params = {
			type: "WMS",
			name: layer.title,
			baseUrl: layer.baseUrl,
			visible: false,
			params: {
				layers: layer.name
			}
		}
	} else if (layer.tileMatrixSets && layer.identifier) {
		// Layers coming from get capabilities of WMTS mapserver

		// Get current map's projection
		var mapProjectionNumbers = [Configuration.get("map.projection").replace("EPSG:","")];

		// Add "G00gle" projection in case of Mercator
		if ( Configuration.get("map.projection") == "EPSG:3857" )
			mapProjectionNumbers.push("900913");

		// Extract the given matrix of current layer
		// Check out if mapserver(!) tileMatrixSets contains current map projection
		// NB: could have 4326 AND 3857, allows to extract matrixSet identifier
		var matrixSet = _.find(layer.tileMatrixSets, function(set) { return _.find(mapProjectionNumbers, function(projNum) { return set.supportedCRS.indexOf(projNum) >= 0 } ); });
		
		if ( matrixSet ) {
			// Check out if current layer is compatible with current map projection
			// NB: could be 3857 only
			var isCompatible = _.find(layer.tileMatrixSetLinks, function(link) { return link.tileMatrixSet == matrixSet.identifier });
			if ( isCompatible ) {
				// Add WMTS layers only compatible with current map projection
				params = {
					type: "WMTS",
					title: layer.title,
					name: layer.identifier,
					baseUrl: layer.baseUrl,
					visible: false,
					projection: Configuration.get("map.projection"),
					params: {
						layer: layer.identifier,
						matrixSet: matrixSet.identifier,
						format: layer.formats[0], // Take first one by default
						matrixIds: matrixSet.matrixIds.map(function(id) { return id.identifier })
					}
				}

				// Layer bounds should be in displayProjection -> 4326
				var boundsBase = layer.bounds ? layer.bounds : null;
				if ( boundsBase ) {
					params.bbox = [boundsBase.left, boundsBase.bottom,boundsBase.right,boundsBase.top];
				}
			} else {
				return null;
			}
		} else {
			return null;
		}
	}

	var label = params ? (params.title || params.name) : layer.title;
	return {
		item: {
			id: label,
			label: label,
			checked: isConfigurationLayer,
			layerDesc: params,
			layer: isConfigurationLayer ? layer : null
		}
	};
};

/**
 *	Creates highCheckTree structure from the given layers
 */
var buildHighCheckTreeData = function(layers, baseUrl) {
	var data = [];
	_.each(layers, function(layer) {
		var item = buildItem(layer);

		if ( item ) {
			if (item.item.layerDesc && !item.item.layerDesc.baseUrl) {
				// Update baseUrl for layers coming from GetCapabilities
				// NB: layerDesc doesn't exist for layer which serves only to group WMS layers
				item.item.layerDesc.baseUrl = baseUrl;
			}

			if (layer.nestedLayers && layer.nestedLayers.length > 0) {
				// Create children
				item.children = buildHighCheckTreeData(layer.nestedLayers, baseUrl);
			}
			data.push(item);
		}
	});

	return data;
};

/**
 *	Add a new data to trees
 */
var addToTrees = function($trees, data) {
	// Initialize high check tree
	$('<div>').appendTo($trees).highCheckTree({
		data: data,
		onCheck: function($li) {
			var layerDesc = $li.data("layerDesc");
			if (layerDesc) {

				// Store on $li to be able to remove later
				$li.data("layer", Map.addLayer(layerDesc));

				// KML layers cannot be used as background
				if (layerDesc.type == "KML") {
					$li.find("> .options").remove(); // A little bit radical..
				}
			}
		},
		onUnCheck: function($li) {
			var layer = $li.data("layer");
			var layerDesc = $li.data("layerDesc");
			if (layer) {
				Map.removeLayer(layer);
			}
		},
		onAddLi: function($li, node) {
			if (node.item.layerDesc) {
				$li.data("layerDesc", node.item.layerDesc);
			}
			if (node.item.layer) {
				$li.data("layer", node.item.layer);
			}
		},
		onDeleteLi: function($li) {
			var layer = $li.data("layer");
			var layerDesc = $li.data("layerDesc");
			if (layer) {
				Map.removeLayer(layer);
			}

			var parentName = $li.closest('.checktree').find(' > li').attr("rel");
			var userLayers = JSON.parse(UserPrefs.get("userLayers") || "[]");
			var parentLayer = _.findWhere(userLayers, {
				name: parentName
			});
			
			if ($li.attr("rel") == parentLayer.name) {
				userLayers.splice(userLayers.indexOf(parentLayer), 1);
			} else {
				nestedOp(parentLayer.data, "title", $li.attr("rel"), "delete");
			}
			UserPrefs.save("userLayers", JSON.stringify(userLayers));
		},
		options: {
			"isBackground": {
				callback: function($li, isChecked) {
					var layer = $li.data("layer");
					var layerDesc = $li.data("layerDesc");
					if (layer) {
						if (isChecked) {
							console.log("Becomes background");
							Map.removeLayer(layer);
							layerDesc.isBackground = true;
							$li.data("layer", Map.addLayer(layerDesc));
						} else {
							console.log("Becomes overlay");
							Map.removeLayer(layer);
							layerDesc.isBackground = undefined;
							$li.data("layer", Map.addLayer(layerDesc));
						}
						$li.data("layerDesc", layerDesc);
					} else {
						console.warn("NO LAYER BUILDED");
					}
				},
				labelOn: "Background",
				labelOff: "Overlay",
				type: "switch"
			}
		}
	});
};

/**
 *	Save layer to user prefs
 */
var saveLayer = function(layer, name, baseUrl) {
	// Update user prefereneces
	var userLayers = JSON.parse(UserPrefs.get('userLayers') || "[]");
	userLayers.push({
		name: name,
		baseUrl: baseUrl,
		data: layer
	});

	UserPrefs.save('userLayers', JSON.stringify(userLayers));
};

/**
 *	Layer manager view
 */
var LayerManagerView = Backbone.View.extend({

	events: {
		'click #addLayer': 'onAdd',
	},

	/**
	 *	Open popup to add layer to map
	 *	Could be: wms mapserver url, wms/wmts url of specific layer or url to KML layer
	 */
	onAdd: function(event) {

		// Create dynamic popup
		$openedPopup = $(layerSearchPopup_template()).appendTo('.ui-page-active');
		$openedPopup.popup()
			.bind("popupafterclose", function() {
				$(this).remove();
			});

		$openedPopup.popup("open").trigger("create");
		this.centerElement($openedPopup.closest('.ui-popup-container'));

		var baseUrl;
		var self = this;
		// On search callback
		var onSearch = function() {
			// Just some examples
			// Mapserver
			// baseUrl = "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi";
			// baseUrl = "http://neowms.sci.gsfc.nasa.gov/wms/wms";
			// baseUrl = "http://demonstrator.telespazio.com/wmspub";
			// baseUrl = "http://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS";

			// Specific layer (wms/wmts)
			// baseUrl = "http://demonstrator.telespazio.com/wmspub?LAYERS=GTOPO&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&FORMAT=image%2Fjpeg&SRS=EPSG%3A4326&BBOX=90,0,112.5,22.5&WIDTH=256&HEIGHT=256"
			// baseUrl = "https://c.tiles.maps.eox.at/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=terrain-light&TILEMATRIXSET=WGS84&TILEMATRIX=2&TILEROW=1&TILECOL=0&FORMAT=image%2Fpng"
			// baseUrlMercator = "https://c.tiles.maps.eox.at/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=terrain_3857&TILEMATRIXSET=g&TILEMATRIX=2&TILEROW=1&TILECOL=0&FORMAT=image%2Fpng"
			// baseUrlMercatorOL3 = "http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/";

			// KML
			// baseUrl = "http://quakes.bgs.ac.uk/earthquakes/recent_world_events.kml"
			baseUrl = $openedPopup.find("input[name='layerUrl']").val();
			var type = $openedPopup.find('input[name="capabilities-type"]:checked').val()
			if (baseUrl != "") {
				$openedPopup.find(".status").hide();
				var name = $openedPopup.find("input[name='layerName']").val();
				var layer = {
					name: name,
					baseUrl: baseUrl,
					type: type
				};
				self.addLayer(layer, {
					onError: function(message) {
						$openedPopup.find(".status").show().html(message);
					},
					onSuccess: function(layer) {
						saveLayer(layer, name, baseUrl);
						$openedPopup.popup("close");
					}
				});

			} else {
				$openedPopup.find(".status").show().html("Please enter the mapserver or KML url");
			}
		};

		// Define callbacks for the given buttons
		$openedPopup
			.find('a[data-icon="search"]').click(onSearch).end()
			.find('input[name="layerUrl"]').on('input propertychange', function(event) {
				var layerUrl = $(this).val();
				if ( layerUrl.match(/LAYER|.kml/) ) {
					// Single layer or KML url
					$openedPopup.find('form').hide();
				} else {
					// MapServer url, so show the box allowing user to choose type
					$openedPopup.find('form').show();
				}
			});

	},

	/**
	 *	Add WMS/WMTS/KML layer to GUI
	 */
	addLayer: function(layer, options) {
		if (layer.baseUrl.endsWith(".kml")) {
			// KML
			var kmlDesc = {
				// Use proxy URL to avoid CORS problem
				location: Configuration.get("proxyUrl") + layer.baseUrl,
				name: layer.name,
				type: "KML",
				visible: true
			};

			var item = buildItem(kmlDesc);
			addToTrees(this.$el.find("#trees"), [item]);

			if (options && options.onSuccess)
				options.onSuccess(kmlDesc);

		} else if (layer.baseUrl.toUpperCase().indexOf("LAYER=") > 0) {
			// WMS/WMTS single url
			var wmsLayer = MapUtils.createWmsLayerFromUrl(layer.baseUrl);
			// Override title by user defined
			wmsLayer.title = layer.name;
			var item = buildItem(wmsLayer);
			if ( item ) {
				addToTrees(this.$el.find("#trees"), [item]);

				if (options && options.onSuccess)
					options.onSuccess(wmsLayer);
			} else {
				console.warn("Something wrong happend when adding " + layer.name);
			}

		} else {
			// WMS mapserver url
			if (options) {
				// Show loading
				$.mobile.loading("show", {
					text: "Loading mapserver layers..",
					textVisible: true
				});
				options.onComplete = function() {
					$.mobile.loading("hide", {
						textVisible: false
					});
				}
			}

			// Add all layers coming from GetCapabilities request
			this.exploreCapabilities(layer, options);
		}
	},

	/**
	 *	Explore capabilities of the given baseUrl
	 */
	exploreCapabilities: function(layer, options) {

		var self = this;
		// Launch search request to explore capabilities
		$.ajax({
			type: "GET",
			url: layer.baseUrl,
			data: {
				SERVICE: layer.type,
				//VERSION: '1.1.0', // No need to negociate version, since the highest one will be returned
				//@see http://cite.opengeospatial.org/OGCTestData/wms/1.1.1/spec/wms1.1.1.html#basic_elements.version.negotiation
				REQUEST: 'GetCapabilities'
			},
			success: function(doc) {

				var capabilities = layer.type == "WMS" ? new OpenLayers.Format.WMSCapabilities() : new OpenLayers.Format.WMTSCapabilities();
				var c = capabilities.read(doc);

				if (!c || !(c.capability || c.contents)) {
					if (options && options.onError)
						options.onError("Error while parsing capabilities");
					return;
				}

				var layers = layer.type == "WMS" ? c.capability.nestedLayers : c.contents.layers;
				
				// HACK: store tileMatrixSets on layer object for WMTS : used to extract projection on build
				if ( layer.type == "WMTS" ) {
					_.map(layers, function(layer) { layer.tileMatrixSets = c.contents.tileMatrixSets });
				}
				var tree = buildHighCheckTreeData(layers, layer.baseUrl);

				addToTrees(self.$el.find("#trees"), [{
					item: {
						id: layer.name,
						label: layer.name,
						checked: false
					},
					children: tree
				}]);

				if (options && options.onSuccess)
					options.onSuccess(layers);
			},
			error: function(r) {
				if (options && options.onError)
					options.onError("Error while searching on " + layer.baseUrl);
			},
			complete: function() {
				if (options && options.onComplete)
					options.onComplete();
			}
		});
	},

	/**
	 *	Center the given element
	 */
	centerElement: function(element) {
		$(element).css({
			'top': Math.abs((($(window).height() - $(element).outerHeight()) / 2) + $(window).scrollTop()),
			'left': Math.abs((($(window).width() - $(element).outerWidth()) / 2) + $(window).scrollLeft())
		});
	},

	/**
	 *	Add user layers
	 *	Currently method use local storage, in long term in must be something more appropriated
	 */
	addUserLayers: function() {
		var self = this;
		var userLayers = JSON.parse(UserPrefs.get("userLayers") || "[]");
		_.each(userLayers, function(layer) {
			// Check if layer contains data coming from GetCapabilities			
			if (_.isArray(layer.data)) {
				var tree = buildHighCheckTreeData(layer.data, layer.baseUrl);

				addToTrees(self.$el.find("#trees"), [{
					item: {
						id: layer.name,
						label: layer.name,
						checked: false
					},
					children: tree
				}]);
			} else if (layer.data.type == "WMS" || layer.data.type == "WMTS" || layer.data.type == "KML") {
				// Ordinary WMS/WMTS/KML layer
				self.addLayer(layer);
			} else {
				console.warn("Can't handle layer");
			}
		});
	},

	/**
	 *	Render
	 */
	render: function() {

		this.$el.append(layerManager_template());

		// Add WMS/KML layers coming from configuration to GUI
		var data = buildHighCheckTreeData(_.filter(Map.layers, function(layer) {
			return layer.params.type == "WMS" || layer.params.type == "KML";
		}));
		addToTrees(this.$el.find("#trees"), data);

		this.addUserLayers();

		this.$el.trigger('create');

		return this;
	}
});

module.exports = LayerManagerView;