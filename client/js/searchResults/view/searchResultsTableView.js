define(
		[ 'jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'dataAccess/widget/directDownloadWidget', 'searchResults/widget/downloadOptionsWidget', 'searchResults/widget/exportWidget', 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, DatasetSearch, SimpleDataAccessRequest, DownloadManagersWidget,
			DirectDownloadWidget, DownloadOptionsWidget, ExportWidget ) {

/**
 * The model is the backbone model SearchResults 
 */
var SearchResultsTableView = Backbone.View.extend({

	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize : function() {
		this.model.on("change", this.fillTable, this);
		this.model.on("selectFeatures", this.toggleSelection, this );
		this.model.on("unselectFeatures", this.toggleSelection, this );
	},

	/**
	 * Manage events on the view
	 */
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
			if ( this.model.getProductUrls(this.model.selection).length == 0 ) {
				this.retrieveProduct.button('disable');
				this.downloadOptionsButton.button('disable');
			} else {
				this.retrieveProduct.button('enable');
				this.downloadOptionsButton.button('enable');
			}
		}, 
		
		//Called when the user clicks on the product id of an item
		'click .ui-direct-download' : function(event){
			var rowPos = this.table.fnGetPosition( $(event.currentTarget).closest('tr').get(0) );
			//console.log("Selected Feature");
			//console.log(this.model.get('features')[rowPos]);
			//console.log("Selected url");
			var featureArray = [];
			featureArray.push(this.model.get('features')[rowPos]);
			//console.log(this.model.getProductUrls(featureArray)[0]);
			var directDownloadWidget = new DirectDownloadWidget(this.model.getProductUrls(featureArray)[0]);
			directDownloadWidget.open(event);
		}, 
	
	},
			
	/**
	 * Toggle selection for the given features
	 */
	toggleSelection: function(features) {
		var checkboxes = this.table.$(".dataTables_chekbox",{order: "original"});
		for ( var i = 0; i < features.length; i++ ) {
			var index = this.model.get("features").indexOf(features[i]);
			checkboxes.eq(index)
				.toggleClass('ui-icon-checkbox-off')
				.toggleClass('ui-icon-checkbox-on');	
		}
	},
		
	/**
	 * Fill the table with new results
	 */
	fillTable: function() {
		this.table.fnClearTable();
		this.table.fnAddData( this.model.get('features') );
		this.$el.panel('update');
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		// Add the table
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" id="datatable"></table>');

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

						$("#datatable tbody tr").each(function(i, elt){		
							//avoid the case where the table has not been loaded yet				
							if ($(elt).text() != "No data available in table"){
								var rowPos = self.table.fnGetPosition(elt);
								var selector = "td:eq(" + Configuration.localConfig.directDownload.productColumnIndex + ")";
								
								if (self.model.isBrowserSupportedUrl( self.model.get('features')[rowPos])){
									$(elt).find(selector).addClass("ui-direct-download");
								}
							}
						});
						
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
						self.$el.panel('update');
					 },		
					
				});
	
		//Style the div of the datatable footer 	
		$(".bottom").addClass("ui-grid-b");
		$("#datatable_length").addClass("ui-block-a");
		
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
		// TODO for ngeo V2
/*		this.addToShopcart = this.$el.ngeowidget(
				'addButton', {
					id : 'addToShopcart',
					name : 'Add to Shopcart',
					position: 'left'
				});
		this.addToShopcart.click(function() {});*/

		//add button to the widget footer in order to download products
		this.retrieveProduct = this.$el
				.panel('addButton', {
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
		
		//add button to the widget footer in order to download products
		this.downloadOptionsButton = this.$el
				.panel('addButton', {
					id : 'downloadOptionsButton',
					name : 'Download Options',
					position: 'right'
				});
		
		this.downloadOptionsButton.button('disable');
		
		//Displays the download options of the selected products in order tobe changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.downloadOptionsButton.click(function() {
			
			var downloadOptionsWidget = new DownloadOptionsWidget();
			downloadOptionsWidget.open();

		});
		
		//add button to the widget footer in order to download products
		this.exportButton = this.$el
				.panel('addButton', {
					id : 'exportButton',
					name : 'Export',
					position: 'right'
				});
		
		this.exportButton.button('disable');
		
		//Displays the download options of the selected products in order tobe changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.exportButton.click(function() {
			
			var exportWidget = new ExportWidget();
			exportWidget.open();
		});


		this.$el.trigger('create');

	}
});

return SearchResultsTableView;

});