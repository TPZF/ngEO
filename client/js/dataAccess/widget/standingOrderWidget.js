/**
 * standing order widget module Used to create a time driven or a data driven
 * standing order TODO LATER REFACTOR : TO CREATE A GENERIC WIGET
 */

define(
		[ "jquery", "configuration",
				'dataAccess/model/standingOrderDataAccessRequest', 'dataAccess/model/downloadManagers',
				'dataAccess/view/standingOrderView', 'dataAccess/view/downloadManagersListView'],
	
		function($, Configuration, StandingOrderDataAccessRequest, DownloadManagers,
			StandingOrderView, DownloadManagersListView) {

		
		var StandingOrderWidget = function() {
				
			var parentElement = $('<div id="standingOrderPopup">');
			var element = $('<div id="standingOrderPopupContent"></div>');
			element.appendTo(parentElement);
			parentElement.appendTo('.ui-page-active');
			
			var standingOrderView;
			
			parentElement.ngeowidget({
				title: "Standing Order",
				hide: function() {
					standingOrderView.remove();
					parentElement.remove();
				}
			});

			var self = this;
			
			standingOrderView = new StandingOrderView({
				el : element,
				request : StandingOrderDataAccessRequest,
				parentWidget : self
			});
				
			/**
			 * Build the content of the popup with the standing orders view
			 */
			var buildContent = function() {

				standingOrderView.render();

			};
			
			/** 
			 * Display the list of download managers
			 * in order to chose one and validate the request.
			 */
			this.displayDownloadManagersView = function(){
				
				element.empty();
				
				DownloadManagers.fetch().done(function() {
					
					var downloadManagersListView = new DownloadManagersListView({
						model : DownloadManagers,
						el: element,
						request : StandingOrderDataAccessRequest
					});
					
					downloadManagersListView.render();		
					
				});
			};

			/**
			 * Open the popup
			 */
			this.open = function() {

				buildContent();
				// trigger jqm styling
				parentElement.trigger('create');

				parentElement.ngeowidget("show"); 
			};

			/**
			 * For the moment not used since the popup can be closed by
			 * clicking out side its content.
			 */
			this.close = function() {
				parentElement.ngeowidget("hide");
			};
		};

		return StandingOrderWidget;

});
