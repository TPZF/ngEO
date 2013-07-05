define( ['jquery', 'backbone', 'configuration', 'account/view/createShopcartView', 'account/view/importShopcartView','account/widget/actionWidget', 'text!account/template/shopcartManagerContent.html'], 
			function($, Backbone, Configuration, CreateShopcartView, ImportShopcartView, ActionWidget, shopcartManagerContent_template) {

var ShopcartManagerView = Backbone.View.extend({

	initialize : function(){
		this.popupElement = $('<div id="actionPopupContent"></div>');
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
			
			//FIXME TODO Emna
//			var parentElement = $('<div id="actionPopup">');
//			var element = $('<div id="actionPopupContent"></div>');
//			
//			var createShopcartView = new CreateShopcartView({
//				model : this.model,
//				el: element
//			});
//			
//			parentElement.appendTo('.ui-page-active');
//			parentElement.ngeowidget({
//				
//				title: "Create a new shopcart",
//				
//				hide: function() {
//					parentElement.remove();
//				}
//			});
//			createShopcartView.render();
//			parentElement.ngeowidget('show');
			
			var createShopcartView = new CreateShopcartView({
				model : this.model,
				el: this.popupElement
			});
			var actionWidget = new ActionWidget("Import a new shopcart", createShopcartView);
			actionWidget.open();
		},
		
		'click #import_shp' : function(event){
			var importShopcartView = new ImportShopcartView({
				model : this.model,
				el: this.popupElement
			});
			var actionWidget = new ActionWidget("Import a new shopcart", importShopcartView);
			actionWidget.open();
		}
	},
	
	render : function(){
		this.$el.empty();
		var mainContent = _.template(shopcartManagerContent_template, this.model);
		this.$el.append(mainContent);
		this.$el.trigger("create");
		var defaultShopcartSelect = "#" + this.model.currentShopcartId; 
		this.$el.find(defaultShopcartSelect).trigger("click");
		this.$el.find("#delete_shp").button('disable');

		return this;
	},
	
	/**
	 * this is a callback method to display an error message when an error occurs during 
	 * shopcart list retrieving. 
	 */
	error : function(){
		this.$el.empty();
		this.$el.append("<div class='ui-error-message'><p><b> Failure: Error when loading the shopcart list.</p></b>"+ 
		"<p><b> Please check the interface with the server.</p></b></div>");
	}
	
});

return ShopcartManagerView;

});