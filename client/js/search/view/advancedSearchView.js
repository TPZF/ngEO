

define( ['jquery', 'backbone', 'configuration', 'text!search/template/advancedCriteriaContent.html'], 
		function($, Backbone, Configuration, advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the advanced criteria 
	 */
	
	initialize : function() {
		this.listenTo( this.model, 'change:advancedAttributes', this.render );
	}, 
	
	events : {
				
		//catch the criterion range changes once the slider moving is finished
		'slidestop input' : function(event) {
			this.setInputCriterionValues(event);
		},
		
		//catch the changes of criterion range and/or simple text values by entering values in the text field
		//do not use input 'change' event to avoid interference of handlers. 
		//In fact, when moving the slider change input event is triggered  
		//so this would make the handlers called twice.
		'blur input' : function(event) {
			this.setInputCriterionValues(event);
		},
		
		//listen to radio and check boxes change events since the events are handled respectively 
		//by the radio and check boxes labels 
		'click label' : function(event){
			
			var $target = $(event.currentTarget);
			var $input = $target.next();			
			var value = $input.attr('value');
			var name = $input.attr('name');
			var newValue = this.model.get(name);
			
			// Update the value
			if ( $target.hasClass('ui-checkbox-off') ) {
			
				if (!newValue) {
					newValue = value;
				} else {
					newValue += "," + value;
				}
				
				//set the new value
				this.model.set(name, newValue);	

			} else if ( $target.hasClass('ui-checkbox-on') ) {
			
				var currentValues = newValue.split(',');
				var currentValues = _.without( currentValues, value );
				
				//set the new value or remove if empty
				if ( currentValues.length == 0 ) {
					this.model.unset(name);	
				} else {
					this.model.set(name, currentValues.join(','));	
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
		
		if ( from == $from.attr('min') 
			 && to == $to.attr('max') ) {
			 this.model.unset(name);	
		} else {
			var value = '[' + from + ',' + to  + ']';
			this.model.set(name, value);	
		}
	},
	
	/** Handler called after a slideStop and blur events on an input field a criterion.
	 * handles range input changes and simple text field changes depending on the input id suffix
	 */
	setInputCriterionValues : function(event){

		var name = event.currentTarget.id;
		
		if ( name.match(/_from|_to/) ) {
			name = name.replace(/_from|_to/,'');
			this.updateRange(name);
		} else {
			var value = $(event.currentTarget).val();
			this.model.set(name, value);	
		}
		
	},
	
	render: function(){
		var criterionLabels = Configuration.get("search.advancedCriteriaLabels",{});
		var content = _.template(advancedCriteria_template, {
			model: this.model
			criterionLabels: criterionLabels
		});

		
		this.$el.html(content);
		this.$el.trigger('create');
		return this;
	}
});

return AdvancedSearchView;

});
