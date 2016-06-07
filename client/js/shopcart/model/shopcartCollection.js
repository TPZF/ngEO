/**
 * These are the model components for Shopcarts Collection handling
 */

var Configuration = require('configuration');
var Shopcart = require('shopcart/model/shopcart');
var UserPrefs = require('userPrefs');

/** This is the backbone Collection modeling the shopcart list
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
			var current = this.findWhere({ id: UserPrefs.get("Current shopcart") });
			if ( !current ) {

				// Use the default one or the first one if none has been defined
				var current = this.findWhere({
					isDefault: true
				});

				if ( !current ) {
					current = this.at(0);
				}
			}

			// Set current shopcart
			this.setCurrent(current);

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
	 *	Get the current shopcart 
	 */
	getCurrent: function() {
		return this._current;
	},

	/** 
	 *	Set the current shopcart 
	 */
	setCurrent: function(current) {
		if (current != this._current) {
			var prevCurrent = this._current;
			this._current = current;
			this.trigger('change:current', this._current, prevCurrent);
		}
	},

	/**
	 * Get the current shopcart shared URL
	 */
	getShopcartSharedURL: function() {

		return "#data-services-area/shopcart/" + this.getCurrent().id;

	},

});

module.exports = new ShopcartCollection();