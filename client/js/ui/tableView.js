define(
		[ 'jquery', 'backbone', 'map/map', 'text!ui/template/tableColumnsPopup.html'],
	function($, Backbone, Map, tableColumnsPopupTemplate) {

	
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
	
		this.setModel( this.model );
		
		if ( options ) {
			this.columnDefs = options.columnDefs;
		}

		this.hasExpandableRows = false;
		
		this.rowsData = [];
		this.visibleRowsData = [];
		this.feature2row = {};
		
		this.maxVisibleColumns = 10;
	},

	/**
	 * Manage events on the view
	 */
	events : {
	
		// Call when the user enter text in the filter input
		'keyup input' : function (event) {
			this.filterData( $(event.currentTarget).val() );
		},
		
		'dblclick tr': function (event) {
			var data = $(event.currentTarget).data('internal');
			if (data) {
				Map.zoomToFeature( data.feature );
			}
		},
			
		// Call when a row is clicked
		'click tr' : function (event) {
		
			var $row = $(event.currentTarget);
			if ( $row.hasClass('row_selected') ) {
				return; // Nothing to do
			}
			
			if ( this.model.highlight ) {
				var data = $row.data('internal');
				if (data && data.feature) {
					this.model.highlight([data.feature]);
				}
			}
		},
		
		// Call when the header is clicked : sort
		'click th' : function (event) {
		
			var $cell = $(event.currentTarget);
			$cell.siblings("th").removeClass('sorting_asc').removeClass('sorting_desc');

			if ($cell.find('.table-view-chekbox').length > 0)
				return;
			
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
				// Change icon and return the row
				var $row = $(event.currentTarget)
					.toggleClass('ui-icon-minus')
					.toggleClass('ui-icon-plus')
					.closest('tr');
					
				var rowData = $row.data('internal');
				rowData.isExpand = !rowData.isExpand;
				if ( rowData.isExpand ) {
					this.expandRow($row);
				} else {
					this.closeRow($row);
				}
			},
		
		// Called when the user clicks on the checkbox of the dataTables
		'click .table-view-chekbox' : function(event){
			// retreive the position of the selected row
			var $target = $(event.currentTarget);
			var $row = $target.closest('tr');
			var data = $row.data('internal');
		
			if ( $target.hasClass('ui-icon-checkbox-off') ) {
				if ( data ) {
					this.model.select( data.feature );
				}
				else {
					this.model.selectAll();
					$target.removeClass('ui-icon-checkbox-off');
					$target.addClass('ui-icon-checkbox-on');
				}
			} else {
				if ( data ) {
					this.model.unselect( data.feature );
				}
				else {
					this.model.unselectAll();
					$target.removeClass('ui-icon-checkbox-on');
					$target.addClass('ui-icon-checkbox-off');
				}
			}
		 },
		 
		 'click #table-columns-button' : function(event) {
			
			var self = this;
			$(_.template(tableColumnsPopupTemplate,this)).appendTo('.ui-page-active')
					.trigger('create')
					.popup({
						theme : 'c'
					})
					.on('change', 'input', function(event) {
						// Get the column to change
						var i = $(this).data('index');
						self.columnDefs[i].visible = $(this).attr('checked');
						
						// Rebuild the table with the new columns
						self.buildTable();
						self.buildTableContent();
					})
					.on('popupafterclose', function(event, ui) {
						$(this).remove();
					})
					.popup('open', {
						positionTo: this.$el.find('#table-columns-button')
					});
		 }
	},
	
	/**
	 * Set the model to be used by the TableView
	 */
	setModel: function(model) {
	
		if ( this.model ) {
		
			// Clean-up previous data
			this.clear();
			
			// Clean-up callbacks
			this.stopListening(this.model);
		}
	
		this.model = model;
		
		if ( this.model ) {
			this.listenTo(this.model,"reset:features", this.clear);
			this.listenTo(this.model,"add:features", this.addData);
			this.listenTo(this.model,"remove:features", this.removeData);
			this.listenTo(this.model,"selectFeatures", this.toggleSelection );
			this.listenTo(this.model,"unselectFeatures", this.toggleSelection );
			this.listenTo(this.model,"highlightFeatures", this.highlightFeature );
				
			if ( this.model.features.length > 0 ) {
				this.addData( this.model.features );
			}
		}
	},
	
	/**
	 * Expand a row
	 */
	expandRow: function($row) {
	
		var rowData = $row.data('internal');
	
		// First add a row for loading
		$( '<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">Loading...</td></tr>' ).insertAfter( $row )
		
		// If row is already loading, exit !
		if ( rowData.isLoading )
			return;
			
		// Now load the data
		rowData.isLoading = true;
		var self = this;
		$.ajax({
			url: rowData.feature.properties.rel + "&count=10&startIndex=1&format=json",
			dataType: 'json'
				
		}).done(function(data) {
			rowData.isLoading = false;
			if ( !rowData.isExpand )
				return;
			if ( data.features.length == 0 ) {
			  $row.next().remove();
			  $( '<tr><td></td><td></td><td colspan="' + self.columnDefs.length + '">No data found</td></tr>' ).insertAfter( $row )
			} else {
				rowData.totalNumChildren = data.properties.totalResults;
				// HACK : do not use addFeatures but just the event in order to add element to the table and the map
				self.model.trigger('add:features',data.features,self.model,rowData);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			rowData.isLoading = false;
			if ( !rowData.isExpand )
				return;	
			$row.next().remove();
			$( '<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">Error while loading</td></tr>' ).insertAfter( $row )
		});
		
	},
	
	
	/**
	 * Close a row
	 */
	closeRow: function($row) {
	
		var rowData = $row.data('internal');
	
		if ( rowData.isLoading ) {
			$row.next().remove();
		} else {
			var features = [];
			for ( var i = 0; i < rowData.children.length; i++ ) {
				features.push( rowData.children[i].feature );
			}
			var newSelection = _.difference(this.model.selection, features);
			this.model.setSelection(newSelection);
			this.model.trigger('remove:features',features,this.model);
			rowData.children.length = 0;
			this.buildTableContent();
		}
	},

	
	/**
	 * Highlight the features on the table when they have been highlighted on the map.
	 */
	highlightFeature: function(features, prevFeatures) {
		if ( !this.$table ) return;
		
		// Remove previous highlighted rows
		this.$table.find('.row_selected').removeClass('row_selected');
		
		if ( features ) {
			var rows = this.$table.find("tbody tr");
			for ( var i = 0; i < features.length; i++ ) {
			
				var $row = this._getRowFromFeature( features[i] );
				$row.addClass('row_selected');
			}
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
		if ( !this.$table ) return;
		
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
		if ( this.$table ) {
			this.$table.find('tbody').empty();

			this.rowsData = [];
			this.hasExpandableRows = false;
			
			// Reset the number of non-empty cells
			for ( var i = 0; i < this.columnDefs.length; i++ ) {
				this.columnDefs[i].numValidCell = 0;
			}
		}
	},
	
	/**
	 * Add data 
	 */
	addData : function(features,model,parentRowData) {
		
		if ( features.length > 0 )
		{
			var columns = this.columnDefs;
			for ( var i=0; i < features.length; i++ ) {
				if (features[i].properties.rel) {
					this.hasExpandableRows = true;
				}
				var rowData = {
					feature: features[i],
					cellData: [],
					isExpandable: features[i].properties.rel ? !parentRowData : false,
					isExpand: false,
					children: [],
					isLoading : false,
					totalNumChildren: 0
				};
				for ( var j=0; j < columns.length; j++ ) {
					var d = getData(features[i],columns[j].mData);
					rowData.cellData.push( d );
					if (d) {
						columns[j].numValidCell++;
					}
				}
				
				if ( parentRowData ) {
					parentRowData.children.push( rowData );
				} else {
					this.rowsData.push( rowData );
				}
			}
			
			this.visibleRowsData = this.rowsData.slice(0);
			
			this.buildTable();
			this.buildTableContent();
		}
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
			for ( var j=0; !match && j < this.rowsData[i].cellData.length; j++ ) {
				match = String(this.rowsData[i].cellData[j]).search( val ) >= 0;
			}
			if (match) {
				this.visibleRowsData.push( this.rowsData[i] );
			}
		}
		
		this.buildTableContent();
	},
	
	/**
	 * Sort data
	 */
	sortData: function(columnIndex,order) {
	
		columnIndex -= this.hasExpandableRows ? 2 : 1;

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
	},

	/**
	 * Create a row given rowData
	 */
	_createRow: function(rowData,$body) {
		var $row = $('<tr></tr>');
		
		// Magnage expand
		if ( this.hasExpandableRows ) {
		
			if ( rowData.isExpandable ) {
				if ( rowData.isExpand ) {
					$row.append('<td><span class="table-view-expand ui-icon ui-icon-minus "></span></td>');
				} else {
					$row.append('<td><span class="table-view-expand ui-icon ui-icon-plus "></span></td>');
				}
			} else {
				$row.append('<td></td>');
			}
		}
		$row.append('<td><span class="table-view-chekbox ui-icon ui-icon-checkbox-off "></span></td>');
		for ( var j = 0; j < rowData.cellData.length; j++ ) {
		
			if ( this.columnDefs[j].visible && this.columnDefs[j].numValidCell > 0 ) {
				// Check if column has some specific classes
				var classes = null;
				if ( this.columnDefs[j].getClasses ) {
					classes = this.columnDefs[j].getClasses( rowData.feature );
				}
				
				if ( classes ) {
					$row.append( '<td class="' + classes + '">' +  rowData.cellData[j] + '</td>');
				} else {
					$row.append( '<td>' +  rowData.cellData[j] + '</td>');
				}
			}
		}
		
		$row = $row.appendTo($body);		
		$row.data('internal', rowData);
		this.feature2row[ rowData.feature.id ] = $row;
	},
	
	/**
	 * Build table content from data
	 */
	buildTableContent: function() {
		var $body = this.$table.find('tbody');
		$body.empty();
		
		this.feature2row = {};
		
		for ( var i=0; i < this.visibleRowsData.length; i++ ) {
			
			this._createRow( this.visibleRowsData[i], $body );
			
			if ( this.visibleRowsData[i].isExpand ) {
			
				for ( var n=0; n < this.visibleRowsData[i].children.length; n++ ) {
					this._createRow( this.visibleRowsData[i].children[n], $body );
				}
			
			}
			
		}
		
		this.updateFixedHeader();
		this.toggleSelection( this.model.selection );
		this.highlightFeature(this.model.highlights,[]);
	},
	
	/**
	 * Update fixed header
	 */
	updateFixedHeader: function() {
		if ( this.$table ) {
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
		}

	},
	
	/**
	 * Show the table
	 */
	show: function() {
		this.$el.show();
		if ( this.rowsData.length > 0 ) {
			this.updateFixedHeader();
		}
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
	 * Build the main table element
	 */
	buildTable: function() {
	
		this.$el.find('.table-content').remove();
		this.$el.find('.table-header').remove();
		this.$el.find('.table-nodata').remove();

		if ( this.rowsData.length == 0 ) {
			this.$el.prepend('<div class="table-nodata">No data to display</div>');
			return;
		}

		
		// Build the table
		var $table = $('<table cellpadding="0" cellspacing="0" border="0" class="table-view"><thead></thead><tbody></tbody></table>');
		var $thead = $table.find('thead');
		var $row = $('<tr></tr>').appendTo($thead);
		var columns = this.columnDefs;
		if ( this.hasExpandableRows ) {
			$row.append('<th></th>');
		}
		$row.append('<th><span class="table-view-chekbox ui-icon ui-icon-checkbox-off "></th>');
		for ( var j=0; j < columns.length; j++ ) {
			if ( columns[j].visible && columns[j].numValidCell > 0 ) {
				$row.append( '<th>' + columns[j].sTitle + '</th>');
			}
		}
		
		this.$table = $table.prependTo( this.el );
		
		// Build the fixed header table
		this.$table.wrap('<div class="table-content"></div>');
		this.$headerTable = this.$table.clone().prependTo( this.el ).wrap('<div class="table-header"></div>');
		this.$table.find('thead').hide();
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		// Update column definition  with the visible flag and a counter to know the number of non-empty cell
		for ( var i = 0; i < this.columnDefs.length; i++ ) {
			this.columnDefs[i].visible = i < this.maxVisibleColumns;
			this.columnDefs[i].numValidCell = 0;
		}
			
		this.visible = false;
		this.featuresToAdd = [];
		$(window).resize( $.proxy( this.updateFixedHeader, this ) );
	
		this.buildTable();
				
		this.renderFooter();		
		
		this.$el.trigger('create');
	},
	
	/**
	 * Render footer
	 */
	renderFooter: function() {
		var footer = $('<div class="ui-grid-a"></div>')
			.append('<div class="table-filter ui-block-a"><label>Search: <input data-mini="true" type="text"></label><button data-mini="true" data-inline="true" id="table-columns-button">Columns</button></div>');
							
		var $buttonContainer = $('<div class="ui-block-b table-rightButtons"></div>').appendTo(footer);
		
		if ( this.renderButtons )
			this.renderButtons($buttonContainer);
		

		this.$el.append( footer );
	}
});

return TableView;

});