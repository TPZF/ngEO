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
	Map.setBackgroundLayer( Configuration.map.backgroundLayers[val] );
	backbroundWidget.ngeowidget("hide");
}

return function() {
/*	
<fieldset data-role="controlgroup">
	<legend>Choose a pet:</legend>
     	<input type="radio" name="radio-choice" id="radio-choice-1" value="choice-1" checked="checked" />
     	<label for="radio-choice-1">Cat</label>

     	<input type="radio" name="radio-choice" id="radio-choice-2" value="choice-2"  />
     	<label for="radio-choice-2">Dog</label>

     	<input type="radio" name="radio-choice" id="radio-choice-3" value="choice-3"  />
     	<label for="radio-choice-3">Hamster</label>

     	<input type="radio" name="radio-choice" id="radio-choice-4" value="choice-4"  />
     	<label for="radio-choice-4">Lizard</label>
</fieldset> */

	
	// Build background layers panel
	var content = $('<fieldset data-role="controlgroup"></fieldset>');
	var bgLayers = Configuration.map.backgroundLayers;
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





