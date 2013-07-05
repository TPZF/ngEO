

define( ['jquery', 'logger', 'backbone',  'text!account/template/createShopcartTemplate.html'], 
		function($, Logger, Backbone, createShopcart_template) {

	/** the mode is the Inquiry object */
var CreateShopcartView = Backbone.View.extend({
	
	events :{
		
		//enable the create shopcart button if and only if the name is not empty
		'blur input' : function (event){
			if ($(event.currentTarget).val() != ""){
				this.$el.find('#createShopcartButton').button('enable');
			}else{
				this.$el.find.$('#createShopcartButton').button('disable');
			}
		},
		
		//the button clicked to submit the inquiry 
		'click #createShopcartButton' : function(event){
			event.preventDefault();
			this.model.create({
								"name" : $('#shopcartNameField').val(),
								"userId" : "",
								"isDefault" : false});
		}
	},
	
	// Render the view
	render: function(){
	
		this.$el.append(createShopcart_template);
		this.$el.trigger('create');		
		this.$el.find('#createShopcartButton').button('disable');
		return this;
	}	
});

return CreateShopcartView;

});
