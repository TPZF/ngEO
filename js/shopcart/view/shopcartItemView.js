define(
		[ 'jquery', 'backbone', 'configuration', 'shopcart/model/shopcart', 
		 'jquery.mobile', 'jquery.dataTables' ],
	function($, Backbone, Configuration, Shopcart ) {

		
/**
 * The model is the backbone model shopcart 
 */
var ShopcartItemView = Backbone.View.extend({

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
			$(event.currentTarget).toggleClass('ui-icon-checkbox-off')
								  .toggleClass('ui-icon-checkbox-on');	
			
		 }, 
	},

	/**
	 * Get the shopcart item from the table row
	 */
	getShopcartItemFromRow: function(row) {
		var rowPos = this.table.fnGetPosition( row );
		if (rowPos != null) {
			return this.model.models[rowPos];
		} else {
			return null;
		}
	},

	/**
	 * Render the table
	 */
	render : function() {

		// Add the table
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" id="dataTable"></table>');

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
			"aaData" : this.model.toJSON(),
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
		this.table = this.$el.find("#dataTable").dataTable(parameters);
	
		// Build the bottom : add buttons
		this.$el.find(".bottom").addClass("ui-grid-a");
		this.$el.find("#datatable_filter").addClass("ui-block-a");
		this.$el.find("#datatable_filter input").attr("data-mini", "true");
		var $selectAllContainer = $('<div><label>Select All : <span class="dataTables-select-all ui-icon ui-icon-checkbox-off"></span></label></div>')
			.appendTo( this.$el.find("#datatable_filter") );
	
		var $buttonContainer = $('<div class="ui-block-b dataTables_buttons"></div>').appendTo( this.$el.find(".bottom") );

		//add button to the widget footer in order to download products
//		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
//		this.downloadOptionsButton.button();
//		this.downloadOptionsButton.button('disable');
//		
//		this.downloadOptionsButton.click(function() {
//			
//			var downloadOptionsWidget = new DownloadOptionsWidget();
//			downloadOptionsWidget.open();
//
//		});
//		
//		//add button to the widget footer in order to download products		
//		this.deleteButton = $('<button data-role="button" data-inline="true" data-mini="true">Delete</button>').appendTo($buttonContainer);
//		this.deleteButton.button();
//		this.deleteButton.button('disable');
//		
//		this.deleteButton.click(function() {	
//			//TODO
//		});

		this.$el.trigger('create');

	}
});

return ShopcartItemView;

});