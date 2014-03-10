

define( ['jquery', 'logger', 'backbone',  'text!account/template/nameShopcartTemplate.html', 'ui/widget'], 
		function($, Logger, Backbone, nameShopcart_template) {

var CreateShopcartView = Backbone.View.extend({
		
	events :{
				
		//called when the submit button is clicked
		'click #submit' : function(event){
			event.preventDefault();
			
			var name = this.$el.find('#shopcartNameField').val();
			if ( name && name != "" ) {
				var self = this;
				this.submit( name, {
						success: function() {
							self.$el.ngeowidget('hide');
						},
						error: function() {
							self.$el.find('#serverMessage').append('<p>' + self.errorMessage() + '</p>');
						}
					});
			} else {
				this.$el.find('#serverMessage').append('<p>Error : name cannot be empty</p>');
			}
		}
	},
		
	/**
	 * submit the create shopcart request
	 */
	submit : function(name,options) {
		this.model.create({name : name}, options);
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

		//Open the popup
		this.$el.ngeowidget("show");

		return this;
	}	
});

return CreateShopcartView;

});
