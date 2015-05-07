/**
  * Background widget module
  */

define( [ "map/map", "userPrefs", "ui/widget" ], function(Map, UserPrefs, ngeoWidget) {

/**
 * The background widget
 */
var backbroundWidget;

/**
 * Function to change the background when selected
 */
var changeBackground = function() {
	var val = parseInt( $(this).val() );
	Map.setBackgroundLayer( Map.backgroundLayers[val] );
	backbroundWidget.ngeowidget("hide");
};


return function(dsa) {
	
		// Add the background widget to the data services area
		dsa.append('<div id="backgroundWidget"/>');
		
		// Build background layers panel 
		var content = $('<fieldset data-role="controlgroup"></fieldset>');
		var bgLayers = Map.backgroundLayers;
		for ( var i=0; i < bgLayers.length; i++ ) {
			// Add label
			var label = $('<label data-mini="true">' + bgLayers[i].name + '</label>')
				.appendTo(content);
			
			// Add radio button
			var input = $('<input id="' + bgLayers[i].id + '" type="radio" data-theme="c" name="background-choice" value="' + i + '" />')
				.appendTo(label);

			// Install callback when radio is clicked
			input.change(changeBackground);
		}

		backbroundWidget = $("#backgroundWidget")
			.append(content).ngeowidget({
			activator: '#background'
		});
		
		//var escapedName =  Map.getBackgroundLayer().id.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]()=>\|])/g, '\\$1');
		// Select the background used from the preferences unless select the first one
		var selector = '#' + Map.getBackgroundLayer().id;
		//check the background layer radio box 
		$(dsa).find(selector).attr('checked', true).checkboxradio("refresh");

	};

});





