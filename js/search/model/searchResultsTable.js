/**
 * results datatable model  
 */
define(
		[ 'jquery', 'backbone' ],
		function($, Backbone) {

	var SearchResultsTable = Backbone.Model
			.extend({

				defaults : {
					columns : [{ //datatable columns
						'sTitle' : '  ' ,  'sWidth': "5%" 
					}, {
						'sTitle' : 'id'
					}, {
						'sTitle' : 'Mission'
					}, {
						'sTitle' : 'Sensor',  "sContentPadding": "mmm"
					}, {
						'sTitle' : 'Start'
					}, {
						'sTitle' : 'Stop'
					}, {
						'sTitle' : 'Swath',  "sContentPadding": "mmm"
					}, {
						'sTitle' : 'Orbit',  "sContentPadding": "mmm"
					}, {
						'sTitle' : 'Pass', 
					}, {
						'sTitle' : 'Product', 
					}, {
						'sTitle' : 'Product Type',  "sContentPadding": "mmm"
					}, {
						'sTitle' : 'Status',  "sContentPadding": "mmm"
					} ],
					features : [], //geojson initial  features
					items : [], //json formatted data to display for now it is not needed
					itemValuesTable : [] //the values needed to be displayed
				},
				// { "fnRender": function ( o, val ) {
				// return "<input id type='checkbox'
				// } },
				// {'sTitle': 'Satelletite'}
				// TODO later add browse info if needed : {'sTitle':
				// 'Browse Type'}, {'sTitle': 'Browse
				// Projection'},{'sTitle': 'Browse File'}

				initialize : function(params) {
					
					var self = this;
					var items = [];
					var itemValuesTable = [];
					_.each(params.features, function(feature) {
							items.push({ 
										'id' : feature.id,
										'Mission' : feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName,
										// 'Satelletite' :
										// feature.properties.EarthObservation.EarthObservationEquipment.eop_platformSerialIdentifier,
										'Sensor' : feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName,
										// 'Footprint' :
										// feature.geometry.coordinates,
										'Start' : feature.properties.EarthObservation.gml_beginPosition,
										'Stop' : feature.properties.EarthObservation.gml_endPosition,
										// acquisition
										// equipement
										'Swath' : feature.properties.EarthObservation.EarthObservationEquipment.eop_swathIdentifier,
										// acquisition info
										'Orbit' : feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitNumber,
										'Pass' : feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitDirection,
										'Product' : feature.properties.EarthObservation.EarthObservationMetaData.eop_identifier,
										'Product Type' : feature.properties.EarthObservation.EarthObservationMetaData.eop_productType,
										'Status' : feature.properties.EarthObservation.EarthObservationMetaData.eop_status
									// browse info
									// 'Browse Type' :
									// feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_type,
									// 'Browse Projection' :
									// feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_referenceSystemIdentifier,
									// 'Browse File' :
									// feature.properties.EarthObservation.EarthObservationEquipment.EarthObservationResult.eop_BrowseInformation.eop_filename,
									});

							itemValuesTable.push([
											// 'false',
											// //add an
											// checked check
											// box
											'',
											feature.id,
											// feature.geometry.coordinates,
											feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName,
											feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName,
											feature.properties.EarthObservation.gml_beginPosition,
											feature.properties.EarthObservation.gml_endPosition,
											// feature.properties.EarthObservation.EarthObservationEquipment.eop_platformSerialIdentifier,//Satellite
											// identifier
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

					this.set({"items" : items, "itemValuesTable" : itemValuesTable , "features" : params.features});
				},

			});
	
		

	return SearchResultsTable;

});