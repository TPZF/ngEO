/**
 * Model to retrieve the search results from the server
 */
define( ['jquery', 'backbone'], function($, Backbone) {

var SearchResults = Backbone.Model.extend({
	
	defaults:{
		columns : [{'sTitle': 'id'},  {'sTitle': 'Mission'}, {'sTitle' : 'Sensor'},{'sTitle': 'Start'},{'sTitle': 'Stop'},
		          {'sTitle': 'Swath'},{'sTitle': 'Orbit'}, {'sTitle': 'Pass'},  
		          {'sTitle': 'Product'}, {'sTitle': 'Product Type'},{'sTitle': 'Status'}],
		items : [],
		itemValuesTable : []
	},

	//{'sTitle': 'Satelletite'} 
    //TODO later add browse info if needed :  {'sTitle': 'Browse Type'}, {'sTitle': 'Browse Projection'},{'sTitle': 'Browse File'}
  

	parse: function(response){
		 
		var features = response.features;
		var self = this;
		var items = [];
		var itemValuesTable = [];
		_.each(features, function(feature){
			items.push({'id' : feature.id,
						'Mission' : feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName,
						//'Satelletite' : feature.properties.EarthObservation.EarthObservationEquipment.eop_platformSerialIdentifier,
						'Sensor' : feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName,
						//'Footprint' : feature.geometry.coordinates,
						'Start' : feature.properties.EarthObservation.gml_beginPosition,
						'Stop' : feature.properties.EarthObservation.gml_endPosition,
						//acquisition equipement
						'Swath' : feature.properties.EarthObservation.EarthObservationEquipment.eop_swathIdentifier,
						//acquisition info
						'Orbit' : feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitNumber,
						'Pass' : feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitDirection,
						'Product' : feature.properties.EarthObservation.EarthObservationMetaData.eop_identifier,
						'Product Type' : feature.properties.EarthObservation.EarthObservationMetaData.eop_productType,
						'Status' : feature.properties.EarthObservation.EarthObservationMetaData.eop_status
						//browse info
//						'Browse Type' : feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_type,
//						'Browse Projection' : feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_referenceSystemIdentifier,
//						'Browse File' : feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_filename,
			});
			
			itemValuesTable.push([
			    feature.id, 
			   // feature.geometry.coordinates,
			    feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName,
			    feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName,
			    feature.properties.EarthObservation.gml_beginPosition,
				feature.properties.EarthObservation.gml_endPosition,
				//feature.properties.EarthObservation.EarthObservationEquipment.eop_platformSerialIdentifier,//Satellite identifier
				feature.properties.EarthObservation.EarthObservationEquipment.eop_swathIdentifier,
				feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitNumber,
				feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitDirection,
				feature.properties.EarthObservation.EarthObservationMetaData.eop_identifier,
				feature.properties.EarthObservation.EarthObservationMetaData.eop_productType,
				feature.properties.EarthObservation.EarthObservationMetaData.eop_status
//				,feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_type,
//				feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_referenceSystemIdentifier,
//				feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_filename
			]);
		});
		
		return {'items' : items, 'itemValuesTable' : itemValuesTable}
	},
	
});

return SearchResults;

});