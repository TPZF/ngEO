var Logger = require('logger');
var nameShopcart_template = require('account/template/nameShopcartTemplate');
var ngeoWidget = require('ui/widget');

var CreateShopcartView = Backbone.View.extend({

	events: {

		//called when the submit button is clicked
		'click #submitShopcart': function(event) {
			event.preventDefault();

			var name = this.$el.find('#shopcartNameField').val();
			if (name && name != "") {
				var self = this;
				this.submit(name, {
					success: function(model) {
						if (self.options.success) {
							self.options.success(model);
						}
						self.$el.ngeowidget('hide');
					},
					error: function() {
						self.$el.find('#serverMessage').html('<p>' + self.errorMessage() + '</p>');
						//$('#submitShopcart').button('disable');
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
	submit: function(name, options) {
		this.model.create({
			name: name
		}, options);
	},

	/** 
	 * Return an error message
	 */
	errorMessage: function() {
		return "Error : cannot create the shopcart on the server.";
	},

	/** 
	 * Render the view
	 */
	render: function() {

		this.$el.append(nameShopcart_template());
		this.$el.appendTo('.ui-page-active');
		this.$el.ngeowidget({
			title: this.options.title,
			hide: $.proxy(this.remove, this)
		});

		this.$el.trigger('create');

		//Open the popup
		this.$el.ngeowidget("show");

		return this;
	}
});

module.exports = CreateShopcartView;