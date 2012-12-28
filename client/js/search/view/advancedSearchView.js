

define( ['jquery', 'backbone', 'configuration', 'search/model/dataset',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Configuration, Dataset, advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search params)
	/* the dataset attribute is the Dataset backbone model containing the advanced criteria 
	 */
	
	events : {	
		//for every criteria modified by a select element, set in the DatasetSearch the openSearch mapped criterion 
		//with the selected value (the select is used for single-valued criteria 
		'change select' : function(event){
			var self = this;
			var criterion = {};
			
			_.each(Configuration.data.searchCriteriaToOpenSearchMapping, function(value, key, list){
				
				if (event.currentTarget.id == key){
					criterion[value] = $(event.currentTarget).val();
					self.model.set(criterion);			
					return;
				}
			});

		},
		
		//catch the changes of criterion range by moving the slider
		'slidestop input' : function(event) {
			console.log('slidestop input');
			var criterionId = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf("_"));
			var rangeStart =  event.currentTarget.id.substring(event.currentTarget.id.lastIndexOf("_")+1, event.currentTarget.id.length);
			console.log(criterionId);
			console.log(rangeStart);
			var openSearchCriterion = {};
			var self = this;
			//if the start range has been changed set the new value of the criteria by retrieving the 
			//stop range value and inversely.
			if (rangeStart == 'from'){
				console.log($('#' + criterionId+ '_to'));
				console.log($('#' + criterionId+ '_to').val());
				openSearchCriterion[Configuration.getCriterionOpenSearchMapping(criterionId)] = "[" + $(event.currentTarget).val() + "," +$('#' + criterionId+ '_to').val() + "]";
				console.log("search criterion set");
				console.log(openSearchCriterion);
				self.model.set(openSearchCriterion);	
			}else if (rangeStart == 'to'){
				openSearchCriterion[Configuration.getCriterionOpenSearchMapping(criterionId)] = "[" + $('#' + criterionId+ '_from').val() + "," + $(event.currentTarget).val() + "]";
				console.log("search criterion set");
				console.log(openSearchCriterion);
				self.model.set(openSearchCriterion);	
			}else{
				//Should not happen ! not supported ! 
			}
		},
		
		//catch the changes of criterion range by entering values in the text field
		'click input' : function(event) {
			
			//TODOconsole.log('radio input');
			console.log($(event.currentTarget));
			console.log($(event.currentTarget).val());
		},
		
		//listen to radio and check boxes change events since the events are handled by the radio and check boxes labels 
		'click label' : function(event){
			//TODO
//			var $target = $(event.currentTarget);
//			//look for class ui-radio-off because it is going to be changed to ui-radio-on at the end of the handler
//			var criterionId = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf("_label"));
//			var openSearchCriterion = {};
//			var self = this;
//			
//			if ($target.hasClass("ui-radio-off")){
//				console.log("ui-radio-off");
//				console.log(criterionId);
//				openSearchCriterion[Configuration.getCriterionOpenSearchMapping(criterionId)] = $(event.currentTarget).val();
//				console.log("search criterion set");
//				console.log(openSearchCriterion);
//				self.model.set(openSearchCriterion);
//			}else {
//				console.log(" not ui-radio-off");
//			}
		}
		
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
