define( ['jquery', 'backbone', 'userPrefs', 'text!account/template/userPrefsContent.html'], 
		function($, Backbone, UserPrefs, userPrefs_template) {

/** the mode is the Inquiry object */
var UserPrefsView = Backbone.View.extend({
	
	/**
	 * The model is the UserPrefs singleton.
	 * Simple Implemetantion with only the reset of the preferences 
	 * without knowledge on the type of the feature to remove.
	 */
	initialize : function(){
		UserPrefs.on("addedPreference removedPreference", this.refresh, this);		
	},
	
	events :{

		'click #clearPrefs' : function(event){
			UserPrefs.reset();
		}
	},
	
	render: function(){
	
		this.$el.append(_.template(userPrefs_template, UserPrefs));
		this.$el.trigger('create');		

		return this;
	},
	
	refresh : function(){
		this.$el.empty();
		this.render();
	}
});

return UserPrefsView;

});