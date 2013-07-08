

define( ['jquery', 'logger', 'backbone',  'text!account/template/nameShopcartTemplate.html'], 
		function($, Logger, Backbone, nameShopcart_template) {

var RenameShopcartView = Backbone.View.extend({
	
	events :{
		
		//enable the create shopcart button if and only if the name is not empty
		'blur input' : function (event){
			if ($(event.currentTarget).val() != ""){
				this.$el.find('#submit').button('enable');
			}else{
				this.$el.find('#submit').button('disable');
			}
		},
		
		//the button clicked to submit the query 
		'click #submit' : function(event){
			event.preventDefault();
			console.log("currentShopcartId = " + this.model.currentShopcartId);
			this.model.getCurrentShopcartConfig().set({ "name" : $('#shopcartNameField').val()}).save();
		}
	},
	
	// Render the view
	render: function(){
	
		this.$el.append(nameShopcart_template);
		this.$el.trigger('create');		
		this.$el.find('#submit').button('disable');
		return this;
	}
});

return RenameShopcartView;

});