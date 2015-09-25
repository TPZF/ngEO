var Logger = require('logger');
var Configuration = require('configuration');
var Map = require('map/map');
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
 *				<li>Added by user within full wms request(coming from "createWmsLayerFromUrl")</li>
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
		// Layers coming from get capabilities of mapserver
		// Only layers with name attribute are accepted, otherwise it's just a group of layers
		params = {
			type: "WMS",
			name: layer.title,
			baseUrl: layer.baseUrl,
			params: {
				layers: layer.name
			}
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
	});

	return data;
};

/**
 *	Create WMS layer from url
 */
var createWmsLayerFromUrl = function(baseUrl) {

	var parsed = {};
	var params = baseUrl.split(/\?|\&/);

	_.each(params, function(param) {
		var kv = param.split("=");
		if (kv.length == 2)
			parsed[kv[0].toUpperCase()] = kv[1];
	});

	// TODO: Check SRS --> must be 4326 ?

	var wmsLayer = {
		type: parsed['SERVICE'],
		baseUrl: params[0],
		name: parsed['LAYERS'],
		title: parsed['LAYERS'],
		params: {
			layers: parsed['LAYERS'],
			format: decodeURIComponent(parsed['FORMAT']),
			style: parsed['STYLE']
		}
	}

	return wmsLayer;
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
	 *	Could be: wms mapserver url, wms url of specific layer or url to KML layer
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

			// Specific layer
			// baseUrl = "http://demonstrator.telespazio.com/wmspub?LAYERS=GTOPO&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&FORMAT=image%2Fjpeg&SRS=EPSG%3A4326&BBOX=90,0,112.5,22.5&WIDTH=256&HEIGHT=256"

			// KML
			// baseUrl = "http://quakes.bgs.ac.uk/earthquakes/recent_world_events.kml"
			baseUrl = $openedPopup.find("input[name='layerUrl']").val();

			if (baseUrl != "") {

				$openedPopup.find(".status").hide();
				var name = $openedPopup.find("input[name='layerName']").val();
				var layer = {
					name: name,
					baseUrl: baseUrl
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
			.find('a[data-icon="search"]').click(onSearch).end();

	},

	/**
	 *	Add WMS/KML layer to GUI
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

		} else if (layer.baseUrl.toUpperCase().indexOf("LAYERS=") > 0) {
			// WMS single url
			var layer = createWmsLayerFromUrl(layer.baseUrl);
			// Override title by user defined
			layer.title = layer.name;
			var item = buildItem(layer);
			addToTrees(this.$el.find("#trees"), [item]);

			if (options && options.onSuccess)
				options.onSuccess(layer);

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
		var wmsCapabilitiesFormat = new OpenLayers.Format.WMSCapabilities();
		$.ajax({
			type: "GET",
			url: layer.baseUrl,
			data: {
				SERVICE: 'WMS',
				//VERSION: '1.1.0', // No need to negociate version, since the highest one will be returned
				//@see http://cite.opengeospatial.org/OGCTestData/wms/1.1.1/spec/wms1.1.1.html#basic_elements.version.negotiation
				REQUEST: 'GetCapabilities'
			},
			success: function(doc) {

				var c = wmsCapabilitiesFormat.read(doc);
				if (!c || !c.capability) {
					if (options && options.onError)
						options.onError("Error while parsing capabilities");
					return;
				}

				var tree = buildHighCheckTreeData(c.capability.nestedLayers, layer.baseUrl);

				addToTrees(self.$el.find("#trees"), [{
					item: {
						id: layer.name,
						label: layer.name,
						checked: false
					},
					children: tree
				}]);

				if (options && options.onSuccess)
					options.onSuccess(c.capability.nestedLayers);
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
			} else if (layer.data.type == "WMS" || layer.data.type == "KML") {
				// Ordinary WMS/KML layer
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