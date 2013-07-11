/**
  * MapUtils module
  */

define( function() {

	return {
		/**
		 * Compute the bbox of a feature
		 */
		computeExtent: function(feature) {
			var isMultiPolygon = feature.geometry.type == "MultiPolygon";
			// Compute the extent from the coordinates
			var coords = isMultiPolygon ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
			var minX = coords[0][0];
			var minY = coords[0][1];
			var maxX =  coords[0][0];
			var maxY =  coords[0][1];
			for ( var i = 1;  i < coords.length; i++ )	{
				minX = Math.min( minX, coords[i][0] );	
				minY = Math.min( minY, coords[i][1] );	
				maxX = Math.max( maxX, coords[i][0] );	
				maxY = Math.max( maxY, coords[i][1] );	
			}
			feature.bbox = [ minX, minY, maxX, maxY ];
		}
	};
	
});
