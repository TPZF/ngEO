
/**
 *	The model of this view is FeatureCollection
 */
var Pagination = Backbone.View.extend({

	initialize: function(options) {
		if ( this.model ) {
			this.setupListeners();
			this.updatePagination();
		}
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
		}
	},

	/**
	 * Called when features are added/removed
	 */
	updatePagination: function() {

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
	 *	Render
	 */
	render: function() {
		var content = '<div id="globalPaging" style="text-align: center; margin: 15px;" data-role="controlgroup" data-type="horizontal" data-mini="true">\
			<a class="first" data-role="button">First</a>\
			<a class="prev" data-role="button">Previous</a>\
			<a class="next" data-role="button">Next</a>\
			<a class="last" data-role="button">Last</a>\
		</div>';
		this.$el.html(content).trigger("create");
		this.$el.find("a").addClass("ui-disabled");
		if ( this.model ) {
			this.updatePagination();
		}
	}

});

module.exports = Pagination;