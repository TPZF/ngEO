/**
  * LayerImport module
  */

define( [ "map/map" ], 

// The function to define the LayerImport module
function(Map ) {
	
	/**
	 * Private attributes
	 */


	/**
	 * Private methods
	 */
	 
	 /**
	  * A function to cancel default drag event.
	  * Needed when setup a droppable area.
	  */
	 var cancelDefaultDrag = function(evt) {
		  if (evt.preventDefault) { evt.preventDefault(); }
		  return false;
	 };
	 
	 var handleDrop = function(event,onload) {
		event.stopPropagation(); // Stops some browsers from redirecting.
		event.preventDefault();
		
		var files = event.dataTransfer.files;
		for (var i = 0; i < files.length; i++) {
			// Read the File objects in this FileList.
			var reader = new FileReader();
			var file = files[i];
			var ext = file.name.substr( file.name.indexOf('.')+1 );
			
			// If we use onloadend, we need to check the readyState.
			reader.onloadend = function(evt) {
			  if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			  
				// Fill the layer description
				var layerDesc = {
					name: "Imported File : " + file.name,
					type: ext,
					visible: true,
					style: "imported",
					data: evt.target.result
				};
				
				if ( !onload ) {
					//Add it to the map
					Map.addLayer( layerDesc );
				} else {
					onload( layerDesc, file );
				}
			  }
			};
			
			reader.readAsText(file);
		}	 
	};
	
	
	
	/**
	 * Public interface
	 */
	return {
	
		/**
		 * Add a drop area for import layer
		 *
		 * @param element  The HTML element for the drop area
		 * @param onload	A callback called when the layer has been successfully loaded, if no callback the layer is added to the map
		 */
		addDropArea: function(element, onload) {
			  
			// Tells the browser that we *can* drop on this target
			element.addEventListener('dragover', cancelDefaultDrag);
			element.addEventListener('dragenter', cancelDefaultDrag);			
			
			// Activate handle drop
			element.addEventListener("drop", function(event) {
				handleDrop(event,onload);
			});
		},
		
	};
});



