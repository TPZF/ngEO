

define( ['jquery', 'logger', 'backbone', 'text!account/template/inquiriesContent.html'], 
		function($, Logger, Backbone, inquiries_template) {

	/** the mode is the Inquiry object */
var InquiriesView = Backbone.View.extend({
	
	events :{
		
		//the button clicked to submit the inquiry 
		'click #submitInquiry' : function(event){
			event.preventDefault();
			this.submit();
		}
	},
	
	// Submit an inquiry to the web server
	submit: function() {
	
		// Build the JSON to send to the server
		var body = {
			inquiryType : this.$el.find('select').val(),
			inquiryText : this.$el.find('#inquiryMessage').val()
		};
		
		var self = this;
		$.ajax({
			url: "/ngeo/userInquiry",
			data: JSON.stringify(body),
			type: 'POST',
			contentType : 'application/json',
			success : function() {
				Logger.inform('Inquiry successfully send to the server.');
				self.$el.find('select').val('None');
				self.$el.find('#inquiryMessage').val('');
			},
			error: function(jqXHR, textStatus, errorThrown ) {
				Logger.error('Submit an inquiry failed  :  ' + errorThrown + ' (' + textStatus + ')' );
			}
		});
	},
	
	// Render the view
	render: function(){
	
		this.$el.append(inquiries_template);
		this.$el.trigger('create');		

		return this;
	}	
});

return InquiriesView;

});
