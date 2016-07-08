/**  
 * Multiple browse selection widget module  
 */

var Configuration = require('configuration');
var BrowsesManager = require('searchResults/browsesManager');
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
			browseInformation: browseInformation
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

			var currentBrowse = _.findWhere(browseInformation, { _selected: true });
			if ( currentBrowse ) {
				BrowsesManager.removeBrowse(feature);
				delete currentBrowse._selected;
			}

			var selectedIndex = parseInt($popup.find('input:checked').val());
			browseInformation[selectedIndex]._selected = true;
			BrowsesManager.addBrowse(feature, fc.id);

			if (options.onSelect) {
				options.onSelect();
			}
		});

		$popup.popup('open');
	}
};