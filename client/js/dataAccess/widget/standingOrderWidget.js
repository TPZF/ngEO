/**
 * standing order widget module Used to create a time driven or a data driven
 * standing order TODO LATER REFACTOR : TO CREATE A GENERIC WIGET
 */

define(
		[ "jquery", "configuration",
				'dataAccess/model/standingOrderDataAccessRequest',
				'dataAccess/view/standingOrderView'],
	function($, Configuration, StandingOrderDataAccessRequest,
			StandingOrderView) {

		var StandingOrderWidget = function() {

			var parentElement = $('<div id="standingOrderPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content popup-widget-background">');

			var element = $('<div id="standingOrderPopupContent"></div>');

			element.appendTo(parentElement);

			var self = this;
			/**
			 * Build the content of the popup with the standing orders view
			 */
			var buildContent = function() {

				var standingOrderView = new StandingOrderView({
					el : element,
					downloadOptions : {},
					request : StandingOrderDataAccessRequest,
					parentWidget : self
				});

				standingOrderView.render();

			};

			/**
			 * Open the popup
			 */
			this.open = function() {

				buildContent();
				parentElement.popup();

				parentElement.bind({

					popupafterclose : function(event, ui) {
						parentElement.remove();
					}

				});

				// trigger jqm styling
				parentElement.popup("open");
				parentElement.trigger('create');
			};

			/**
			 * For the moment not used since the popup can be closed by
			 * clicking out side its content.
			 */
			this.close = function() {
				parentElement.popup("close");
			};
		};

		return StandingOrderWidget;

});
