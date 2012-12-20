define(
		[ 'jquery', 'backbone', 'configuration', "dataAccess/model/downloadManagers", 
		  "text!dataAccess/template/directDownloadWidgetContent.html"],
	
 function($, Backbone, Configuration, DownloadManagers, directDownload_Content) {
	

	var DirectDownloadView = Backbone.View.extend({

		initialize : function(options){
			this.url = options.url;
			this.downloadHelperUrl = Configuration.baseServerUrl + "/downloadHelper" + "?productURI=" + this.url + '.ngeo';
		},
		
		events : {
			
			'click #downloadHelperUrl' : function(event){
				
				var self = this;
				
				return $.ajax({
					  url: self.downloadHelperUrl,
					  type : 'GET',
					  dataType: 'text',
					  success: function(data) {
						  console.log (data);
						  $("#directDownloadMessage").empty();
						  $("#directDownloadMessage").append('<p>  Click on the following button to start download : </p>');
						  //$("#directDownloadMessage").append('<a id="download" data-rel="' + data + '" class="ui-link-inherit">Download</a>');
						  
						  $("#directDownloadMessage").append('<a data-mini="true" data-inline="true" data-theme="a" ' +
								  'data-role="button" href="' + data + '" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span"'+
								  ' class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-a"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Download</span></span></a>');		
					  },
					  
					  error: function(jqXHR, textStatus, errorThrown) {
						  $("#directDownloadMessage").empty();
						  $("#directDownloadMessage").append('<p> It is not possible to use the download manager </p>');
						  $("#directDownloadMessage").append('<p>' + textStatus + ' ' + errorThrown + '</p>');
					  }
				});		
			}
		},
		
		render : function() {
		
			if (DownloadManagers.attributes.downloadmanagers.length >= 1){
				//console.log(this.url);
				this.$el.append(_.template(directDownload_Content, {url : this.url, downloadHelperUrl : this.downloadHelperUrl}));

			}else{
				this.$el.append(_.template(directDownload_Content, {url : this.url, downloadHelperUrl : undefined}));
			}
			this.$el.trigger('create');
			
			return this;
		}
		
	});
	
	return DirectDownloadView;
	
});