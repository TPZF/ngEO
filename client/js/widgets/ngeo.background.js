/**
  * Background widget module
  */

define( [ "ngeo.configuration", "ngeo.map", "ngeo.widget" ], function(Configuration, Map) {

/**
 * The background widget
 */
var backbroundWidget;

/**
 * Function to change the background when selected
 */
var changeBackground = function() {
	var val = parseInt( $(this).val() );
	Map.setBackgroundLayer( Configuration.data.map.backgroundLayers[val] );
	backbroundWidget.ngeowidget("hide");
}

return function() {

	// Add the background widget to the data services area
	$('#dataServicesArea').append('<div id="backgroundWidget"/>');
	
	// Build background layers panel 
	var content = $('<fieldset data-role="controlgroup"></fieldset>');
	var bgLayers = Configuration.data.map.backgroundLayers;
	for ( var i=0; i < bgLayers.length; i++ ) {
		
		// Add label
		var label = $('<label>' + bgLayers[i].name + '</label>')
			.appendTo(content);
		
		// Add radio button
		var input = $('<input type="radio"  data-theme="c" name="background-choice" value="' + i + '" />')
			.appendTo(label);
			
		// Always select the first
		if ( i == 0 )
			input.attr('checked','checked');
		
		// Install callback when radio is clicked
		input.change(changeBackground);
	}
		
	backbroundWidget = $("#backgroundWidget")
		.append(content).ngeowidget({
		title: 'Background',
		activator: '#background'
	});

};
	
});





