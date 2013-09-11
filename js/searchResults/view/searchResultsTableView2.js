define(
		[ 'jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'dataAccess/widget/directDownloadWidget', 'searchResults/widget/downloadOptionsWidget', 'searchResults/widget/exportWidget' ],
	function($, Backbone, Configuration, DatasetSearch, SimpleDataAccessRequest, DownloadManagersWidget,
			DirectDownloadWidget, DownloadOptionsWidget, ExportWidget ) {

/**
	Get data from a path
 */
var getData = function(product,path) {
	var names = path.split('.');
	var obj = product;
	for ( var i = 0; obj && i < names.length-1; i++ ) {
		obj = obj[ names[i] ];
	}
	if ( obj && obj.hasOwnProperty(names[names.length-1]) ) {
		return obj[ names[names.length-1] ];
	} else {
		return "";
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
			this.$table.find('tbody').empty();
			this.rowsData = [];
			this.$el.panel('update');
		}, this);
		this.model.on("add:features", function(features) {
			this.addData(features);
			if (this.visible) this.$el.panel('update');
		}, this);
		this.model.on("selectFeatures", this.toggleSelection, this );
		this.model.on("unselectFeatures", this.toggleSelection, this );
		this.model.on("highlightFeatures", this.highlightFeatureCallBack, this );
		
		
		this.rowsData = [];
		this.visibleRowsData = [];
		this.feature2row = {};
	},

	/**
	 * Manage events on the view
	 */
	events : {
	
		'keyup input' : function (event) {
			this.filterData( $(event.currentTarget).val() );
		},
			
		'click tr' : function (event) {
		
			var $row = $(event.currentTarget);
			if ( $row.hasClass('row_selected') ) {
				return; // Nothing to do
			}
						
			var feature = $row.data('feature'); 
			if (feature != null) {
				this.model.highlight([feature]);
			}
		},
		
		'click th' : function (event) {
		
			var $cell = $(event.currentTarget);
			
			if ( $cell.hasClass('sorting_asc') ) {
				$cell.removeClass('sorting_asc');
				this.sortData( -1, 'original' );
			} else if ( $cell.hasClass('sorting_desc') ) {
				$cell.removeClass('sorting_desc');
				$cell.addClass('sorting_asc');
				this.sortData( $cell.index(), 'asc' );
			} else {
				$cell.addClass('sorting_desc');
				this.sortData( $cell.index(), 'desc' );
			}
		},
		
		// Called when the user clicks on the checkbox of the dataTables
		'click .dataTables_chekbox' : function(event){
			// retreive the position of the selected row
			var $row = $(event.currentTarget).closest('tr');
			var feature = $row.data('feature');
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
		
		// Called when the user clicks on the select all button
		'click #selectAll' : function(event){
			this.model.selectAll();
		 }, 
		// Called when the user clicks on the select all button
		'click #deselectAll' : function(event){
			this.model.unselectAll();
		 }, 
	},
	
	/**
	 * Highlight the features on the table when they have been highlighted on the map.
	 */
	highlightFeatureCallBack: function(features, prevFeatures) {
		
		// Remove previous highlighted rows
		this.$table.find('.row_selected').removeClass('row_selected');
		
		var rows = this.$table.find("tbody tr");
		
		for ( var i = 0; i < features.length; i++ ) {
			var index = this.feature2row[features[i].id];
			if (typeof index != 'undefined') {
				rows.eq(index).addClass('row_selected');
			}
		}
	},
	
	/**
	 * Toggle selection for the given features
	 */
	toggleSelection: function(features) {

		var checkboxes = this.$table.find(".dataTables_chekbox");
		for ( var i = 0; i < features.length; i++ ) {
			var index = this.feature2row[features[i].id];
			if (typeof index != 'undefined') {
				checkboxes.eq(index)
					.toggleClass('ui-icon-checkbox-off')
					.toggleClass('ui-icon-checkbox-on');
			}
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
	 * Add data 
	 */
	addData : function(features) {
	
		var columns = Configuration.data.resultsTable.columnsDef;
		for ( var i=0; i < features.length; i++ ) {	
			this.rowsData.push( [ features[i] ] );
			for ( var j=0; j < columns.length; j++ ) {
				this.rowsData[i].push( getData(features[i],columns[j].mData) );
			}
		}
		
		this.visibleRowsData = this.rowsData.slice(0);
		
		this.buildTableContent( this.rowsData );
		this.updateFixedHeader();
	},
	
	
	/**
	 * Filter data
	 */
	filterData: function(val) {
		this.visibleRowsData = [];
		for ( var i=0; i < this.rowsData.length; i++ ) {
			
			var match = false;
			for ( var j=1; !match && j < this.rowsData[i].length; j++ ) {
				match = String(this.rowsData[i][j]).search( val ) >= 0;
			}
			if (match) {
				this.visibleRowsData.push( this.rowsData[i] );
			}
		}
		
		this.buildTableContent();
		this.updateFixedHeader();
		this.toggleSelection( this.model.selection );
		this.highlightFeatureCallBack(this.model._highlighted,[]);
	},
	
	/**
	 * Sort data
	 */
	sortData: function(columnIndex,order) {

		if ( order == "original" ) {
			this.visibleRowsData = this.rowsData.slice(0);
		} else {
			this.visibleRowsData.sort( function(row1,row2) {
				if ( row1[columnIndex] == row2[columnIndex] ) {
					return 0;
				} else if ( row1[columnIndex] < row2[columnIndex] ) {
					return (order =="asc")? -1 : 1;
				} else {
					return (order == "asc") ? 1 : -1;
				}
			});
		}

		this.buildTableContent();
		this.toggleSelection( this.model.selection );
		this.highlightFeatureCallBack(this.model._highlighted,[]);
	},
	
	/**
	 * Build table content from data
	 */
	buildTableContent: function() {
		var $body = this.$table.find('tbody');
		$body.empty();
		
		this.feature2row = {};
		
		for ( var i=0; i < this.visibleRowsData.length; i++ ) {
			
			var $row = $('<tr></tr>');
			$row.addClass( i % 2 == 0 ? "odd" : "even" );
			
			$row.append('<td><span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span></td>');
			for ( var j=1; j < this.visibleRowsData[i].length; j++ ) {
				$row.append( '<td>' +  this.visibleRowsData[i][j] + '</td>');
			}
			
			$row.data('feature', this.visibleRowsData[i][0]);
			this.feature2row[ this.visibleRowsData[i][0].id ] = i;
			
			$body.append($row);
		}
	},
	
	/**
	 * Update fixed header
	 */
	updateFixedHeader: function() {
	
		this.$el.find('.table-header').css('margin-right',0);
		this.$table.find('colgroup').remove();
		this.$headerTable.find('colgroup').remove();

		this.$table.find('thead').show();
		
		var colWidths = this.$table.find( "tr:first" ).children().map(function() {
			return  $( this ).width();
		});
		
		var $colgroup = $( "<colgroup></colgroup>" );
		this.$table.find( "tr:eq(0)" ).children().each(function(i) {
			$colgroup.append( "<col>" );
		});

		$colgroup.children().each(function(i) {
			$( this ).css( "width", colWidths[i] + 'px' );
		});
		
		// Copy table COLGROUP to grid head and grid foot
		$colgroup
			.insertBefore( this.$table.find('thead') )
			.clone()
			.insertBefore( this.$headerTable.find('thead') );

		this.$table.find('thead').hide();
		var diffWidth = this.$headerTable.width() - this.$table.width();
		this.$el.find('.table-header').css('margin-right',diffWidth);
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		this.visible = false;
		this.featuresToAdd = [];
		$(window).resize( $.proxy( this.updateFixedHeader, this ) );
	
		// Build the table
		var $table = $('<table cellpadding="0" cellspacing="0" border="0" class="table-view"><thead></thead><tbody></tbody></table>');
		var $thead = $table.find('thead');
		var $row = $('<tr></tr>').appendTo($thead);
		var columns = Configuration.data.resultsTable.columnsDef;
		$row.append('<th></th>');
		for ( var j=0; j < columns.length; j++ ) {
			$row.append( '<th>' + columns[j].sTitle + '</th>');
		}
		
		this.$table = $table.appendTo( this.el );
		
		
		// Build the fixed header table
		this.$table.wrap('<div class="table-content"></div>');
		this.$headerTable = this.$table.clone().prependTo( this.el ).wrap('<div class="table-header"></div>');
		this.$table.find('thead').hide();
		
			
		var self = this;	
		this.$el.panel('option','show', function() {
			self.updateFixedHeader();
			self.visible = true;
		});
		this.$el.panel('option','hide', function() {
			self.visible = false;
		});	

		this.renderFooter();		
		
		this.$el.trigger('create');
	},
	
	/**
	 * Render footer
	 */
	renderFooter: function() {
		var footer = $('<div class="ui-grid-b"></div>')
			.append('<div class="table-filter ui-block-a"><label>Search: <input data-mini="true" type="text"></label></div>');
			
		// Buttons for selection/deselection
		var $selectContainer = $('<div class="ui-block-b table-middleButtons"></div>');
		$('<button id="selectAll" data-role="button" data-inline="true" data-mini="true">Select All</button>').appendTo($selectContainer);
		$('<button id="deselectAll" data-role="button" data-inline="true" data-mini="true">Deselect All</button>').appendTo($selectContainer);
		$selectContainer.appendTo( footer );
		
		var $buttonContainer = $('<div class="ui-block-c table-rightButtons"></div>').appendTo(footer);
						
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

		this.$el.append( footer );
	}
});

return SearchResultsTableView;

});