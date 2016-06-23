/**
 * Shopcart selection widget module
 */
var ShopcartCollection = require('shopcart/model/shopcartCollection');
var shopcartPopup_template = require('shopcart/template/shopcartListPopup');

/**
 *	Popup allowing user to select shopcart
 */
module.exports = {
	open: function(options) {
		
		var $popup = $(shopcartPopup_template({
			shopcarts: ShopcartCollection
		}));

		$popup.appendTo('.ui-page-active');
		$popup.popup({
			afterclose: function(event, ui) {
				$(this).remove();
				$popup = null;
			}
		});
		$popup.trigger('create');

		$popup.find('.selectShopcart').click(function(event){
			var shopcartId = $popup.find('input:checked').attr('id');
			if ( options.onSelect ) {
				options.onSelect(ShopcartCollection.get(shopcartId));
			}
			$popup.popup('close');
		});

		$popup.popup('open', options);
	}
};