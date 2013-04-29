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
		this.model.on("reset:features", function() {
			this.table.fnClearTable();
			this.featuresToAdd = [];
			this.$el.panel('update');
		}, this);
		this.model.on("add:features", function(features) {
			if ( this.visible ) {
				this.table.fnAddData( features, false );
				this.table.fnAdjustColumnSizing( true );
				this.$el.panel('update');
			} else {
				this.featuresToAdd = this.featuresToAdd.concat( features );
			}
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
			var featureArray = [];
			featureArray.push(feature);
			//The urls to uses for the direct download are those in the eop_filename property and not in feature.properties.productUrl.
			var directDownloadWidget = new DirectDownloadWidget(this.model.getDirectDownloadProductUrls(featureArray)[0]);
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
	
		this.visible = false;
		this.featuresToAdd = [];
	
		// Add the table
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" id="datatable"></table>');

		// Take column definitions from Configuration
		// Add checkbox as first colum
		var columnsDef = [{	'sTitle' : '', 'bSortable': false, 'mData': null, 'sType': 'html', 'sWidth': '16px', 'sDefaultContent': '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>' }];
		columnsDef = columnsDef.concat( Configuration.data.resultsTable.columnsDef );
		
		// Add a default content for each row to avoid error messages
		for ( var i = 1; i < columnsDef.length; i++ ) {
			columnsDef[i].sDefaultContent = "None";
		}

		// Build parameters for dataTables
		var parameters = {
			"aaData" : this.model.features,
			"aoColumns" : columnsDef, 
			"bDestroy": true,
			"bSort" : true,
			"autoWidth": true,
			"sDom" : 't<"bottom"f>',
			"sScrollY": "200px",
			"bPaginate": false,
			"bScrollCollapse": true,
			"fnCreatedRow": function( nRow, aData, iDataIndex ) {
				var selector = "td:eq(" + Configuration.localConfig.directDownload.productColumnIndex + ")";
				if (self.model.isBrowserSupportedUrl( self.model.features[iDataIndex])){
					$(nRow).find(selector).addClass("ui-direct-download");
				}
			}
		};
				
		var self = this;
		this.table = this.$el.find("#datatable").dataTable(parameters);
	
		this.$el.panel('option','show', function() {
			if ( self.featuresToAdd.length >  0 ) {
				self.table.fnAddData( self.featuresToAdd, false );
				self.featuresToAdd.length = 0;
			}
			self.table.fnAdjustColumnSizing( true );
			self.visible = true;
		});
		this.$el.panel('option','hide', function() {
			self.visible = false;
		});		
	
		// Build the bottom : add buttons
		$(".bottom").addClass("ui-grid-a");
		$("#datatable_filter").addClass("ui-block-a");
		$("#datatable_filter input").attr("data-mini", "true");
		
		var $buttonContainer = $('<div class="ui-block-b dataTables_buttons"></div>').appendTo('.bottom');
						
		this.retrieveProduct = $('<button data-role="button" data-inline="true" data-mini="true">Retrieve Product</button>').appendTo($buttonContainer);
		this.retrieveProduct.button();
		this.retrieveProduct.button('disable');
		
		//create a simpleDataAccessRequest and assign a download manager
		this.retrieveProduct.click(function() {

			SimpleDataAccessRequest.initialize();
			SimpleDataAccessRequest.setProducts( self.model.selection );
			
			var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
			downloadManagersWidget.open();

		});
		
		//add button to the widget footer in order to download products
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable');
		
		//Displays the download options of the selected products in order to be changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.downloadOptionsButton.click(function() {
			
			var downloadOptionsWidget = new DownloadOptionsWidget();
			downloadOptionsWidget.open();

		});
		
		//add button to the widget footer in order to download products		
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
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