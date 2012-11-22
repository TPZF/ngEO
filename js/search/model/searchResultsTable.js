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
						'sTitle' : '  ' ,  'sWidth': "5%" , 'bSortable': false
					}/*, {
						'sTitle' : 'id'
					}*/, {
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
					//items : [], //json formatted data to display for now it is not needed
					itemValuesTable : [] //the values needed to be displayed
				},

				initialize : function(params) {
					
					var self = this;
					var items = [];
					var itemValuesTable = [];
					_.each(params.features, function(feature) {
							/*	FL : Not really needed, remove it ?
							items.push({ 
										//'id' : feature.id,
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
									});*/
									
							if ( feature.properties.EarthObservation ) {
								itemValuesTable.push([
												'<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>',
												feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName,
												feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName,
												feature.properties.EarthObservation.gml_beginPosition,
												feature.properties.EarthObservation.gml_endPosition,
												feature.properties.EarthObservation.EarthObservationEquipment.eop_swathIdentifier,
												feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitNumber,
												feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitDirection,
												feature.properties.EarthObservation.EarthObservationMetaData.eop_identifier,
												feature.properties.EarthObservation.EarthObservationMetaData.eop_productType,
												feature.properties.EarthObservation.EarthObservationMetaData.eop_status
										]);
							} else {
								itemValuesTable.push([
												'<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>',
												'Empty',
												'Empty',
												feature.properties['ical:dtstart'],
												feature.properties['ical:dtend'],
												'Empty',
												feature.properties['eop:orbitNumber'],
												'Empty',
												feature.properties['dc:identifier'],
												'Empty',
												'Empty'
										]);
							}
						});

					this.set({/*"items" : items,*/ "itemValuesTable" : itemValuesTable , "features" : params.features});
				},

			});
	
		

	return SearchResultsTable;

});