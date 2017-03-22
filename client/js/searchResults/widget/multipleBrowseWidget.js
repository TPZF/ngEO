/**  
 * Multiple browse selection widget module  
 */

var Configuration = require('configuration');
var BrowsesManager = require('searchResults/browsesManager');
var MapUtils = require('map/utils');
var multipleBrowse_template = require('searchResults/template/multipleBrowseContent');

/**  
 *  Popup allowing user to select browse
 */
module.exports = {
	open: function(options) {

		var feature = options.feature;
		var fc = options.featureCollection;

		var browses = Configuration.getMappedProperty(feature, "browses");
		var $popup = $(multipleBrowse_template({
			feature: feature,
			browses: browses,
			MapUtils: MapUtils
		}));

		$popup.appendTo('.ui-page-active');
		$popup.popup({
			afterclose: function(event, ui) {
				$(this).remove();
				$popup = null;
			}
		});
		$popup.trigger('create');

		$popup.find('.selectBrowse').click(function(event) {

			$popup.popup('close');
			var newIndex = parseInt($popup.find('input:checked').val());

			var checkedBrowseIdx = [];

			var selectedIndices = _.toArray($popup.find('input:checked').map(function(i, elem) { return parseInt($(elem).val()) }));
			var notSelectedIndices = _.toArray($popup.find('input:not(:checked)').map(function(i, elem) { return parseInt($(elem).val()) }));
			for ( var i=0; i<fc.features.length; i++ ) {
				// Feature loop
				var f = fc.features[i];
				var browses = Configuration.getMappedProperty(f, "browses");

				if ( f._featureCollection.isHighlighted(f) ) {
					BrowsesManager.addBrowse(f, fc.id, selectedIndices);
					BrowsesManager.removeBrowse(f, notSelectedIndices);
				}
			}
			fc.browseIndex = selectedIndices;

			if (options.onSelect) {
				options.onSelect();
			}
		});

		$popup.popup('open');
	}
};