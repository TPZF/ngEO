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
									
									if ($("#browseSlider").val() == "on"){
										var tab = [];
										tab.push(this.model.attributes.features[rowPos]);
										this.searchResults.trigger("displayBrowse", true, tab);
									}
								}
							},

							'click img' : function(event){
								console.log($(event.currentTarget));
//								$(event.currentTarget).removeAttribute('class');
//								$(event.currentTarget).addAttribute('class', 'ui-icon ui-icon-shadow ui-icon-checkbox-off');	
//								this.table.fnDraw();
//								}else{
//									$target.addClass('ui-icon-checkbox-off');	
//									$target.removeClass('ui-icon-checkbox-on');	
//								}
								
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
										      "sLengthMenu": "Show:_MENU_ "
										},
										"bDestroy": true,
										"iDisplayLength": 5,	
										"bLengthChange" : true,
										"bPaginate" : true,
										//"sPaginationType": "full_numbers",
										"bSort" : true,
										"fnDrawCallback": function( oSettings ) {
											$("#datatable_next").trigger('create');
											$("#datatable_previous").trigger('create');
											
											$("#datatable_filter input").attr('data-mini','true');
											$("#datatable_filter label").attr('data-mini','true');
											
											$("#datatable_filter label").trigger('create');
											$("#datatable_filter input").trigger('create');
											
											$("#datatable_length select").attr('data-mini','true');
											$("#datatable_length label").attr('data-mini','true');
											
											$("#datatable_length select").trigger('create');
											$("#datatable_length label").trigger('create');
											//$("#datatable_length").trigger('create');
											//$("#datatable_info").trigger('create');
											//$("bottom").trigger('create');
											//$("#datatable").trigger('create');
											self.$el.trigger('create');// to insure that JQM styling is still kept
										 },			
										
										"fnRowCallback" : function(nRow, aData,
												iDisplayIndex,
												iDisplayIndexFull) {
											
											_.each(aData, function(cellValue, index){
												
												if (index == 0){
													$('td:eq(0)', nRow)
													.html(
//															'<label id="'+aData[1]+'Label" for="' + aData[1] + '" style="max-width:37px, width:5%, border:0" data-iconpos="top" data-corners="false" data-theme="d"></label>' +
//															'<input type="checkbox" id="' + aData[1] + '" style="max-width:37px, width:5%, border:0" data-mini="true" data-corners="false" data-theme="d">');
															'<img id="'+aData[1]+'Label" style="text-inline : center" data-corners="false" data-icon="check"  class="ui-icon ui-icon-checkbox-on "></img>');
												}else{
													$('td:eq(' + index + ')', nRow)
													.html('<label data-mini="true" data-theme="d" style="width:8%">' + cellValue +'</label>');
												}
											});
										}
									});

//							$("#datatable th").attr("class", "ui-btn");
//							$("#datatable th").attr("data-inline", "true");
							
							//trial for styling the bottom datatable toolbar not working as expected neither !!
							console.log( "bottom div");
							 console.log($("bottom"));
							$(".bottom").attr("data-role", "footer");
							$(".bottom").attr("data-theme", "a");
							$(".bottom").addClass("ui-grid-d");
							//
							
							//$("#datatable_length").text( function(index, text) {return "Show entries :";});
							$("#datatable_length").attr("data-role", "fieldcontain");				
							$("#datatable_length").attr("style" , "width:13%");
							$("#datatable_length").addClass("ui-block-a");
							$("#datatable_length").attr("data-theme", "d");
							//$("#datatable_length").attr("data-mini", "true");
							$("#datatable_length label").attr("data-mini", "true");
						//$("#datatable_length label").attr("style" , "width:50%");
							$("#datatable_length label").attr("data-inline", "true");
							$("#datatable_length select").attr("data-mini", "true");
							$("#datatable_length select").attr("data-theme", "d");
							//add check box for displaying footprints
							$(".bottom").append('<div class="ui-block-b"><div data-role="fieldcontain" data-inline="true">'+
							'<label id="displayResultsCheckLabel" for="displayResultsCheck" style="border:0" data-mini="true" data-corner-all="false" data-theme="a">Display Results</label>'+
							'<input type="checkbox" name="displayResultsCheck" id="displayResultsCheck" data-mini="true" data-theme="d" data-corner-all="false" ></div><div>');

							//pagination
							//$("#datatable_paginate").removeClass('pzgin')
							$("#datatable_paginate").addClass("ui-block-c");
							
							$("#datatable_previous").attr("href", "#");
							$("#datatable_previous").attr("data-mini", "true");
							$("#datatable_previous").attr("data-role", "button");
							$("#datatable_previous").attr("data-theme", "d");
							$("#datatable_previous").attr("data-icon", "arrow-l");
							$("#datatable_previous").attr("data-iconpos", "left");
							$("#datatable_previous").attr("data-inline", "true");
							
							$("#datatable_next").attr("href", "#");
							$("#datatable_next").attr("data-theme", "d");
							$("#datatable_next").attr("data-mini", "true");
							$("#datatable_next").attr("data-role", "button");
							$("#datatable_next").attr("data-icon", "arrow-r");
							$("#datatable_next").attr("data-iconpos", "right");
							$("#datatable_next").attr("data-inline", "true");
							
							//styling of filter
							$("#datatable_filter").addClass("ui-block-d");
							$("#datatable_filter input").attr("data-mini", "true");
							$("#datatable_filter").attr("data-mini", "true");
							$("#datatable_filter input").attr("data-theme", "d");
							
							
//							$("#datatable_filter input").trigger('create');
//							$("#datatable_length select").trigger('create');
//							$("#datatable_next").trigger('create');
//							$("#datatable_previous").trigger('create');
							//$(".bottom").trigger('create');// to insure that JQM styling is still kept

							this.table.fnDraw();
							
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
								self.searchResultsView.close();
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
								console.log(self.getSeletctedFeaturesTable());
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