

define( ['jquery', 'backbone', 'text!account/template/inquiriesContent.html'], 
		function($, Backbone, inquiries_template) {

	/** the mode is the Inquiry object */
var InquiriesView = Backbone.View.extend({
	
	events :{
		
		//the inquiry type has been changed
		'change :select' : function(event){
			// this.model.type = $(event.currentTarget).val();
		},
		
		//the inquiry text has been written
		'blur #inquiryMessage' : function(event){
			// this.model.message = $(event.currentTarget).val();
		},
		
		//the button clicked to submit the inquiry 
		'click #submitInquiry' : function(event){
			event.preventDefault();
			$('<div><p>Not Implemented Yet.' +
			'</p><p>Interface Not defined</p></div>')
				.appendTo('.ui-page-active')
				.popup()
				.popup('open');
		}
	},
	
	render: function(){
	
		this.$el.append(inquiries_template);
		this.$el.trigger('create');		

		return this;
	}	
});

return InquiriesView;

});
