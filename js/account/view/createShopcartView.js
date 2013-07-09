

define( ['jquery', 'logger', 'backbone',  'text!account/template/nameShopcartTemplate.html'], 
		function($, Logger, Backbone, nameShopcart_template) {

var CreateShopcartView = Backbone.View.extend({
	
	initialize : function(){
		this.model.on("sync", this.close, this);
	},
	
	events :{
		
		//enable the create shopcart button if and only if the name is not empty
		'blur #shopcartNameField' : function (event){
			this.updateSubmitButtonStatus(event);
		},
		
		//when the textfield gets the focus bind the keypress event
		'focusin #shopcartNameField' : function(event){
			var self = this;
			$(event.currentTarget).keypress(function(event){
				self.updateSubmitButtonStatus(event);
				//if the ENTER keyboard is pressed submit the create 
				//shopcart request
				if (event.which == 13){
					self.submit(event);
				}	
			});
		},
		
		//called when the submit button is clicked
		'click #submit' : function(event){
			this.submit(event);
		}
	},
	
	/**
	 * submit the create shopcart request
	 */
	submit : function(event){
		event.preventDefault();
		var success = this.model.create({ "name" : $('#shopcartNameField').val(),
							"userId" : "",
							"isDefault" : false});
		if (!success){
			this.error();
		}
	},
	
	/** 
	 * close the containg widget 
	 */ 
	close : function(event){
		this.$el.parent().ngeowidget('hide');

	}, 
	
	/** 
	 * update the status of the submit button 
	 */
	updateSubmitButtonStatus : function(event){
		if ($(event.currentTarget).val() != ""){
			this.$el.find('#submit').button('enable');
		}else{
			this.$el.find('#submit').button('disable');
		}
	},
	
	
	error : function(event){
		this.$el.find('#serverMessage').append('<div>Error : A new shopcart cannot be created.</div>');
	},
	
	/** 
	 * Render the view
	 */ 
	render: function(){
	
		this.$el.append(nameShopcart_template);
		this.$el.trigger('create');		
		this.$el.find('#submit').button('disable');
		var self = this;

		return this;
	}	
});

return CreateShopcartView;

});
