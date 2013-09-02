define( ['jquery', 'backbone', 'configuration', 'account/view/createShopcartView', 
         'account/view/renameShopcartView', 'shopcart/widget/shopcartExportWidget', 
         'account/view/importShopcartView', 'text!account/template/shopcartManagerContent.html'], 
		function($, Backbone, Configuration, CreateShopcartView, RenameShopcartView, 
				ShopcartExportWidget, ImportShopcartView, shopcartManagerContent_template) {

var ShopcartManagerView = Backbone.View.extend({

	initialize : function(){
		this.model.on("sync" , this.render, this);
		this.model.on("error" , this.error, this);
	},
	
	events : {
		'click label' : function(event){
			//the default shopcart cannot be deleted
			if (this.model.defaultShopcartId != event.currentTarget.id){
				this.$el.find("#delete_shp").button('enable');
			}else{
				this.$el.find("#delete_shp").button('disable');
			}
			this.model.updateCurrentShopcart(event.currentTarget.id);
		},
		
		'click #new_shp' : function(event){

			var parentElement = $('<div id="actionPopup">');
			var element = $('<div id="actionPopupContent"></div>'); 
			element.appendTo(parentElement);
			parentElement.appendTo('.ui-page-active');
			parentElement.ngeowidget({
				title: "Create a new shopcart",
				hide: function() {
					//remove the root of the view to discart all listeners
					element.remove();
					parentElement.remove();
				}
			});
			
			var createShopcartView = new CreateShopcartView({
				model : this.model,
				el: element
			});
			
			createShopcartView.render();
			//Open the popup
			parentElement.ngeowidget("show");
		},
		
		'click #rename_shp' : function(event){
			
			var parentElement = $('<div id="actionPopup">');

			var element = $('<div id="actionPopupContent"></div>'); 
			element.appendTo(parentElement);
			parentElement.appendTo('.ui-page-active');
			parentElement.ngeowidget({
				title: "Rename the shopcart",
				hide: function() {
					element.remove();
					parentElement.remove();
				}
			});
			
			var renameShopcartView = new RenameShopcartView
			({
				model : this.model,
				el: element
			});
			renameShopcartView.render();
			
			//Open the popup
			parentElement.ngeowidget("show");
		},
		
		'click #import_shp' : function(event){
			
			var parentElement = $('<div id="actionPopup">');

			var element = $('<div id="actionPopupContent"></div>'); 
			element.appendTo(parentElement);
			parentElement.appendTo('.ui-page-active');
			parentElement.ngeowidget({
				title: "Import a shopcart",
				hide: function() {
					parentElement.remove();
				}
			});
			
			var importShopcartView = new ImportShopcartView({
				model : this.model,
				el: element
			});
			
			importShopcartView.render();
			
			//Open the popup
			parentElement.ngeowidget("show");
		}, 
		//called when the share button is clicked.
		'click #share_shp' : function(event){

			// Set the current shopcart shared url
			$("#sharedShopcartUrl").html( '<b>' + Configuration.serverHostName + (window.location.pathname) + this.model.getShopcartSharedURL() + '<b>');	
			$('#sharedShopcartUrlPopup').popup("open");
			$('#sharedShopcartUrlPopup').trigger('create');
		},
		
		'click #delete_shp' : function(event){
			var self = this;
			this.model.getCurrentShopcartConfig().destroy()
												.done(function (){
													//self.model.currentShopcartId = self.model.getPreviousShopcartId(); 
													self.model.currentShopcartId = self.model.defaultShopcartId;
													self.render();
												})
										
												.fail(function(xhr, textStatus, errorThrown){
													self.showMessage(errorThrown);
												});
		},
		//added export as in the shopcart item view
		'click #export_shp' : function(event){
				
			var shopcartExportWidget = new ShopcartExportWidget();
			shopcartExportWidget.open();
		}
	},
	
	render : function(){
		this.$el.empty();
		var mainContent = _.template(shopcartManagerContent_template, this.model);
		this.$el.append(mainContent);
		this.$el.trigger("create");
		var defaultShopcartSelect = "#" + this.model.currentShopcartId; 
		this.$el.find(defaultShopcartSelect).trigger("click");
		//disable the delete button if for the default shopcart		
		if (this.model.currentShopcartId == this.model.defaultShopcartId){
			this.$el.find("#delete_shp").button('disable');
		}
		return this;
	},
	
	/** display the error message if any */
	showMessage : function(message){
		if ( this.timeOut ) {
			clearTimeout( this.timeOut );
		}
		
		$("#errorMessageDiv")
			.empty()
			.append(message)
			.slideDown();
			
		// Hide status message after a given time
		this.timeOut = setTimeout( function() {
			$("#errorMessageDiv").slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
	},
	
	/**
	 * this is a callback method to display an error message when an error occurs during 
	 * shopcart list retrieving. 
	 */
	error : function(){
		this.$el.append("<div class='ui-error-message'><p><b> Failure: Error when loading the shopcart list.</p></b>"+ 
		"<p><b> Please check the interface with the server.</p></b></div>");
	}
	
});

return ShopcartManagerView;

});