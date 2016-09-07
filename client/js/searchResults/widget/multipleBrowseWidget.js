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
			for ( var i=0; i<fc.features.length; i++ ) {
				var f = fc.features[i];
				var browses = Configuration.getMappedProperty(f, "browses");
				var currentBrowse = _.find(browses, function(browse) { return browse.BrowseInformation._selected == true; });

				if ( currentBrowse && browses.indexOf(currentBrowse) != newIndex ) {
					BrowsesManager.removeBrowse(f);
					delete currentBrowse.BrowseInformation._selected;

				}

				if ( f._browseShown ) {
					browses[newIndex].BrowseInformation._selected = true;
					BrowsesManager.addBrowse(f, fc.id);
				}

			}

			fc.browseIndex = newIndex;

			if (options.onSelect) {
				options.onSelect();
			}
		});

		$popup.popup('open');
	}
};