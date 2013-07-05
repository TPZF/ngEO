/**
  * generic action widget
  * 
  */


define( [ "jquery", "configuration"], 
		function($, Configuration) {

//FIXME EMNA
var ActiontWidget = function(widgetTitle, view) {

	var parentElement = $('<div id="actionPopup">');
	view.$el.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	parentElement.ngeowidget({
		
		title: widgetTitle,
		
		hide: function() {
			view.$el.empty();
			//parentElement.remove();
		}
	});
	
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		view.render();	
		//trigger jqm styling
		parentElement.ngeowidget("show"); 
	};
		

	this.close = function() {
		parentElement.ngeowidget("hide");
	};
};

return ActiontWidget;

});





