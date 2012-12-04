/**
  * standing order widget module
  * Used to create a time driven or a data driven standing order
  * TODO LATER REFACTOR : TO CREATE A GENERIC WIGET 
  */


define( [ "jquery", "configuration", 'dataAccess/model/standingOrderDataAccessRequest', 
          'dataAccess/view/standingOrderView'], 
		function($, Configuration, StandingOrderDataAccessRequest, StandingOrderView) {


var StandingOrdersWidget = function() {

	var parentElement = $('<div id="standingOrderPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content popup-widget-background">');

	var element = $('<div id="standingOrderPopupContent"></div>'); 
	
	element.appendTo(parentElement);

	/**
		Build the content of the popup with the standing orders view
	 */
	var buildContent = function() {
		
		var standingOrderView = new StandingOrderView({
			el: element,
			downloadOptions : {},
			request : StandingOrderDataAccessRequest
		});
		
		standingOrderView.render();	
	
	};
		
	/**
		Open the popup
	 */
	this.open = function() {
	
		buildContent();
		parentElement.popup(); 		
			
		//after closing the popup reset the simple data access parameters 
		//and remove the popup elements
		parentElement.bind({
		   popupafterclose: function(event, ui) {
			   StandingOrderDataAccessRequest.initialize();
			   parentElement.remove();
		   }
		   
		});
		
		//trigger jqm styling
		parentElement.popup("open");  
		parentElement.trigger('create');
	};

		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

return StandingOrdersWidget;

});





