define( ['jquery', 'backbone', 'userPrefs', 'text!account/template/userPrefsContent.html'], 
		function($, Backbone, UserPrefs, userPrefs_template) {

/** the mode is the Inquiry object */
var UserPrefsView = Backbone.View.extend({
	
	/**
	 * The model is the UserPrefs singleton
	 */
	initialize : function(){
	},
	
	events :{
		
		//EM it is forseen to have one/many button for each saved item in the prefs 
		//in order to choose/remove it (and load it in the context).... 
//		'click :button' : function(event){
//			// load the choosen preferences item : ie
//			//for now select the dataset in the list
//			
//		}
		
		'click #clearPrefs' : function(event){
			this.model.reset();
			this.$el.render();
		}
	},
	
	render: function(){
	
		this.$el.append(userPrefs_template, UserPrefs);
		this.$el.trigger('create');		

		return this;
	},
	
	refresh : function(){
		this.$el.empty();
		this.$el.render();
	}
});

return UserPrefsView;

});