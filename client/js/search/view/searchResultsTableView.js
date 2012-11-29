define(
		[ 'jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers', 
		  'dataAccess/model/simpleDataAccessRequest', 'dataAccess/view/downloadManagersListView', 
		  'jquery.mobile', 'jquery.dataTables' ],
		function($, Backbone, Configuration, DownloadManagers, SimpleDataAccessRequest, DownloadManagersListView) {

			var SearchResultsTableView = Backbone.View
					.extend({

						// the model is a SearchResultsTable backbone model

						initialize : function(options) {
							this.mainView = options.mainView;
							this.searchResultsView = options.searchResultsView;
						},

						events : {
							
							'click tr' : function (event) {
								
								var rowPos = this.table.fnGetPosition(event.currentTarget);
								if (rowPos != null) {// Don't select the header
									this.table.find('.row_selected').removeClass('row_selected');
									$(event.currentTarget).toggleClass('row_selected');
									this.model.trigger("zoomToProductExtent", this.model.get('features')[rowPos]);
								}
							},
							
							// Called when the user clicks on the checkbox of the dataTables
							'click .dataTables_chekbox' : function(event){
								$(event.currentTarget).toggleClass('ui-icon-checkbox-off');
								$(event.currentTarget).toggleClass('ui-icon-checkbox-on');
								
								var rowPos = this.table.fnGetPosition( $(event.currentTarget).closest('tr').get(0) );
								if ($("#browseSlider").val() == "on"){
									this.model.trigger("displayBrowse", 
										$(event.currentTarget).hasClass('ui-icon-checkbox-on'),
										[this.model.get('features')[rowPos]]);
								}					
							}

						},

						render : function() {
							
							// Take column definitions from Configuration
							// Add checkbox as first colum
							var columnsDef = [{	'sTitle' : '', 'bSortable': false, 'mData': null, "sDefaultContent": '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>' }];
							columnsDef = columnsDef.concat( Configuration.data.resultsTable.columnsDef );

							var self = this;
							this.table = this.$el.find("#datatable").dataTable({
										"sDom" : '<"top"i>rt<"bottom"flp><"clear">',
										"aaData" : this.model.get('features'),
										"aoColumns" : columnsDef, 
										"bDestroy": true,
										"aLengthMenu": [5, 10, 25, 50],
										"iDisplayLength": 5,	
										"bLengthChange" : true,
										"bPaginate" : true,
										//"sPaginationType": "full_numbers",
										"bSort" : true,
										"fnDrawCallback": function( oSettings ) {
											// insure that JQM styling is still kept after sorting and pagination
											$("#datatable_filter input").attr('data-mini','true');
											$("#datatable_filter label").attr('data-mini','true');
											
											$("#datatable_length select").attr({
												'data-inline': 'true',
												'data-mini': 'true',
											});
											
											//enable and disable pagination buttons according to pagination status
											if($("#datatable_next").hasClass('paginate_disabled_next')){
												$("#datatable_next").addClass('ui-disabled');
											}
											
											if($("#datatable_previous").hasClass('paginate_disabled_previous')){
												$("#datatable_previous").addClass('ui-disabled');
											}											
																						
											self.$el.trigger('create');// to insure that JQM styling is still kept
										 },		
										
									});
							//Style the div of the datatable footer 	
							$(".bottom").addClass("ui-grid-b");
							$("#datatable_length").addClass("ui-block-a");
										
							//add a check box for displaying footprints styled with JQM
							/*$(".bottom").append('<div class="ui-block-b">' +
							'<label id="displayResultsCheckLabel" for="displayResultsCheck" data-inline=true style="border:0" data-mini="true" data-corner-all="false" data-theme="a">Display results on map</label>'+
							'<input type="checkbox" name="displayResultsCheck" id="displayResultsCheck" data-mini="true" data-theme="d" data-corner-all="false"></div>');
							*/
							
							//Add JQM styling for pagination elements
							$("#datatable_paginate").addClass("ui-block-b");
							//add JQM styling to the previous button
							$("#datatable_previous").attr({
								"data-mini": "true",
								"data-role": "button",
								"data-icon": "arrow-l",
								"data-iconpos": "left",
								"data-inline": "true"
							});
							//add JQM styling to the next button
							$("#datatable_next").attr({
								"data-mini": "true",
								"data-role": "button",
								"data-icon": "arrow-r",
								"data-iconpos": "right",
								"data-inline": "true"
							});
							
							//enable and disable pagination buttons according to pagination status
							if($("#datatable_next").hasClass('paginate_disabled_next')){
								$("#datatable_next").addClass('ui-disabled');
							}
							if($("#datatable_previous").hasClass('paginate_disabled_previous')){
								$("#datatable_previous").addClass('ui-disabled');
							}
							
							//add JQM styling for filter text input
							$("#datatable_filter").addClass("ui-block-c");
							$("#datatable_filter input").attr("data-mini", "true");
							
							//add button to the widget footer in order to add items to the shopcart
							this.addToShopcart = this.mainView.$el.ngeowidget(
									'addButton', {
										id : 'addToShopcart',
										name : 'Add to Shopcart',
										position: 'left'
									});
							
							// TODO for ngeo V2
							this.addToShopcart.click(function() {});

							//add button to the widget footer in order to download products
							this.retrieveProduct = this.mainView.$el
									.ngeowidget('addButton', {
										id : 'retrieve',
										name : 'Retrieve Product',
										position: 'left'
									});
							
							//create a simpleDataAccessRequest and assign a download manager
							this.retrieveProduct.click(function() {
								
								SimpleDataAccessRequest.initialize();
								SimpleDataAccessRequest.setProductURLs(self.getSelectedProductURLs());
								
								DownloadManagers.fetch().done(function() {
								
									var downloadManagersListView = new DownloadManagersListView({
										model : DownloadManagers,
										selectedDownloadManager : "",
										request : SimpleDataAccessRequest,
										parent : self
									});
									
									$("#downloadManagersPopupContent").html(downloadManagersListView.render().$el);
									$("#downloadManagersPopup").popup(); 		
									
									//after closing the popup reset the simple data access parameters 
									$( "#downloadManagersPopup" ).bind({
										   popupafterclose: function(event, ui) {
											   SimpleDataAccessRequest.initialize();
										   }
									});
									
									$("#downloadManagersPopup").popup("open");  
									//trigger jqm styling
									$("#downloadManagersPopup").trigger('create');
	
								});	
							});

							//add button to the widget footer in order to go back to the datasets
							//list and do a new search
							this.newSearch = this.mainView.$el.ngeowidget(
									'addButton', {
										id : 'newSearch',
										name : 'New Search'
									});
							
							
							this.newSearch.click(function() {
								self.close();
								self.searchResultsView.close();
								self.mainView.displayDatasets();
							});
							
							//display a popup with the search criteria already chosen for the search request
							//for the moment there is only date and time
							$("#searchCriteriaSummary").click(function(){
									
									$("#searchCriteriaPopupText").html( self.searchResultsView.datasetSearch.getSearchCriteriaSummary() );	
									$('#searchCriteriaSummaryPopup').popup("open",  $( {} )
										    .jqmData( "position-to", "window" )
										    .jqmData( "transition", "slide" ));
									$('#searchCriteriaSummaryPopup').trigger('create');
							});
														
							//if the switcher is on "On" position, display browses for the selected rows unless clear the browse layer
							$('#browseSlider').change(function(){
								self.model.trigger("displayBrowse", $("#browseSlider").val() == "on", self.getSelectedFeaturesTable());
							});

							this.$el.trigger('create');
						},

						//get the geojson features related to the selected records as a table.
						//used to trigger display browses event for map 
						getSelectedFeaturesTable : function() {
							var features = [];
							var indexes = []; //are kept here in case to change the triggering events with indexes
							var self = this;
							//var selectedNodes = this.table.$('tr.row_selected');
							var selectedNodes = this.table.$('.ui-icon-checkbox-on').closest('tr');
							
							_.each(selectedNodes, function(node, index){
								var rowPos = self.table.fnGetPosition(node);
								indexes.push(rowPos);
								features.push(self.model.get('features')[rowPos]);
							
							});
							//console.log(indexes);
							//console.log(features);
							
							return features;
						},

						/** get the list of product urls of the checked product rows */
						getSelectedProductURLs : function(){

							//var selectedNodes = this.table.$('tr.row_selected');
							var selectedNodes = this.table.$('.ui-icon-checkbox-on').closest('tr');
							
							var urls = [];
							var self = this;
							
							_.each(selectedNodes, function(node, index){
								
								var rowPos = self.table.fnGetPosition(node);
								//According to spec EarthObservationResult and eop_ProductInformation are not compalsory
								//TODO CASE WHERE THERE IS NO URL
								if (self.model.get('features')[rowPos].properties.EarthObservation.EarthObservationResult){
									if (self.model.get('features')[rowPos].properties.EarthObservation.EarthObservationResult.eop_ProductInformation){
										console.log(self.model.get('features')[rowPos]);
										console.log(self.model.get('features')[rowPos].properties.EarthObservation.EarthObservationResult.eop_ProductInformation);
										urls.push({"productURL" : self.model.get('features')[rowPos].properties.EarthObservation.EarthObservationResult.eop_ProductInformation.eop_filename});
									}else{
										urls.push({"productURL" : ""});
									}
								}
							});
							
							console.log("checked product urls length :" + urls.length);
							_.each(urls, function(url, index){
								console.log(url);
							});
							
							return urls;
						},

						close : function() {
							this.table.fnClearTable();
							this.mainView.$el.ngeowidget('removeButton',
									'#addToShopcart');
							this.mainView.$el.ngeowidget('removeButton',
									'#retrieve');
							this.mainView.$el.ngeowidget('removeButton',
									'#newSearch');

							this.undelegateEvents();
							this.$el.empty();

							if (this.onClose) {
								this.onClose();
							}
						},

						onClose : function() {
						},

					});

			return SearchResultsTableView;

		});