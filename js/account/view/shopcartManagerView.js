define( ['jquery', 'backbone', 'configuration', 'account/view/createShopcartView', 'account/view/renameShopcartView','account/view/importShopcartView', 'text!account/template/shopcartManagerContent.html'], 
			function($, Backbone, Configuration, CreateShopcartView, RenameShopcartView, ImportShopcartView, shopcartManagerContent_template) {

var ShopcartManagerView = Backbone.View.extend({

	initialize : function(){
		this.model.on("sync" , this.render, this);
		this.model.on("error" , this.error, this);
	},
	
	events : {
		'click label' : function(event){
			this.model.currentShopcartId = event.currentTarget.id;
			//the default shopcart cannot be deleted
			if (this.model.defaultShopcartId != this.model.currentShopcartId){
				this.$el.find("#delete_shp").button('enable');
			}else{
				this.$el.find("#delete_shp").button('disable');
			}
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
		
		'click #delete_shp' : function(event){
			var self = this;
			this.model.getCurrentShopcartConfig().destroy()
												.done(function (){
													self.render();
												})
										
												.fail(function(xhr, textStatus, errorThrown){
													self.showMessage(errorThrown);
												});
		}	
	},
	
	render : function(){
		this.$el.empty();
		var mainContent = _.template(shopcartManagerContent_template, this.model);
		this.$el.append(mainContent);
		this.$el.trigger("create");
		var defaultShopcartSelect = "#" + this.model.currentShopcartId; 
		this.$el.find(defaultShopcartSelect).trigger("click");
		//disable the delete button if for the deafult shopcart
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