define(
		[ 'jquery', 'backbone', 'search/model/datasetSearch', 'jquery.mobile' ],
		function($, Backbone, Map, DatasetSearch) {

			// the DatasetSearch is included in order to access the pagination
			// parameters later

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
								}
							},
						
							
							
							'click [input=checkbox]' : function(event){
								$(event.currentTarget).toggleClass('row_selected');	
							}
							
						},

						render : function() {

							var self = this;
							this.table = this.$el.dataTable({
										"sDom" : '<"top"i>rt<"bottom"flp><"clear">',
										"aaData" : this.model
												.get("itemValuesTable"),
										"aoColumns" : this.model.get("columns"),
										"bPaginate" : true,
										"bLengthChange" : true,
										"bSort" : true,
										
										"fnDrawCallback": function( oSettings ) {
											self.$el.trigger('create');// to insure that JQM styling is still kept
										 },
										 
//										 "fnPreDrawCallback": function( oSettings ) {
//											 console.log($("bottom"));
//												$(".bottom").attr("data-role", "footer");
//												$(".bottom").addClass("ui-grid-d");
//												$("#datatable_length").addClass("ui-block-a");
//												$("#datatable_paginate").addClass("ui-block-c");
//												
//												$(".bottom").append('<div class="ui-block-b"><div data-role="fieldcontain" data-inline="true">'+
//												'<label for="displayResultsCheck"  data-mini="true">Display Results</label>'+
//												'<input type="checkbox" data-mini="true" data-theme="c" name="displayResultsCheck" id="displayResultsCheck"></div><div>');
//
//												$(".bottom").trigger('create');// to insure that JQM styling is still kept
//										},
										
										"fnRowCallback" : function(nRow, aData,
												iDisplayIndex,
												iDisplayIndexFull) {
											
											_.each(aData, function(cellValue, index){
												
												if (index == 0){
													$('td:eq(0)', nRow)
													.html(
															'<label id="'+aData[1]+'Label" for="' + aData[1] + '" style="max-width:37px" data-iconpos="top" data-corners="false"></label>' +
															'<input type="checkbox" id="' + aData[1] + '" style="max-width:37px" data-mini="true" data-corners="false" data-theme="d">');
														
												}else{
													$('td:eq(' + index + ')', nRow)
													.html(
															'<label data-mini="true" data-theme="d">' + cellValue +'</label>');
												}
												//CALLED AS MUCH AS THERE ARE ITEMS SO DO NOT TRIGGER EVENT FROM HERE!
//												console.log(iDisplayIndex);
//												console.log(self.model.attributes.features[iDisplayIndex]);
//												$(nRow).click(function(){
//													console.log(self.model.attributes.features[iDisplayIndex]);
//													self.searchResults.trigger("zoomToProductExtent", self.model.attributes.features[iDisplayIndex]);});
//												self.$el.trigger('create');
											});
										}
									});

							//trial for styling the bottom datatable toolbar not working as expected neither !!
							console.log( "bottom div");
							 console.log($("bottom"));
								$(".bottom").attr("data-role", "footer");
								$(".bottom").addClass("ui-grid-d");
								//$("#datatable_length label").text( function(index, text) {return "Show entries :";});
								$("#datatable_length select").attr("data-mini", "true");
								$("#datatable_length").addClass("ui-block-a");
								
								//add check box for displaying footprints
								$(".bottom").append('<div class="ui-block-b"><div data-role="fieldcontain" data-inline="true">'+
								'<label id="displayResultsCheckLabel" for="displayResultsCheck"  data-mini="true">Display Results</label>'+
								'<input type="checkbox" data-mini="true" data-theme="c" name="displayResultsCheck" id="displayResultsCheck"></div><div>');

								$("#datatable_paginate").addClass("ui-block-c");
								
								$("#datatable_filter").addClass("ui-block-d");
								$("#datatable_filter input").attr("data-mini", "true");
								$(".bottom").trigger('create');// to insure that JQM styling is still kept

							this.addToShopcart = this.mainView.$el.ngeowidget(
									'addButton', {
										id : 'addToShopcart',
										name : 'Add to Shopcart',
										position: 'left'
									});
							
							// TODO
							this.addToShopcart.click(function() {});

							this.retrieveProduct = this.mainView.$el
									.ngeowidget('addButton', {
										id : 'retrieve',
										name : 'Retrieve Product',
										position: 'left'
									});
							
							// TODO
							this.retrieveProduct.click(function() {});

							this.newSearch = this.mainView.$el.ngeowidget(
									'addButton', {
										id : 'newSearch',
										name : 'New Search'
									});
							
							
							this.newSearch.click(function() {
								self.close();
								self.mainView.displayDatasets();
							});
							

							//display all the footprints on the map if the checkbox is checked
							$('#displayResultsCheckLabel').click(function(event){
								console.log(!$(event.currentTarget).hasClass('ui-checkbox-on'));
								self.searchResults.trigger("displayFootprints", !$(event.currentTarget).hasClass('ui-checkbox-on'), self.model.attributes.features);
							});
							
							//if the switcher is on On position, display browses for the selected rows unless clear the browse layer
							$('#browseSlider').change(function(){
								console.log( $("#browseSlider").val());
								console.log(  self.getSeletctedFeaturesTable());
								self.searchResults.trigger("displayBrowse", $("#browseSlider").val() == "on", self.getSeletctedFeaturesTable());
							});

							this.delegateEvents();
							this.$el.trigger('create');
						},

					
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