define(
		[ 'jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'text!search/template/searchResultViewContent_template.html', 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, DatasetSearch, SimpleDataAccessRequest, DownloadManagersWidget,
		searchResultsView_temp ) {

		var SearchResultsTableView = Backbone.View.extend({

			initialize : function(options) {
					this.mainView = options.mainView;
					
					this.model.on("change", this.fillTable, this);
					this.model.on("selectFeatures", this.toggleSelection, this );
					this.model.on("unselectFeatures", this.toggleSelection, this );
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
					// retreive the position of the selected row
					var rowPos = this.table.fnGetPosition( $(event.currentTarget).closest('tr').get(0) );
					if ( $(event.currentTarget).hasClass('ui-icon-checkbox-off') ) {
						this.model.select( this.model.get('features')[rowPos] );
					} else {
						this.model.unselect( this.model.get('features')[rowPos] );
					}
													
					//Disable the Retrieve Product button if no product item is selected 
					//and/or if the products checked do not have a product url
					if ( SimpleDataAccessRequest.getProductUrls(this.model.selection).length == 0 ) {
						this.retrieveProduct.button('disable');
					} else {
						this.retrieveProduct.button('enable');
					}
				}

			},
				
			toggleSelection: function(features) {
				var checkboxes = this.table.$(".dataTables_chekbox",{order: "original"});
				for ( var i = 0; i < features.length; i++ ) {
					var index = this.model.get("features").indexOf(features[i]);
					checkboxes.eq(index)
						.toggleClass('ui-icon-checkbox-off')
						.toggleClass('ui-icon-checkbox-on');	
				}
			},
				
			fillTable: function() {
				this.table.fnClearTable();
				this.table.fnAddData( this.model.get('features') );
			},

			render : function() {
			
				this.$el.append(searchResultsView_temp);

				// Take column definitions from Configuration
				// Add checkbox as first colum
				var columnsDef = [{	'sTitle' : '', 'bSortable': false, 'mData': null, 'sWidth': '20px', 'sDefaultContent': '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>' }];
				columnsDef = columnsDef.concat( Configuration.data.resultsTable.columnsDef );

				var self = this;
				this.table = this.$el.find("#datatable").dataTable({
							"sDom" : '<"top"i>rt<"bottom"flp><"clear">',
							"aaData" : this.model.get('features'),
							"aoColumns" : columnsDef, 
							"bDestroy": true,
							"bAutoWidth": false,
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
				
				this.retrieveProduct.button('disable');
				
				//create a simpleDataAccessRequest and assign a download manager
				this.retrieveProduct.click(function() {

					SimpleDataAccessRequest.initialize();
					SimpleDataAccessRequest.setProducts( self.model.selection );
					
					var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
					downloadManagersWidget.open();

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
					self.mainView.displayDatasets();
				});
				
				//display a popup with the search criteria already chosen for the search request
				//for the moment there is only date and time
				$("#searchCriteriaSummary").click(function(){
						
						$("#searchCriteriaPopupText").html(DatasetSearch.getSearchCriteriaSummary() );	
						$('#searchCriteriaSummaryPopup').popup("open",  $( {} )
								.jqmData( "position-to", "window" )
								.jqmData( "transition", "slide" ));
						$('#searchCriteriaSummaryPopup').trigger('create');
				});

				this.$el.trigger('create');
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
			},

	});

	return SearchResultsTableView;

});