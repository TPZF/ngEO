define(
		[ 'jquery', 'logger', 'backbone', 
          'text!searchResults/template/searchResultsViewContent.html' ],
	function($, Logger, Backbone, searchResultsViewContent ) {

	
/**
 * The view for search results
 */
var SearchResultsView = Backbone.View.extend({

	id: 'resultsBar',
	
	/**
	 * Constructor
	 */
	initialize : function() {
	
		this.listenTo(this.model,'startLoading', this.onStartLoading );
		this.listenTo(this.model,'reset:features', this.onResetFeatures );
		this.listenTo(this.model,'add:features', this.onAddFeatures );
		this.listenTo(this.model,'error:features', function(searchUrl) {
			Logger.error('An error occured when retrieving the products with the search url :<br>' + searchUrl);
		});
	},

	/**
	 * Manage events on the view
	 */
	events : {
		// Manage paging through buttons
		'click #paging_first': function() {
			this.model.changePage(1);
		},	
		'click #paging_last': function() {
			this.model.changePage( this.model.lastPage );
		},	
		'click #paging_next': function() {
			this.model.changePage( this.model.currentPage + 1 );
		},	
		'click #paging_prev': function() {
			this.model.changePage( this.model.currentPage - 1 );
		}
	},
	
	/**
	 * Called when the model start loading
	 */
	onStartLoading: function() {
		
		this.$el.find('#paging a').addClass('ui-disabled');

		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.html( "Searching..." );
	
		// Pulsate animation when searching
		var fadeOutOptions = {
			duration: 300,
			easing: "linear",
			complete: function() {
				$(this).animate({opacity:1.0},fadeInOptions);
			}
		};
		var fadeInOptions = {
			duration: 300,
			easing: "linear",
			complete: function() {
				$(this).animate({opacity:0.2},fadeOutOptions);
			}
		};
		$resultsMessage.animate({opacity:0.2},fadeOutOptions);
		$resultsMessage.show();
	},

	/**
	 * Called when features are added
	 */
	onAddFeatures: function(features) {		
			
		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.stop(true);
		$resultsMessage.css('opacity',1.0);
		$resultsMessage.show();
		
		if ( this.model.totalResults > 0 ) {
			var startIndex = 1 + (this.model.currentPage-1) * this.model.countPerPage;
			$resultsMessage.html( 'Showing ' + startIndex + ' to ' + (startIndex + features.length - 1) + " of " + this.model.totalResults + " products." );
			
			// Updage paging button according to the current page
			this.$el.find('#paging a').removeClass('ui-disabled');
			if ( this.model.currentPage == 1 ) {
				this.$el.find('#paging_prev').addClass('ui-disabled');
				this.$el.find('#paging_first').addClass('ui-disabled');
			} 
			if ( this.model.currentPage == this.model.lastPage ) {
				this.$el.find('#paging_next').addClass('ui-disabled');
				this.$el.find('#paging_last').addClass('ui-disabled');
			}
		} else if ( this.model.totalResults == 0 ) {
			this.$el.find('#paging a').addClass('ui-disabled');
			$resultsMessage.html( 'No product found.' );
		} else {
			$resultsMessage.html( 'No search done.' );
		}
	},

	/**
	 * Called when the model is reset
	 */
	onResetFeatures: function() {
			
		this.$el.find('#paging a').addClass('ui-disabled');
		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.hide();
	},
	
	/**
	 * Render the view
	 */
	render : function() {
	
		this.$el
			.addClass('ui-grid-b')
			.html(searchResultsViewContent);
		this.$el.trigger('create');
		
		// Set the dataset
		this.$el.find('#datasetMessage').html('Dataset : ' + this.model.id );

		// To start paging is disable
		this.$el.find('#paging a').addClass('ui-disabled');
	}
});

return SearchResultsView;

});