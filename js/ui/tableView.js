define(
		[ 'jquery', 'backbone' ],
	function($, Backbone ) {

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
 * A view to display a table.
 * The model contains a feature collection
 */
var TableView = Backbone.View.extend({

	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize : function( options ) {
	
		if ( this.model ) {
			this.model.on("reset:features", this.clear, this);
			this.model.on("add:features", this.addData, this);
			this.model.on("selectFeatures", this.toggleSelection, this );
			this.model.on("unselectFeatures", this.toggleSelection, this );
			this.model.on("highlightFeatures", this.highlightFeatureCallBack, this );
		}
		
		if ( options ) {
			this.columnDefs = options.columnDefs;
		}
		
		this.hasGroup = false;
		
		this.rowsData = [];
		this.visibleRowsData = [];
		this.feature2row = {};
	},

	/**
	 * Manage events on the view
	 */
	events : {
	
		// Call when the user enter text in the filter input
		'keyup input' : function (event) {
			this.filterData( $(event.currentTarget).val() );
		},
			
		// Call when a row is clicked
		'click tr' : function (event) {
		
			var $row = $(event.currentTarget);
			if ( $row.hasClass('row_selected') ) {
				return; // Nothing to do
			}
			
			if ( this.model.highlight ) {
				var feature = $row.data('internal').feature; 
				if (feature != null) {
					this.model.highlight([feature]);
				}
			}
		},
		
		// Call when the header is clicked : sort
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
		
		// Call when the expand icon is clicked
		'click .table-view-expand' : function(event){
				var $row = $(event.currentTarget).closest('tr');
				$(event.currentTarget)
					.toggleClass('ui-icon-minus')
					.toggleClass('ui-icon-plus');
					
				var rowData = $row.data('internal');
				rowData.isExpand = !rowData.isExpand;
				if ( rowData.isExpand ) {
					// Build the row for expand
					var $lastRow = $row;
					for ( var i = 0; i < rowData.children.length; i++ ) {
						var childRow = '<tr><td></td>'
						childRow += '<td><span class="table-view-chekbox ui-icon ui-icon-checkbox-off "></span></td>';
						for ( var j = 0; j < rowData.children[i].cellData.length; j++ ) {
							childRow += '<td>' +  rowData.children[i].cellData[j] + '</td>';
						}
						childRow += '</tr>';
						$lastRow = $(childRow).insertAfter( $lastRow ).data('internal', rowData.children[i]);
						this.feature2row[ rowData.children[i].feature.id ] = $lastRow;
					}
					
				} else {
					for ( var i = 0; i < rowData.children.length; i++ ) {
						$row.next().remove();
					}
				}
			},
		
		// Called when the user clicks on the checkbox of the dataTables
		'click .table-view-chekbox' : function(event){
			// retreive the position of the selected row
			var $row = $(event.currentTarget).closest('tr');
			var feature = $row.data('internal').feature;
			if ( $(event.currentTarget).hasClass('ui-icon-checkbox-off') ) {
				this.model.select( feature );
			} else {
				this.model.unselect( feature );
			}
		 }
	},
	
	/**
	 * Highlight the features on the table when they have been highlighted on the map.
	 */
	highlightFeatureCallBack: function(features, prevFeatures) {
		
		// Remove previous highlighted rows
		this.$table.find('.row_selected').removeClass('row_selected');
		
		var rows = this.$table.find("tbody tr");
		
		for ( var i = 0; i < features.length; i++ ) {
		
			var $row = this._getRowFromFeature( features[i] );
			$row.addClass('row_selected');
		}
	},
	
	/**
	 * Helper function to retreive a row from a feature
	 */
	_getRowFromFeature: function( feature ) {
		if ( this.feature2row.hasOwnProperty( feature.id ) ) {
			var $row = this.feature2row[feature.id];
			return $row;
		} else {
			return null;
		}
	},
	
	/**
	 * Toggle selection for the given features
	 */
	toggleSelection: function(features) {

		for ( var i = 0; i < features.length; i++ ) {
			var $row = this._getRowFromFeature( features[i] );
			if ( $row ) {
				$row.find('.table-view-chekbox')
					.toggleClass('ui-icon-checkbox-off')
					.toggleClass('ui-icon-checkbox-on');
			}
		}
	},
	
	/**
	 * Clear data
	 */
	clear: function() {
		this.$table.find('tbody').empty();
		this.rowsData = [];
	},
	
	/**
	 * Add data 
	 */
	addData : function(features) {
	
		var roots = [];
	
		var columns = this.columnDefs;
		for ( var i=0; i < features.length; i++ ) {	
			var rowData = {
				feature: features[i],
				cellData: [],
				isExpand: false,
				children: []
			};
			for ( var j=0; j < columns.length; j++ ) {
				rowData.cellData.push( getData(features[i],columns[j].mData) );
			}
			
			if ( this.hasGroup )  {
				var groupId = features[i].properties.EarthObservation.EarthObservationMetaData.eop_productGroupId;
				var masterId = groupId.split('_')[0];
				var slaveId = groupId.split('_')[1];
				if ( slaveId == 0 ) {
					roots[ masterId ] = rowData;
					this.rowsData.push( rowData );
				} else {
					roots[ masterId ].children.push(rowData);
				}
			}
		}
		
		this.visibleRowsData = this.rowsData.slice(0);
		
		this.buildTableContent();
		this.updateFixedHeader();
	},
	
	/**
	 * Remove data from the view
	 */
	removeData: function(features) {
	
		var rows = this.$table.find("tbody tr");
		for ( var i = 0; i < features.length; i++ ) {
		
			var $row = this._getRowFromFeature( features[i] );
			if ( $row ) {
				$row.remove();
				
				for ( var n = 0; n < this.visibleRowsData.length; n++ ) {
					if ( this.visibleRowsData[n].feature == features[i] ) {
						this.visibleRowsData.splice(n,1);
						break;
					}
				}
			}
			
			for ( var n = 0; n < this.rowsData.length; n++ ) {
				if ( this.rowsData[n].feature == features[i] ) {
					this.rowsData.splice(n,1);
					break;
				}
			}
			
		}
	},	
	
	/**
	 * Filter data
	 */
	filterData: function(val) {
		this.visibleRowsData = [];
		for ( var i=0; i < this.rowsData.length; i++ ) {
			
			var match = false;
			for ( var j=0; !match && j < this.rowsData.cellData.length; j++ ) {
				match = String(this.rowsData[i].cellData[j]).search( val ) >= 0;
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
				if ( row1.cellData[columnIndex] == row2.cellData[columnIndex] ) {
					return 0;
				} else if ( row1.cellData[columnIndex] < row2.cellData[columnIndex] ) {
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
			
			if ( this.hasGroup ) {
				$row.append('<td><span class="table-view-expand ui-icon ui-icon-plus "></span></td>');
			}
			$row.append('<td><span class="table-view-chekbox ui-icon ui-icon-checkbox-off "></span></td>');
			for ( var j = 0; j < this.visibleRowsData[i].cellData.length; j++ ) {
				$row.append( '<td>' +  this.visibleRowsData[i].cellData[j] + '</td>');
			}
			
			$row.data('internal', this.visibleRowsData[i]);
			
			$row = $row.appendTo($body);
			this.feature2row[ this.visibleRowsData[i].feature.id ] = $row;
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
	 * Show the table
	 */
	show: function() {
		this.$el.show();
		this.updateFixedHeader();
		this.visible = true;
	},
	
	/**
	 * Hide the table
	 */
	hide: function() {
		this.$el.hide();
		this.visible = false;
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
		var columns = this.columnDefs;
		if ( this.hasGroup ) {
			$row.append('<th></th>');
		}
		$row.append('<th></th>');
		for ( var j=0; j < columns.length; j++ ) {
			$row.append( '<th>' + columns[j].sTitle + '</th>');
		}
		
		this.$table = $table.appendTo( this.el );
		
		// Build the fixed header table
		this.$table.wrap('<div class="table-content"></div>');
		this.$headerTable = this.$table.clone().prependTo( this.el ).wrap('<div class="table-header"></div>');
		this.$table.find('thead').hide();
		
		this.renderFooter();		
		
		this.$el.trigger('create');
	},
	
	/**
	 * Render footer
	 */
	renderFooter: function() {
		var footer = $('<div class="ui-grid-b"></div>')
			.append('<div class="table-filter ui-block-a"><label>Search: <input data-mini="true" type="text"></label></div>');
			
		var self = this;
		
		// Buttons for selection/deselection
		var $selectContainer = $('<div class="ui-block-b table-middleButtons"></div>');
		$('<button data-role="button" data-inline="true" data-mini="true">Select All</button>')
			.appendTo($selectContainer)
			.click( function(){
				self.model.selectAll();
			});
		$('<button data-role="button" data-inline="true" data-mini="true">Deselect All</button>')
			.appendTo($selectContainer)
			.click(function(){
				self.model.unselectAll();
			}),
		$selectContainer.appendTo( footer );
					
		var $buttonContainer = $('<div class="ui-block-c table-rightButtons"></div>').appendTo(footer);
		
		if ( this.renderButtons )
			this.renderButtons($buttonContainer);
		

		this.$el.append( footer );
	}
});

return TableView;

});