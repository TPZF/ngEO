/**
 * Gazetteer module.
 * The function to define the Gazetteer module
 */


var Configuration = require('configuration');

/**
 * Private function
 */

/**
 * Public interface
 */
module.exports = {

	/**
	 * Query the gazetter and return the result in a callback
	 */
	query: function(options) {

		var queryUrl = 'https://nominatim.openstreetmap.org/search?';
		queryUrl += 'q=' + encodeURIComponent(options.query);
		queryUrl += '&format=json';
		if (Configuration.data.gazetteer.outputPolygon) {
			queryUrl += '&polygon_text=1';
		}
		queryUrl += '&limit=' + Configuration.data.gazetteer.maxResults;

		$.ajax({
			url: queryUrl,
			dataType: 'jsonp',
			jsonp: 'json_callback',
			timeout: Configuration.data.gazetteer.timeout, // Timeout is needed to have an error callback
			success: function(data) {
				if (options.result) {
					options.result(data);
				}
			},
			error: function() {
				if (options.result) {
					options.result([]);
				}
			}
		});

	},

};