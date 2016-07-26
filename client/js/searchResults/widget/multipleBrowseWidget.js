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

		var browseInformation = Configuration.getMappedProperty(feature, "browseInformation");
		var $popup = $(multipleBrowse_template({
			feature: feature,
			browseInformation: browseInformation,
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
				var bi = Configuration.getMappedProperty(f, "browseInformation");
				var currentBrowse = _.findWhere(bi, { _selected: true });

				if ( currentBrowse && bi.indexOf(currentBrowse) != newIndex ) {
					BrowsesManager.removeBrowse(f);
					delete currentBrowse._selected;

				}

				if ( f._browseShown ) {
					bi[newIndex]._selected = true;
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