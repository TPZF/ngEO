define( ['jquery', 'backbone', 'configuration', 'text!account/template/shopcartManagerContent.html'], 
			function($, Backbone, Configuration, shopcartManagerContent_template) {

var ShopcartManagerView = Backbone.View.extend({
	
	
	initialize : function(){

		this.model.on("sync" , this.render, this);
		//this.model.on("error" , this.error, this);
	},
	
	events : {
		
		//TODO IMPLEMENT
//		'click label' : function(event){
//			
//		},
//		
//		'click load_shp' : function(event){
//			
//		}
	},
	
	render : function(){
		this.$el.empty();
		var mainContent = _.template(shopcartManagerContent_template, this.model.attributes);
		this.$el.append(mainContent);
		this.$el.trigger("create");
		return this;
	}
	
});

return ShopcartManagerView;

});