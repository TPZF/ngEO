define(
		[ 'jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'dataAccess/widget/directDownloadWidget', 'searchResults/widget/downloadOptionsWidget', 'searchResults/widget/exportWidget', 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, DatasetSearch, SimpleDataAccessRequest, DownloadManagersWidget,
			DirectDownloadWidget, DownloadOptionsWidget, ExportWidget ) {

$.fn.dataTableExt.oPagination.four_button = {
    /*
     * Function: oPagination.four_button.fnInit
     * Purpose:  Initalise dom elements required for pagination with a list of the pages
     * Returns:  -
     * Inputs:   object:oSettings - dataTables settings object
     *           node:nPaging - the DIV which contains this pagination control
     *           function:fnCallbackDraw - draw function which must be called on update
     */
    "fnInit": function ( oSettings, nPaging, fnCallbackDraw )
    {
		var $first = $('<a id="dataTables_First">First</a>').appendTo(nPaging);
		var $prev = $('<a id="dataTables_Previous">Previous</a>').appendTo(nPaging);
		var $next = $('<a id="dataTables_Next">Next</a>').appendTo(nPaging);
		var $last = $('<a id="dataTables_Last">Last</a>').appendTo(nPaging);
		
		$(nPaging).find('a')
			.attr({
				"data-mini": "true",
				"data-role": "button",
				"data-inline": "true"
			}).button();
		
         
         $first.click( function () {
            oSettings.oApi._fnPageChange( oSettings, "first" );
            fnCallbackDraw( oSettings );
        } );
         
        $prev.click( function() {
            oSettings.oApi._fnPageChange( oSettings, "previous" );
            fnCallbackDraw( oSettings );
        } );
         
        $next.click( function() {
            oSettings.oApi._fnPageChange( oSettings, "next" );
            fnCallbackDraw( oSettings );
        } );
         
       $last.click( function() {
            oSettings.oApi._fnPageChange( oSettings, "last" );
            fnCallbackDraw( oSettings );
        } );
   },
     
    /*
     * Function: oPagination.four_button.fnUpdate
     * Purpose:  Update the list of page buttons shows
     * Returns:  -
     * Inputs:   object:oSettings - dataTables settings object
     *           function:fnCallbackDraw - draw function which must be called on update
     */
    "fnUpdate": function ( oSettings, fnCallbackDraw )
    {
        if ( !oSettings.aanFeatures.p )
        {
            return;
        }
         
		if ( oSettings._iDisplayStart === 0 )
		{
			$('#dataTables_First').addClass('ui-disabled');
			$('#dataTables_Previous').addClass('ui-disabled');
		}
		else
		{
			$('#dataTables_First').removeClass('ui-disabled');
			$('#dataTables_Previous').removeClass('ui-disabled');
		}
		 
		if ( oSettings.fnDisplayEnd() == oSettings.fnRecordsDisplay() )
		{
			$('#dataTables_Next').addClass('ui-disabled');
			$('#dataTables_Last').addClass('ui-disabled');
		}
		else
		{
			$('#dataTables_Next').removeClass('ui-disabled');
			$('#dataTables_Last').removeClass('ui-disabled');
		}
    }
};
			
/**
 * The model is the backbone model SearchResults 
 */
var SearchResultsTableView = Backbone.View.extend({

	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize : function() {
		this.model.on("reset:features", function() {
			this.table.fnClearTable();
			this.$el.panel('update');
		}, this);
		this.model.on("add:features", function(features) {
			this.table.fnAddData( features );
			this.table.fnAdjustColumnSizing( true );
			this.$el.panel('update');
		}, this);
		this.model.on("selectFeatures", this.toggleSelection, this );
		this.model.on("unselectFeatures", this.toggleSelection, this );
	},

	/**
	 * Manage events on the view
	 */
	events : {
			
		'click tr' : function (event) {
		
			var $row = $(event.currentTarget);
			if ( $row.hasClass('row_selected') ) {
				return; // Nothing to do
			}
			
			// Remove previous selection
			this.table.find('.row_selected').removeClass('row_selected');
			
			var feature = this.getFeatureFromRow(event.currentTarget);
			if (feature != null) {
				this.model.highlight(feature);
				$row.addClass('row_selected');
			}
		},
		
		'dblclick tr' : function (event) {
			var feature = this.getFeatureFromRow(event.currentTarget);
			if (feature != null) {
				this.model.trigger("zoomToFeature", feature);
			}
		},
		
		// Called when the user clicks on the checkbox of the dataTables
		'click .dataTables_chekbox' : function(event){
			// retreive the position of the selected row
			var feature = this.getFeatureFromRow( $(event.currentTarget).closest('tr').get(0) );
			if ( $(event.currentTarget).hasClass('ui-icon-checkbox-off') ) {
				this.model.select( feature );
			} else {
				this.model.unselect( feature );
			}
		}, 
		
		//Called when the user clicks on the product id of an item
		'click .ui-direct-download' : function(event){
			var feature = this.getFeatureFromRow( $(event.currentTarget).closest('tr').get(0) );
			//console.log("Selected Feature");
			//console.log(this.model.get('features')[rowPos]);
			//console.log("Selected url");
			var featureArray = [];
			featureArray.push(feature);
			//console.log(this.model.getProductUrls(featureArray)[0]);
			var directDownloadWidget = new DirectDownloadWidget(this.model.getProductUrls(featureArray)[0]);
			directDownloadWidget.open(event);
		}, 
	
	},
	
	/**
	 * Get the feature from the table row
	 */
	getFeatureFromRow: function(row) {
		var rowPos = this.table.fnGetPosition( row );
		if (rowPos != null) {
			return this.model.features[rowPos];
		} else {
			return null;
		}
	},
			
	/**
	 * Toggle selection for the given features
	 */
	toggleSelection: function(features) {
		var checkboxes = this.table.$(".dataTables_chekbox",{order: "original"});
		for ( var i = 0; i < features.length; i++ ) {
			var index = this.model.features.indexOf(features[i]);
			checkboxes.eq(index)
				.toggleClass('ui-icon-checkbox-off')
				.toggleClass('ui-icon-checkbox-on');	
		}
		
		// Disable export if no product selected
		if ( this.model.selection.length > 0 ) {
			this.exportButton.button('enable');
		} else {
			this.exportButton.button('disable');
		}
		
		//Disable the retrieve Product and download options button if no product item is selected 
		//and/or if the products checked do not have a product url
		if ( this.model.getProductUrls(this.model.selection).length == 0 ) {
			this.retrieveProduct.button('disable');
			this.downloadOptionsButton.button('disable');
		} else {
			this.retrieveProduct.button('enable');
			this.downloadOptionsButton.button('enable');
		}
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		// Add the table
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" id="datatable"></table>');

		// Take column definitions from Configuration
		// Add checkbox as first colum
		var columnsDef = [{	'sTitle' : '', 'bSortable': false, 'mData': null, 'sWidth': '16px', 'sDefaultContent': '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>' }];
		columnsDef = columnsDef.concat( Configuration.data.resultsTable.columnsDef );
		
		// Add a default content for each row to avoid error messages
		for ( var i = 1; i < columnsDef.length; i++ ) {
			columnsDef[i].sDefaultContent = "None";
		}

		this._currentLength = 5;
		
		// Build basic parameters for dataTables
		var parameters = {
			"aaData" : this.model.features,
			"aoColumns" : columnsDef, 
			"bDestroy": true,
			"bSort" : true,
			"autoWidth": true,
			"fnCreatedRow": function( nRow, aData, iDataIndex ) {
				var selector = "td:eq(" + Configuration.localConfig.directDownload.productColumnIndex + ")";
				if (self.model.isBrowserSupportedUrl( self.model.features[iDataIndex])){
					$(nRow).find(selector).addClass("ui-direct-download");
				}
			}
		};
		
		// Configure dataTables for pagination or not
		if ( Configuration.data.resultsTable.pagination ) {
			_.extend(parameters, {
				"sDom" : '<"top"i>t<"bottom"lpf><"clear">',
				"aLengthMenu": [5, 10, 25],
				"iDisplayLength": this._currentLength,	
				"bLengthChange" : true,
				"bPaginate" : true,
				"sPaginationType": "four_button",
				"fnDrawCallback": function( oSettings ) {
					if (oSettings._iDisplayLength != this._currentLength) {
						self.$el.panel('update');
					}
				}	
			});
		} else {
			_.extend(parameters, {
				"sDom" : '<"top"f>t<"clear">',
				"sScrollY": "200px",
				"bPaginate": false,
				"bScrollCollapse": true
			});
		}
		
		var self = this;
		this.table = this.$el.find("#datatable").dataTable(parameters);
		
		if ( Configuration.data.resultsTable.pagination ) {
		
			// Add a grid layout for the dataTables footer	
			$(".bottom").addClass("ui-grid-b");
			$("#datatable_length").addClass("ui-block-a");
			$(".dataTables_paginate").addClass("ui-block-b");
			$("#datatable_filter").addClass("ui-block-c");
			
			$("#datatable_length select").attr({
				'data-inline': 'true',
				'data-mini': 'true',
			});
		}
		
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