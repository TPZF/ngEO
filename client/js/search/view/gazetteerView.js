

define( ['jquery', 'backbone', 'map/map', 'map/gazetteer'], 
		function($, Backbone, Map, Gazetteer) {

/**
 * The GazetteerView manages the view to define the search area using a gazetteer.
 * Embedded in the SpatialExtentView.
 */
var GazetteerView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options) {
		this.parentView = options.parentView;
	},
	
	events :{
		'click #gazetteer-results li' : function(event){		
			var $target = $(event.currentTarget);			
			if ( !$target.hasClass('ui-btn-active') ) {
				this.selectGazetteerResult( $target );
				Map.zoomTo( this.model.searchArea.getFeature().bbox );
			}
		},
			
		'change #search-gazetteer': function(event) {
			$('#gazetteer-results').empty();
			var queryTerm = $(event.currentTarget).val();
			if ( queryTerm != "" ) {
				$('#search-gazetteer').textinput('disable');
				var self = this;
				Gazetteer.query({
						query: queryTerm,
						result: function(data) {
							$('#search-gazetteer').textinput('enable');
							
							// Build a list view for the results
							var listView = $('<ul data-inset="true"></ul>');
							for ( var i = 0; i < data.length; i++ ) {
								// Fix for Safari 5.x, do not use .class directly
								var fullName = data[i].display_name + ' (' + data[i]['class'] + ' ' + data[i].type + ')';
								$('<li>' + fullName + '</li>')
									// Store the data into the DOM element
									.data('data',data[i])
									.appendTo(listView);
							}
							listView
								.appendTo('#gazetteer-results')
								.listview();

							self.selectGazetteerResult( $('#gazetteer-results').find('li:first') );
							Map.zoomTo( self.model.searchArea.getFeature().bbox );
						}
					});
			} else {
				this.model.searchArea.empty();
				this.parentView.updateSearchAreaLayer();
			}
		}
		
	},
	
	/**
	 * Select a gazetteer result given by its DOM element
	 * Update the model with bounding box of the gazetteer result and zoom on it.
	 */
	selectGazetteerResult: function($item) {
		if ( $item.length == 0 )
			return;
			
		$item.parent().find('.ui-btn-active').removeClass('ui-btn-active');
		$item.addClass('ui-btn-active');
		var data = $item.data('data');
		
		if ( data.geotext ) {
			this.model.searchArea.setFromWKT(data.geotext);
			this.parentView.updateSearchAreaLayer();
		} else {	
			var south = parseFloat(data.boundingbox[0]);
			var north = parseFloat(data.boundingbox[1]); 
			var west = parseFloat(data.boundingbox[2]);
			var east = parseFloat(data.boundingbox[3]);
			
			this.model.searchArea.setBBox({
				west : west,
				south: south,
				east: east,
				north: north
			});
			this.parentView.updateSearchAreaLayer();
		}
	},

	open: function() {
		var $item = $('#gazetteer-results').find('li.ui-btn-active');
		if ( $item.length > 0 ) {
			this.selectGazetteerResult($item);
		} else {
			this.model.searchArea.empty();
		}
		this.parentView.updateSearchAreaLayer();
		this.$el.show();
	},
	
	close: function() {
		this.$el.hide();
	},	
	
	
});

return GazetteerView;

});