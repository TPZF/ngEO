define(
		[ 'jquery', 'backbone', 'configuration', 'shopcart/model/shopcart', 'shopcart/model/shopcartCollection',
		 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, Shopcart, ShopcartCollection ) {

		
/**
 * The model is the backbone model shopcart 
 */
var ShopcartItemView = Backbone.View.extend({

	initialize : function() {
		
		//FIXME : update the shopcart content when the current shopcart selection  has changes
		//ShopcartCollection.on("updatedCurrentShopcart", this.render, this);
		
		this.model.on("selectShopcartItems", this.toggleSelection, this );
		this.model.on("unselectShopcartItems", this.toggleSelection, this );
		
		this.model.on("shopcart:itemsDeleted", function(removedIndexes) {
			if ( this.visible ) {
				
				for (var i=0; i<removedIndexes.length; i++){			  
					this.table.fnDeleteRow(removedIndexes[i]);
				}
				this.updateButtonStatuses();
				this.table.fnAdjustColumnSizing( true );
				this.trigger('shopcart:sizeChanged');
			} 
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
			return this.model.shopcartItems[rowPos];
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
			var index = this.model.shopcartItems.indexOf(shopcartItems[i]);
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
			this.exportButton.button('enable');
			this.downloadOptionsButton.button('enable');
		} else {
			this.deleteButton.button('disable');
			this.exportButton.button('disable');
			this.downloadOptionsButton.button('disable');
		}
	},
	
	/**
	 * Method to call when the table is shown
	 */
	onShow: function() {
		
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
			"aaData" : this.model.shopcartItems,
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
		
//		this.downloadOptionsButton.click(function() {
//			//TODO
//			var downloadOptionsWidget = new DownloadOptionsWidget();
//			downloadOptionsWidget.open();
//
//		});
//		
//		//add button to the widget footer in order to download products		
		this.deleteButton = $('<button data-role="button" data-inline="true" data-mini="true">Delete</button>').appendTo($buttonContainer);
		this.deleteButton.button();
		this.deleteButton.button('disable');
		
		this.deleteButton.click(function() {	
			self.model.deleteItems();
		});
		
		//add button to the widget footer in order to download products		
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('disable');
		
		this.exportButton.click(function() {	
			//TODO
		});

		this.$el.trigger('create');

	}
});

return ShopcartItemView;

});