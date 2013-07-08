

define( ['jquery', 'logger', 'backbone',  'text!account/template/nameShopcartTemplate.html'], 
		function($, Logger, Backbone, nameShopcart_template) {

var CreateShopcartView = Backbone.View.extend({
	
	events :{
		
		//enable the create shopcart button if and only if the name is not empty
		'blur input' : function (event){
			if ($(event.currentTarget).val() != ""){
				this.$el.find('#submit').button('enable');
			}else{
				this.$el.find('#submit').button('disable');
			}
		},
		
		//the button clicked to submit the inquiry 
		'click #submit' : function(event){
			event.preventDefault();
			this.model.create({ "name" : $('#shopcartNameField').val(),
								"userId" : "",
								"isDefault" : false});
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

return CreateShopcartView;

});
