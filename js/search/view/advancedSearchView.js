

define( ['jquery', 'backbone', 'configuration', 'text!search/template/advancedCriteriaContent.html'], 
		function($, Backbone, Configuration, advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the advanced criteria 
	 */
	
	events : {
		
		//for every criteria modified by a select element, set in the DatasetSearch the criterion 
		//with the selected value (the select is used for single-valued criteria)
		'change select' : function(event){
			var criterion = {};
			criterion[event.currentTarget.id] = $(event.currentTarget).val();
			this.model.set(criterion);			
		},
		
		//catch the criterion range changes of once the slider moving is finished
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
			var suffix = Configuration.data.fieldIdSuffixSepartor + Configuration.data.inputLabelSuffix;
			var criterionIdValue = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf(suffix));
			
			//case where the use advanced criteria is checked
			if (criterionIdValue == "useAdvancedCriteria"){
				
				var useAdvancedCriteria = $target.hasClass('ui-checkbox-off');
				this.model.set({"useAdvancedCriteria" : useAdvancedCriteria});
			
			}else{//handle radio/checkbox search criteria fields
				
				var criterionId = criterionIdValue.substring(0, criterionIdValue.indexOf(Configuration.data.fieldIdSuffixSepartor));
				var criterionValue = criterionIdValue.substring(criterionIdValue.indexOf(Configuration.data.fieldIdSuffixSepartor)+1, criterionIdValue.length);		
				var openSearchCriterion = {};
				var newValue;
				
				if ($target.hasClass("ui-radio-off")){//Radio button
					//look for class ui-radio-off because it is going to be changed to ui-radio-on at the end of the handler
					newValue = criterionValue;
					
				}else if ($target.hasClass('ui-checkbox-off')){//Checkbox button checked
			
					var criterionSetValue = this.model.get(criterionId);
					//if the criterion has not been changed then set the checked value
					//unless the criterion has already been changed by the user, then add the new checked value
					//the multiple-valued string
					//if the set value is the the default one update it with the new checked values
					if (criterionSetValue == undefined || criterionSetValue == this.model.dataset.getDefaultCriterionValue(criterionId)){
						newValue = criterionValue;
					}else{
						newValue = criterionSetValue + "," + criterionValue;
					}
				
				}else if ($target.hasClass('ui-checkbox-on')){ //unselect a value
					
					var criterionSetValue = this.model.get(criterionId);
					console.log("Criterion : "  + criterionId + " old value :" + criterionSetValue);
					
					if (criterionSetValue == criterionValue){//one value is selected so set the default value to the whole possible values
						newValue = this.model.dataset.getDefaultCriterionValue(criterionId);
					
					}else{
						var index = criterionSetValue.indexOf(criterionValue);
						//add +1 to remove the comma after!
						if (index == 0 || index != criterionSetValue.length - criterionValue.length){
							newValue = criterionSetValue.replace(criterionValue + ",", "");	
						}else {//criteria value at the end then remove the comma before
							newValue = criterionSetValue.replace("," + criterionValue, "");
						} 
					}
					console.log("Criterion : "  + criterionId + " new value :" + newValue);
				
				} else {
					//do nothing ! console.log(" not ui-radio-off");
				}
				//set the new value to the json object and add it to the model
				openSearchCriterion[criterionId] = newValue;
				this.model.set(openSearchCriterion);	
			}
		}		
	},
	
	/** Handler called after a slideStop and blur events on an input field a criterion.
	 * handles range input changes and simple text field changes depending on the input id suffix
	 */
	setInputCriterionValues : function(event){

		var criterionId = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf(Configuration.data.fieldIdSuffixSepartor));
		var inputSuffix =  event.currentTarget.id.substring(event.currentTarget.id.lastIndexOf(Configuration.data.fieldIdSuffixSepartor)+1, event.currentTarget.id.length);
		var openSearchCriterion = {};
		var criterionValue, currentValue;
		var otherRangeLimitId  = criterionId + Configuration.data.fieldIdSuffixSepartor;
		//if the start range has been changed set the new value of the criteria by retrieving the 
		//stop range value and inversely. Unless the input is a text input with one value
		if (inputSuffix == Configuration.data.rangeStartSuffix){ //range start 	
			otherRangeLimitId = otherRangeLimitId + Configuration.data.rangeStopSuffix;
			//handle the case where nothing is entered in the text fields
			//set the value to the min range
			currentValue = $(event.currentTarget).val();
			if (currentValue == ''){
				currentValue = $(event.currentTarget).attr('min')
				$(event.currentTarget).val(currentValue);
			}
			//create the range value
			criterionValue = "[" + currentValue + "," +$('#' + otherRangeLimitId).val() + "]";
				
		}else if (inputSuffix == Configuration.data.rangeStopSuffix){ //range stop 
			otherRangeLimitId = otherRangeLimitId + Configuration.data.rangeStartSuffix;			
			//handle the case where nothing is entered in the text fields
			//set the value to the max value
			currentValue = $(event.currentTarget).val();
			if (currentValue == ''){
				currentValue = $(event.currentTarget).attr('max')
				$(event.currentTarget).val(currentValue);
			}
			//create the range value
			criterionValue = "[" + $('#' + otherRangeLimitId).val() + "," + currentValue + "]";
			
		}else{//simple text input 
			criterionValue = $(event.currentTarget).val();
			
		}
		//set the new value to the json object and add it to the model
		openSearchCriterion[criterionId] = criterionValue;
		this.model.set(openSearchCriterion);	
	},
	
	render: function(){

		var content = _.template(advancedCriteria_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
		this.delegateEvents();
		return this;
	},	
	
	// TODO move to Backbone.View.prototype
    close : function() {
       this.undelegateEvents();
       this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    }, 

    onClose : function() {
    },
	
});

return AdvancedSearchView;

});
