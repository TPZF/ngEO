
/**
 *	The model of this view is FeatureCollection
 */
var Pagination = Backbone.View.extend({

	initialize: function(options) {
		if ( this.model ) {
			this.setupListeners();
			this.updatePagination();
		}
		this.pagesRange = 5;
	},

	events: {
		// Manage paging through buttons
		'click .first': function() {
			this.model.changePage(1);
		},
		'click .last': function() {
			this.model.changePage(this.model.lastPage);
		},
		'click .next': function() {
			this.model.changePage(this.model.currentPage + 1);
		},
		'click .prev': function() {
			this.model.changePage(this.model.currentPage - 1);
		},
		'click .pageNum': function(event) {
			this.model.changePage(parseInt($(event.currentTarget).attr("value")));
		}
	},

	/**
	 * Called when features are added/removed
	 */
	updatePagination: function() {

		this.$el.find('.pageNum').remove();
		if (parseInt(this.model.totalResults) > 0) {
			// Updage paging button according to the current page
			this.$el.find('#globalPaging a').removeClass('ui-disabled');
			if (this.model.currentPage == 1) {
				this.$el.find('.prev').addClass('ui-disabled');
				this.$el.find('.first').addClass('ui-disabled');
			}
			if (this.model.currentPage == this.model.lastPage) {
				this.$el.find('.next').addClass('ui-disabled');
				this.$el.find('.last').addClass('ui-disabled');
			}
			this.generatePages();
		} else if (this.model.totalResults == 0) {
			this.$el.find('#globalPaging a').addClass('ui-disabled');
		}
	},

	/**
	 *	Setup listeners of FeatureCollection to updating pagination GUI
	 */
	setupListeners: function() {
		this.listenTo(this.model, 'reset:features', this.updatePagination);
		this.listenTo(this.model, 'add:features', this.updatePagination);
		this.listenTo(this.model, 'error:features', function(searchUrl) {
			console.error("Error while retrieving features : " + searchUrl);
		});
	},

	/**
	 *	Set model representing the view
	 */
	setModel: function(model) {
		if ( this.model ) {
			this.stopListening(this.model);
		}
		this.model = model;
		this.setupListeners();
		this.updatePagination();		
	},

	/**
	 *	Generate pages between "Prev" and "Next" labels
	 */
	generatePages: function() {
		if ( this.model ) {

			var startIndex;
			var halfRange = Math.floor(this.pagesRange / 2) + 1;
			if ( this.model.lastPage <= this.pagesRange ) {
				// Case when the range is larger than available pages in dataset
				startIndex = 1;
				endIndex = this.model.lastPage;
			} else {
				if ( this.model.currentPage <= halfRange ) {
					// First half start from beginning
					startIndex = 1;
				} else {
					// Nominal case : compute from current page
					startIndex = this.model.currentPage - (halfRange - 1);
				}

				if ( this.model.currentPage + halfRange > this.model.lastPage )
				{
					// Almost at the end so clamp it by last page
					endIndex = this.model.lastPage;
				} else {
					// Nominal case : compute from current page
					endIndex = this.model.currentPage + (halfRange - 1);
				}
			}

			for ( var i=startIndex; i <= endIndex; i++ ) {
				this.$el.find('.next').before('<a class="pageNum" data-role="button" value="'+i+'">'+i+'</a>');
			}
			this.$el.find('.pageNum[value="'+ this.model.currentPage +'"]').addClass('ui-btn-active');
			this.$el.trigger("create");

		}
	},

	/**
	 *	Render
	 */
	render: function() {
		var content = '<div id="globalPaging" style="text-align: center; margin: 4px 15px;" data-role="controlgroup" data-type="horizontal" data-mini="true">\
			<a class="first" data-role="button"><<</a>\
			<a class="prev" data-role="button"><</a>\
			<a class="next" data-role="button">></a>\
			<a class="last" data-role="button">>></a>\
		</div>';
		this.$el.html(content).trigger("create");
		this.$el.find("a").addClass("ui-disabled");
		if ( this.model ) {
			this.updatePagination();
		}
	}

});

module.exports = Pagination;