var UserPrefs = require('userPrefs');
var userPrefs_template = require('account/template/userPrefsContent');
var Configuration = require('configuration');

/**
 * The model is the UserPrefs singleton.
 * Simple Implemetantion with only the reset of the preferences 
 * without knowledge on the type of the feature to remove.
 */
var UserPrefsView = Backbone.View.extend({

	initialize: function() {
		UserPrefs.on("addedPreference removedPreference", this.refresh, this);
	},

	events: {

		'click #clearPrefs': function(event) {
			UserPrefs.reset();
		}
	},

	render: function() {

		this.$el.append(userPrefs_template({
			theme: Configuration.localConfig.theme,
			UserPrefs: UserPrefs
		}));
		this.$el.trigger('create');

		return this;
	},

	refresh: function() {
		this.$el.empty();
		this.render();
	}
});

module.exports = UserPrefsView;