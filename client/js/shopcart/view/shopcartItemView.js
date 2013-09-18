define(
		[ 'jquery', 'backbone', 'configuration', 'searchResults/widget/downloadOptionsWidget',
		  'shopcart/widget/shopcartExportWidget',
		 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, DownloadOptionsWidget, ShopcartExportWidget) {

		
/**
 * The model is the backbone model shopcart 
 */
var ShopcartItemView = Backbone.View.extend({

	initialize : function() {
		this.shopcartItemsToAdd = [];
	},
	
	events : {
		
		'click tr' : function (event) {
		
			var $row = $(event.currentTarget);
			if ( $row.hasClass('row_selected') ) {
				return; // Nothing to do
			}
			
			// Remove previous selection
			this.table.find('.row_selected').removeClass('row_selected');
			
			var shopcartItem = this.getShopcartItemFromRow(event.currentTarget);
			if (shopcartItem != null) {
				$row.addClass('row_selected');
			}
		},
		
		// Called when the user clicks on the checkbox of the table
		'click .dataTables_chekbox' : function(event){
			// retreive the position of the selected row
			var shopcartItem = this.getShopcartItemFromRow( $(event.currentTarget).closest('tr').get(0) );
			if ( $(event.currentTarget).hasClass('ui-icon-checkbox-off') ) {
				this.model.select( shopcartItem );
			} else {
				this.model.unselect( shopcartItem );
			}
		 }, 
		 
		// Called when the user clicks on the select all button
		'click #shopcartSelectAll' : function(event){
			this.model.selectAll();
		 }, 
		// Called when the user clicks on the select all button
		'click #shopcartDeselectAll' : function(event){
			this.model.unselectAll();
		 }	 
	},

	/**
	 * Get the shopcart item from the table row
	 */
	getShopcartItemFromRow: function(row) {
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
	toggleSelection: function(shopcartItems) {

		var checkboxes = this.table.$(".dataTables_chekbox",{order: "original"});
		for ( var i = 0; i < shopcartItems.length; i++ ) {
			var index = this.model.features.indexOf(shopcartItems[i]);
			checkboxes.eq(index)
				.toggleClass('ui-icon-checkbox-off')
				.toggleClass('ui-icon-checkbox-on');	
		}
		
		this.updateButtonStatuses();

	},
	
	/** update the button statuses **/ 
	updateButtonStatuses : function(){

		if ( this.model.selection.length > 0 ) {
			this.deleteButton.button('enable');
			this.downloadOptionsButton.button('enable');
		} else {
			this.deleteButton.button('disable');
			this.downloadOptionsButton.button('disable');
		}
	},
	
	/**
	 * Method to call when the table is shown
	 */
	onShow: function() {
		//if there items to add that mean the current shopcart has been loaded
		if ( this.shopcartItemsToAdd.length >  0 ) {
			this.table.fnClearTable();
			this.table.fnAddData( this.shopcartItemsToAdd, false );
			// adjust selection
			this.toggleSelection(this.model.selection);
			this.shopcartItemsToAdd = [];
		}
		this.table.fnAdjustColumnSizing( true );
		this.visible = true;
	},
	
	/**
	 * Method to call when the table is hidden
	 */
	onHide: function() {
		this.visible = false;
	},
	
	/**
	 * Add items in the view
	 */
	addItems: function(items) {
		if ( this.visible ) {
			this.table.fnAddData( items, false );
			this.table.fnAdjustColumnSizing( true );
			// adjust selection 
			this.toggleSelection(this.model.selection);
			this.trigger('sizeChanged');
		} else {
			this.shopcartItemsToAdd = this.shopcartItemsToAdd.concat( items );
		}
	},
	
	/**
	 * Remove items from the view
	 */
	removeItems: function(items) {
		// First get the indices in the table of the removed items
		var datas = this.table.fnGetData();
		var indicesToDelete = [];
		for (var i=0; i < items.length; i++) {
			for ( var n = 0; n < datas.length; n++ ) {
				if ( datas[n].properties.shopcartItemId == items[i].properties.shopcartItemId ) {
					indicesToDelete.push(n);
				}
			}
			
		}
		
		// Sort indices to remove highest index first
		indicesToDelete.sort( function(a,b) { return b - a; } );
		for (var i=0; i < indicesToDelete.length; i++) {
			this.table.fnDeleteRow( indicesToDelete[i], null, false );
		}
		
		this.updateButtonStatuses();
		this.table.fnAdjustColumnSizing( true );
		this.trigger('sizeChanged');
	},
	
	/**
	 * Set the model used by the view
	 */
	setModel: function(model) {
	
		if ( this.model ) {
			this.stopListening(this.model);
		}
		
		this.model = model;
		
		// Clean-up previous data
		this.table.fnClearTable();
		this.shopcartItemsToAdd = [];
		if ( this.visible ) {
			this.trigger('sizeChanged');
		}
				
		// Listen to shopcart content modification
		this.listenTo(model,"selectShopcartItems", this.toggleSelection );
		this.listenTo(model,"unselectShopcartItems", this.toggleSelection );

		this.listenTo(model,"loaded", this.addItems );
		this.listenTo(model,"itemsAdded", this.addItems );
		this.listenTo(model,"itemsDeleted", this.removeItems );
		
		model.loadContent();
	},

	/**
	 * Render the table
	 */
	render : function() {
		
		this.visible = false;
		
		this.shopcartItemsToAdd = [];
		
		// Add the table
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" id="shopcartTable"></table>');

		// Take column definitions from Configuration
		// Add checkbox as first colum
		var columnsDef = [{	'sTitle' : '', 'bSortable': false, 'mData': null, 'sType': 'html', 'sWidth': '16px', 'sDefaultContent': '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>' }];
		columnsDef = columnsDef.concat( Configuration.data.shopcartTable.columnsDef );
		
		
		// Add a default content for each row to avoid error messages
		for ( var i = 1; i < columnsDef.length; i++ ) {
			columnsDef[i].sDefaultContent = "None";
		}

		// Build parameters for dataTables
		var parameters = {
			"aaData" : [],
			"aoColumns" : columnsDef, 
			"bDestroy": true,
			"bSort" : true,
			"autoWidth": true,
			"sDom" : 't<"bottom"f>',
			"sScrollY": "200px",
			"bPaginate": false,
			"bScrollCollapse": true
		};
				
		var self = this;
		this.table = this.$el.find("#shopcartTable").dataTable(parameters);
	
		// Build the bottom : add buttons
		this.$el.find(".bottom").addClass("ui-grid-a");
		this.$el.find("#shopcartTable_filter").addClass("ui-block-a");
		this.$el.find("#shopcartTable_filter input").attr("data-mini", "true");
		// Buttons for selection/deselection
		//var $selectContainer = $('<div class="ui-block-b"></div>').appendTo(this.$el.find(".bottom"));
		$('<button id="shopcartSelectAll" data-role="button" data-inline="true" data-mini="true">Select All</button>').appendTo("#shopcartTable_filter");
		$('<button id="shopcartDeselectAll" data-role="button" data-inline="true" data-mini="true">Deselect All</button>').appendTo("#shopcartTable_filter");

		var $buttonContainer = $('<div class="ui-block-b dataTables_buttons"></div>').appendTo( this.$el.find(".bottom") );

		//add button to the widget footer in order to download products
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable');
		
		this.downloadOptionsButton.click(function() {
		
			var downloadOptionsWidget = new DownloadOptionsWidget();
			downloadOptionsWidget.open();

		});
		
		//add button to the widget footer in order to download products		
		this.deleteButton = $('<button data-role="button" data-inline="true" data-mini="true">Delete</button>').appendTo($buttonContainer);
		this.deleteButton.button();
		this.deleteButton.button('disable');
		
		this.deleteButton.click(function() {	
			self.model.deleteSelection();
		});
		
		//add button to the widget footer in order to export a shopcart
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('enable');
		
		this.exportButton.click(function() {	
			var shopcartExportWidget = new ShopcartExportWidget();
			shopcartExportWidget.open();
		});

		this.$el.trigger('create');

	}
});

return ShopcartItemView;

});