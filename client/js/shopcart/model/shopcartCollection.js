/**
 * These are the model components for Shopcarts Collection handling
 */

var Configuration = require('configuration');
var Shopcart = require('shopcart/model/shopcart');
var UserPrefs = require('userPrefs');

/**
 * This is the backbone Collection modeling the shopcart list
 */
var ShopcartCollection = Backbone.Collection.extend({

	model: Shopcart,

	/**
	 * Initialize the collection
	 */
	initialize: function() {
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
		// The current shopcart
		this._current = null;

		// Synchronize the current shopcart when the collection has been fetched from the server
		this.on('sync', function() {

			// Do not change the current if it is a shared one
			if (this._current && this._current.get("isShared")) {
				return;
			}

			// Check if current shopcart is defined in user prefereneces
			var selectedShopcarts = JSON.parse(UserPrefs.get("Selected shopcarts") || "[]");
			var shopcarts = this.filter(function(s) { return selectedShopcarts.indexOf(s.get('id')) >= 0 });
			if ( !shopcarts.length ) {
				// Use the default one or the first one if none has been defined
				var shopcarts = this.findWhere({
					isDefault: true
				});

				// No more already selected by default shopcart
				// if ( !current ) {
				// 	current = this.at(0);
				// }
				// shopcarts = [current];
			}

			for ( var i=0; i<shopcarts.length; i++ ) {
				var shopcart = shopcarts[i];
				this.setShopcartSelection(shopcart, true);
			}
			
		}, this);
	},

	/*fetch: function() {
		console.log('fetch');
		Backbone.Collection.prototype.fetch(this, arguments);
	},*/


	/**
	 * Needed because the server response is not what is expected from Backbone
	 */
	parse: function(response) {
		// Remove the shopCartList attributes from JSON
		if (response.shopCartList) {
			return response.shopCartList;
		} else {
			return [];
		}
	},

	/** 
	 *	Get the selected shopcarts
	 */
	getSelected: function() {
		var selectedShopcarts = _.filter(this.models, function(s) { return s._isSelected == true; });
		return selectedShopcarts;
	},

	/** 
	 *	Select/unselect the given shopcart
	 */
	setShopcartSelection: function(shopcart, isSelected) {
		if ( shopcart._isSelected != isSelected ){
			shopcart.toggleSelected();
			this.trigger('change:isSelected', shopcart);
		}
	},

	/**
	 * Get the current shopcart shared URL
	 */
	getShopcartSharedURL: function() {
		var selectedShopcarts = this.getSelected();
		if ( selectedShopcarts.length != 1 ) {
			console.warn("Invalid number of shopcarts", selectedShopcarts.length); // TODO: Handle this later..
			return null;
		}

		return "#data-services-area/shopcart/" + selectedShopcarts[0].id;

	},

});

module.exports = new ShopcartCollection();