var UserPrefs = require('userPrefs');
var userPrefs_template = require('account/template/userPrefsContent');

/** the mode is the Inquiry object */
var UserPrefsView = Backbone.View.extend({

	/**
	 * The model is the UserPrefs singleton.
	 * Simple Implemetantion with only the reset of the preferences 
	 * without knowledge on the type of the feature to remove.
	 */
	initialize: function() {
		UserPrefs.on("addedPreference removedPreference", this.refresh, this);
	},

	events: {

		'click #clearPrefs': function(event) {
			UserPrefs.reset();
		}
	},

	render: function() {

		this.$el.append(userPrefs_template(UserPrefs));
		this.$el.trigger('create');

		return this;
	},

	refresh: function() {
		this.$el.empty();
		this.render();
	}
});

module.exports = UserPrefsView;