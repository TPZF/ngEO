

define( ['jquery', 'logger', 'backbone',  'text!account/template/nameShopcartTemplate.html', 'ui/widget'], 
		function($, Logger, Backbone, nameShopcart_template) {

var CreateShopcartView = Backbone.View.extend({
	
	initialize : function(){
	},
	
	events :{
		
		//enable the create shopcart button if and only if the name is not empty
		'blur #shopcartNameField' : 'updateSubmitButtonStatus',
		
		//when the textfield gets the focus bind the keypress event
		'focusin #shopcartNameField' : function(event){
			var self = this;
			$(event.currentTarget).keypress(function(event){
				self.updateSubmitButtonStatus(event);
				//if the ENTER keyboard is pressed submit the create shopcart request
				if (event.which == 13){
					self.submit(event);
				}	
			});
		},
		
		//called when the submit button is clicked
		'click #submit' : function(event){
			event.preventDefault();
			var self = this;
			this.submit( $('#shopcartNameField').val(), {
				success: function() {
					self.$el.ngeowidget('hide');
				},
				error: function() {
					self.$el.find('#serverMessage').append('<div>' + self.errorMessage() + '</div>');
				}
			});
		}
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
	
	/**
	 * submit the create shopcart request
	 */
	submit : function(name,options) {
		this.model.create({ "name" : name,
							"userId" : "",
							"isDefault" : false}, options);
	},
	
	/** 
	 * Return an error message
	 */ 
	errorMessage: function() {
		return "Error : A new shopcart cannot be created.";
	},
			
	/** 
	 * Render the view
	 */ 
	render: function(){
	
		this.$el.append(nameShopcart_template);
		this.$el.appendTo('.ui-page-active');
		this.$el.ngeowidget({
			title: this.options.title,
			hide: $.proxy( this.remove, this )
		});

		this.$el.trigger('create');		
		this.$el.find('#submit').button('disable');
		
		//Open the popup
		this.$el.ngeowidget("show");

		return this;
	}	
});

return CreateShopcartView;

});
