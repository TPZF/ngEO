define( ['jquery', 'backbone', 'configuration', 'dataAccess/widget/DownloadManagersWidget', 
         'text!dataAccess/template/standingOrderViewContent.html'], 
		function($, Backbone, Configuration, DownloadManagersWidget,
				standingOrderView_template) {

	/**
	 * This view handles the displaying of standing orders request parameters.
	 * 
	 * The attribute request is the request to be submitted.
	 * 
	 */
	var StandingOrderView = Backbone.View.extend({
	
		initialize : function(options){
			this.request = options.request;
			this.parentWidget = options.parentWidget;
		},
		
		events : {
			
			'change #startDateSTO' : function(event){
				this.request.startDate = $(event.currentTarget).val();
			},
			
			'change #endDateSTO' : function(event){
				this.request.endDate = $(event.currentTarget).val();
			},		
			
			'click #timeDrivenLabel' : function(event){
				
				var $target = $(event.currentTarget);
				var isTimeDriven = !($(event.currentTarget).hasClass('ui-checkbox-on'));
				this.request.type = isTimeDriven;
				var timeDrivenElt = this.$el.find("#timeDrivenParams");
				
				if (isTimeDriven){
					timeDrivenElt.show();
				}else{
					timeDrivenElt.hide();
				}
			},
			
			'click #CreateSTORequest' : function(event){
				
				var self = this;	
				$.when(this.parentWidget.close()).done(function(){
					var downloadManagersWidget = new DownloadManagersWidget(self.request);
					downloadManagersWidget.open();				
				});			
			},
//			
//			'click label' : function(event){
//				var $target = $(event.currentTarget);
//				//look for class ui-radio-off because it is going to be changed to ui-radio-on at the end of the handler
//				if ($target.hasClass("ui-radio-off")){
//					this.selectedDownloadManager = event.currentTarget.id;
//					console.log("selected Download Manager :");
//					console.log(this.selectedDownloadManager);
//				}
//			}
		},
		
		render: function(){
			var content = _.template(standingOrderView_template, {startDate : this.request.startDate, endDate : this.request.endDate});
			this.$el.append(content);
			this.$el.find("#standingOrderSpecificMessage").append(this.request.getSpecificMessage());
			this.$el.find("#timeDrivenParams").hide();
			this.$el.find("#timeDrivenLabel").trigger('create');
			this.$el.find("#timeDrivenCheckBox").trigger('create');
			this.$el.trigger('create');
			this.delegateEvents();
			return this;
		}
		
	});
	
	return StandingOrderView;

});
