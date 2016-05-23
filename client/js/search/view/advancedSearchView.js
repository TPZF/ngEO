var Configuration = require('configuration');
var advancedCriteria_template = require('search/template/advancedCriteriaContent');

var AdvancedSearchView = Backbone.View.extend({

	id: "advancedSearchView",

	/** 
	 * The model is the DatasetSearch (the search model containing search parameters)
	 * The dataset property of DatasetSearch is the Dataset backbone model containing the advanced criteria 
	 */

	initialize: function(options) {
		this.listenTo(this.model, 'change:advancedAttributes', this.render);
		this.dataset = options.dataset;
		this.advancedAttributes = this.model.get("advancedAttributes")[this.dataset.get("datasetId")];
	},

	events: {

		//catch the criterion range changes once the slider moving is finished
		'slidestop input': function(event) {
			this.setInputCriterionValues(event);
		},

		//catch the changes of criterion range and/or simple text values by entering values in the text field
		//do not use input 'change' event to avoid interference of handlers. 
		//In fact, when moving the slider change input event is triggered  
		//so this would make the handlers called twice.
		'blur input': function(event) {
			this.setInputCriterionValues(event);
		},

		//listen to radio and check boxes change events since the events are handled respectively 
		//by the radio and check boxes labels 
		'click label': function(event) {

			var $target = $(event.currentTarget);
			var $input = $target.next();
			var newValue = $input.attr('value');
			var name = $input.attr('name');

			var attributeToUpdate = _.findWhere(this.advancedAttributes, {
				id: name
			});
			var currentValue = attributeToUpdate.value;
			// Update the value
			if ($target.hasClass('ui-checkbox-off')) {

				// NGEO-2075: Surround value with quotes in case when value contains ","
				if (newValue.indexOf(",") != -1) {
					newValue = "\"" + newValue + "\"";
				}
				if (!currentValue) {
					currentValue = newValue;
				} else {
					currentValue += "," + newValue;
				}

				// Update attribute with new value
				attributeToUpdate.value = currentValue;

			} else if ($target.hasClass('ui-checkbox-on')) {
				var currentValues = null;
				var hasQuotes = currentValue.indexOf("\"") >= 0;
				if ( hasQuotes ) {
					var regExp = new RegExp(/(\w{1,}[,-\s+\w{1,}]*)/g); // Take values with "," without quote sign
					currentValues = currentValue.match(regExp);
				} else {
					// Parameters without "," so split it as usual
					currentValues = currentValue.split(",");
				}

				currentValues = _.without(currentValues, newValue);

				// Re-surround array with quotes after "without" operation
				if ( hasQuotes ) {
					currentValues = currentValues.map(function(val){
						return "\"" + val + "\""; // NGEO-2075
					});
				}

				//set the new value or remove if empty
				if (currentValues.length == 0) {
					delete attributeToUpdate.value;
				} else {
					attributeToUpdate.value = currentValues.join(',');
				}
			}
		}
	},

	/**
	 * Update a range
	 */
	updateRange: function(name) {

		var $from = this.$el.find('#' + name + '_from');
		var $to = this.$el.find('#' + name + '_to');

		var from = $from.val();
		var to = $to.val();

		var attributeToUpdate = _.findWhere(this.advancedAttributes, {
			id: name
		});
		if (from == $from.attr('min') && to == $to.attr('max')) {
			delete attributeToUpdate.value;
		} else {
			var value = '[' + from + ',' + to + ']';
			attributeToUpdate.value = value;
		}
	},

	/**
	 * Handler called after a slideStop and blur events on an input field a criterion.
	 * handles range input changes and simple text field changes depending on the input id suffix
	 */
	setInputCriterionValues: function(event) {
		var name = event.currentTarget.id;
		if (name.match(/_from|_to/)) {
			name = name.replace(/_from|_to/, '');
			this.updateRange(name);
		} else {
			var attributeToUpdate = _.findWhere(this.advancedAttributes, {
				id: name
			});
			var value = $(event.currentTarget).val();
			attributeToUpdate.value = value;
		}

	},

	render: function() {
		var criterionLabels = Configuration.get("search.advancedCriteriaLabels", {});
		var content = advancedCriteria_template({
			advancedAttributes: this.model.get("advancedAttributes")[this.dataset.get("datasetId")],
			criterionLabels: criterionLabels,
			dataset: this.dataset,
			theme: Configuration.localConfig.theme
		});


		this.$el.html(content);
		this.$el.trigger('create');
		return this;
	}
});

module.exports = AdvancedSearchView;