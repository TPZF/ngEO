/**
  * Layers widget module
  */


define( [ "ngeo.configuration", "ngeo.map", "ngeo.toolbar", "ngeo.widget" ], function(Configuration, Map, ToolBar) {

return function() {

	ToolBar.addAction('layers','Layers');
/*	
		<ul data-role="listview" data-inset="true" id="layersLV">
			<li data-role="list-divider">Background imagery </li>
			<li id ="backgroundImageries"></li>
			<li id="overlays" data-role="list-divider">Overlays</li>
	</ul>	*/

	var listView = $("<ul data-role='listview' data-theme='c' data-inset='true'/>");
	listView.append("<li data-theme='c' data-role='list-divider'>Background imagery </li>");

	var select = $("<select data-theme='c' data-native-menu='false'/>"); 
	// Build background layers panel
	var bgLayers = Configuration.map.backgroundLayers;
	for ( var i=0; i < bgLayers.length; i++ ) {
		select.append("<option value='" + i + "'>"+bgLayers[i].name+"</option>");
	}
	listView.append( $("<li />").append(select) );
	listView.append("<li data-role='list-divider'>Overlays</li>");

	// Build overlays panel
	var layers = Configuration.map.layers;
	var group = $("<fieldset data-theme='c' data-role='controlgroup' />");
	for ( var i=0; i < layers.length; i++ ) {
		var input = $("<input data-theme='c' type='checkbox'" + (layers[i].visible ? "checked='checked'" : "") + ">")
			.data('id',i)
			.change(function() {
			Map.setLayerVisible($(this).data('id'),$(this).attr('checked'));
		});
		$("<label data-theme='c'>"+layers[i].name+"</label>")
			.prepend(input)
			.appendTo(group);
	}
	listView.append( $("<li data-theme='c' />").append(group) );
	
	// Implement background imageries change
	select.change( function() {
		var val = $(this).val();
		Map.setBackgroundLayer( Configuration.map.backgroundLayers[val] );
	});
	
	listView.appendTo("#layersWidget").trigger("create");
	
	// Create widget
	$("#layersWidget").ngeowidget({
		title: 'Layers',
		activator: '#layers'
	});
};
	
});





