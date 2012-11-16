define(
		[ 'jquery', 'backbone', 'search/model/datasetSearch', 'jquery.mobile' ],
		function($, Backbone, Map, DatasetSearch) {

			var SearchResultsTableView = Backbone.View
					.extend({

						// the model is a SearchResults backbone model

						initialize : function(options) {
							this.mainView = options.mainView;
							this.searchResultsView = options.searchResultsView;
							this.searchResults = options.searchResults;
						},

						events : {
							
							'click tr' : function (event) {
								
								var rowPos = this.table.fnGetPosition(event.currentTarget);
								console.log(rowPos);
								if (rowPos != null){// Don't select the header
									$(event.currentTarget).toggleClass('row_selected');
									this.searchResults.trigger("zoomToProductExtent", this.model.attributes.features[rowPos]);
									
									if ($("#browseSlider").val() == "on"){
										var tab = [];
										tab.push(this.model.attributes.features[rowPos]);
										this.searchResults.trigger("displayBrowse", true, tab);
									}
								}
							},
							
							// Called when the user clicks on the checkbox of the dataTables
							'click .dataTables_chekbox' : function(event){
								$(event.currentTarget).toggleClass('ui-icon-checkbox-off');
								$(event.currentTarget).toggleClass('ui-icon-checkbox-on');
								
							}

						},

						render : function() {

							var self = this;
							this.table = this.$el.find("#datatable").dataTable({
										"sDom" : '<"top"i>rt<"bottom"flp><"clear">',
										"aaData" : this.model
												.get("itemValuesTable"),
										"aoColumns" : this.model.get("columns"),
										"oLanguage": {
										      "sLengthMenu": "_MENU_"
										},
										"bDestroy": true,
										"iDisplayLength": 5,	
										"bLengthChange" : true,
										"bPaginate" : true,
										//"sPaginationType": "full_numbers",
										"bSort" : true,
										"fnDrawCallback": function( oSettings ) {
											// insure that JQM styling is still kept after sorting and pagination
											$("#datatable_filter input").attr('data-mini','true');
											$("#datatable_filter label").attr('data-mini','true');
											
											$("#datatable_filter label").trigger('create');
											$("#datatable_filter input").trigger('create');
											
											$("#datatable_length select").attr('data-mini','true');
											$("#datatable_length label").attr('data-mini','true');
											
											//enable and disable pagination buttons according to pagination status
											if($("#datatable_next").hasClass('paginate_disabled_next')){
												$("#datatable_next").addClass('ui-disabled');
											}
											
											if($("#datatable_previous").hasClass('paginate_disabled_previous')){
												$("#datatable_previous").addClass('ui-disabled');
											}											
											
											$("#datatable_length select").trigger('create');
											$("#datatable_length label").trigger('create');
											
											self.$el.trigger('create');// to insure that JQM styling is still kept
										 },			
										
										"fnRowCallback" : function(nRow, aData,
												iDisplayIndex,
												iDisplayIndexFull) {
											
											_.each(aData, function(cellValue, index){
												//add a check box in the first cell of each row
												//style the other cell labels with JQM
												if (index == 0){
													$('td:eq(0)', nRow)
													.html('<span id="'+aData[1]+'Label" class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>');
												}else{
													$('td:eq(' + index + ')', nRow)
													.html('<label data-mini="true" data-theme="d" style="width:8%">' + cellValue +'</label>');
												}
											});
										}
									});
							//Style the div of the datatable footer 	
							$(".bottom").attr("data-role", "footer");
							$(".bottom").attr("data-theme", "d");
							$(".bottom").addClass("ui-grid-c");
							$(".bottom").trigger('create');
							
							//$("#datatable_length").attr("data-role", "fieldcontain");				
							//$("#datatable_length").attr("style" , "width:13%");
							$("#datatable_length").addClass("ui-block-a");
							$("#datatable_length").attr("data-theme", "d");
							
//							$("#datatable_length").append('<div '+
//									'<label id="nbEntries" data-inline=true style="border:0" data-mini="true" data-corner-all="false" data-theme="d">: displayed records</label>'+
//									'</div>');

							$("#datatable_length label").attr("data-mini", "true");
							//$("#datatable_length label").attr("style" , "width:50%");
							$("#datatable_length label").attr("data-inline", "true");
							$("#datatable_length label").trigger('create');
							$("#datatable_length select").attr("data-mini", "true");
							$("#datatable_length select").attr("data-theme", "d");
							$("#datatable_length select").attr("data-theme", "d");
							//add a check box for displaying footprints styled with JQM
							$(".bottom").append('<div class="ui-block-b">' +
							'<label id="displayResultsCheckLabel" for="displayResultsCheck" data-inline=true style="border:0" data-mini="true" data-corner-all="false" data-theme="a">Display results on map</label>'+
							'<input type="checkbox" name="displayResultsCheck" id="displayResultsCheck" data-mini="true" data-theme="d" data-corner-all="false"></div>');

//							$(".bottom").append('<div class="ui-block-b">' +
//									'<label data-inline=true style="border:0" data-mini="true" data-corner-all="false" data-theme="b">displayed records</label>'+
//									</div>');

							
							//Add JQM styling for pagination elements
							$("#datatable_paginate").addClass("ui-block-c");
							//add JQM styling to the previous button
							$("#datatable_previous").attr("href", "#");
							$("#datatable_previous").attr("data-mini", "true");
							$("#datatable_previous").attr("data-role", "button");
							$("#datatable_previous").attr("data-theme", "d");
							$("#datatable_previous").attr("data-icon", "arrow-l");
							$("#datatable_previous").attr("data-iconpos", "left");
							$("#datatable_previous").attr("data-inline", "true");
							//add JQM styling to the next button
							$("#datatable_next").attr("href", "#");
							$("#datatable_next").attr("data-theme", "d");
							$("#datatable_next").attr("data-mini", "true");
							$("#datatable_next").attr("data-role", "button");
							$("#datatable_next").attr("data-icon", "arrow-r");
							$("#datatable_next").attr("data-iconpos", "right");
							$("#datatable_next").attr("data-inline", "true");

							//enable and disable pagination buttons according to pagination status
							if($("#datatable_next").hasClass('paginate_disabled_next')){
								$("#datatable_next").addClass('ui-disabled');
							}
							if($("#datatable_previous").hasClass('paginate_disabled_previous')){
								$("#datatable_previous").addClass('ui-disabled');
							}
							
							//add JQM styling for filter text input
							$("#datatable_filter").addClass("ui-block-d");
							$("#datatable_filter input").attr("data-mini", "true");
							$("#datatable_filter input").attr("data-theme", "d");
							
							//add button to the widget footer in order to add items to the shopcart
							this.addToShopcart = this.mainView.$el.ngeowidget(
									'addButton', {
										id : 'addToShopcart',
										name : 'Add to Shopcart',
										position: 'left'
									});
							
							// TODO 
							this.addToShopcart.click(function() {});

							//add button to the widget footer in order to download products
							this.retrieveProduct = this.mainView.$el
									.ngeowidget('addButton', {
										id : 'retrieve',
										name : 'Retrieve Product',
										position: 'left'
									});
							
							// TODO
							this.retrieveProduct.click(function() {});

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
							

							//display all the footprints on the map if the checkbox is checked
							$('#displayResultsCheckLabel').click(function(event){
								console.log(!$(event.currentTarget).hasClass('ui-checkbox-on'));
								self.searchResults.trigger("displayFootprints", !$(event.currentTarget).hasClass('ui-checkbox-on'), self.model.attributes.features);
							});
							
							//if the switcher is on On position, display browses for the selected rows unless clear the browse layer
							$('#browseSlider').change(function(){
								console.log( $("#browseSlider").val());
								console.log(self.getSeletctedFeaturesTable());
								self.searchResults.trigger("displayBrowse", $("#browseSlider").val() == "on", self.getSeletctedFeaturesTable());
							});

							this.delegateEvents();
							this.$el.trigger('create');
						},

						//get the geojson features related to the selected records as a table.
						//used to trigger display browses event for map 
						getSeletctedFeaturesTable : function() {
							var features = [];
							var indexes = []; //are kept here in case to change the triggering events with indexes
							var self = this;
							var selectedNodes = this.table.$('tr.row_selected');
							
							_.each(selectedNodes, function(node, index){
								var rowPos = self.table.fnGetPosition(node);
								indexes.push(rowPos);
								features.push(self.model.attributes.features[rowPos]);
							
							});
							//console.log(indexes);
							//console.log(features);
							
							return features;
			
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