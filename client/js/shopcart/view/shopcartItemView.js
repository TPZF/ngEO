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
		
		this.model.on("selectShopcartItems", this.toggleSelection, this );
		this.model.on("unselectShopcartItems", this.toggleSelection, this );

		this.model.on("shopcart:loaded", function() {
			this.shopcartItemsToAdd = [];
			for (var i=0; i<this.model.currentShopcart.shopcartItems.length; i++){			  
				this.shopcartItemsToAdd.push(this.model.currentShopcart.shopcartItems[i]);
			}

		}, this);
		
		this.model.on("shopcart:itemsDeleted", function(removedIndexes) {
			//in this case the shopcart widget should be visible
			for (var i=0; i<removedIndexes.length; i++){			  
				this.table.fnDeleteRow(removedIndexes[i]);
			}
			this.updateButtonStatuses();
			this.table.fnAdjustColumnSizing( true );
			this.trigger('shopcart:sizeChanged');

		}, this);
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
				this.model.currentShopcart.select( shopcartItem );
			} else {
				this.model.currentShopcart.unselect( shopcartItem );
			}
		 }, 
		 
		// Called when the user clicks on the select all button
		'click #shopcartSelectAll' : function(event){
			this.model.currentShopcart.selectAll();
		 }, 
		// Called when the user clicks on the select all button
		'click #shopcartDeselectAll' : function(event){
			this.model.currentShopcart.unselectAll();
		 }	 
	},

	/**
	 * Get the shopcart item from the table row
	 */
	getShopcartItemFromRow: function(row) {
		var rowPos = this.table.fnGetPosition( row );
		if (rowPos != null) {
			console.log("All data : " + JSON.stringify(this.table.fnGetData()));
			console.log("data for postion " + rowPos + ":: " + JSON.stringify(this.table.fnGetData(rowPos)));
			return this.table.fnGetData(rowPos);
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
			var index = this.model.currentShopcart.getShopcartItemIndex(shopcartItems[i]);
			console.log("item index == " + index);
			checkboxes.eq(index)
				.toggleClass('ui-icon-checkbox-off')
				.toggleClass('ui-icon-checkbox-on');	
		}
		
		this.updateButtonStatuses();

	},
	
	/** update the button statuses **/ 
	updateButtonStatuses : function(){

		if ( this.model.currentShopcart.selection.length > 0 ) {
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
			this.toggleSelection(this.model.currentShopcart.selection);
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
			self.model.currentShopcart.deleteItems();
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