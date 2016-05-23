var Logger = require('logger');
var inquiries_template = require('account/template/inquiriesContent');
var Configuration = require('configuration');

/** the mode is the Inquiry object */
var InquiriesView = Backbone.View.extend({

	events: {
		//the button clicked to submit the inquiry 
		'click #submitInquiry': function(event) {
			event.preventDefault();

			if (this.validateInquiryForm())
				this.submit();
		},

		'change #inquiryType': function(event) {
			//at initialisation, the inquiry type choosen is '-1' and the '-1' option is unselectable.
			//the submit button is disabled at initialisation
			//so whenever we select an inquiryType, we forcely chose other than '-1' inquiryType
			//so enable the button submit
			event.preventDefault();
			$('#submitInquiryButtonContainer').removeClass("ui-disabled");
		}

	},

	/**
	 * Check if the texarea containing message is not empty and the chosen inquiryType is valid.
	 * If valid then enable button submit, otherwise disable it
	 * @return 
	 *	true if it is valid
	 *	false otherwise
	 */
	validateInquiryForm: function() {
		var message = this.$el.find('#inquiryMessage').val().trim();
		var iType = this.$el.find('select').val();
		var isValid = true;

		if (message == null || message == '') {
			Logger.inform("Please enter your inquiry message");
			isValid = false;
		} else if (iType == null || iType == '-1') {
			//normally, we will never enter here, because, this function is called whenever
			//the submit button is clicked.
			//And the submit button is enabled only if the 'inquiry type' is valid
			Logger.inform("Please choose an inquiry type");
			isValid = false;
		}

		return isValid;
	},

	// Submit an inquiry to the web server
	submit: function() {

		// Build the JSON to send to the server
		var body = {
			UserInquiry: {
				inquiryType: this.$el.find('select').val(),
				inquiryText: this.$el.find('#inquiryMessage').val().trim()
			}
		};

		var self = this;
		$.ajax({
			url: "/ngeo/userInquiry",
			data: JSON.stringify(body),
			type: 'POST',
			contentType: 'application/json',
			success: function() {
				Logger.inform('Inquiry successfully send to the server.');
				self.$el.find('select').val('-1');
				self.$el.find('select').selectmenu('refresh', true);
				self.$el.find('#inquiryMessage').val('');
				//as the select inquiry is reinitialized and the 'select' value is "-1", then disable button 'submit'
				//so user cannot send 'a not valid' inquiryType
				self.$el.find('#submitInquiryButtonContainer').addClass("ui-disabled");
			},
			error: function(jqXHR, textStatus, errorThrown) {
				Logger.error('Submit an inquiry failed  :  ' + errorThrown + ' (' + textStatus + ')');
			}
		});
	},

	// Render the view
	render: function() {

		this.$el.append(inquiries_template({
			theme: Configuration.localConfig.theme
		}));
		this.$el.find('#submitInquiryButtonContainer').addClass("ui-disabled");
		this.$el.trigger('create');
		return this;
	}
});

module.exports = InquiriesView;