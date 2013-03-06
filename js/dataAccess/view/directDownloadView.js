define(
		[ 'jquery', 'backbone', 'configuration', "dataAccess/model/downloadManagers", 
		  "text!dataAccess/template/directDownloadWidgetContent.html"],
	
 function($, Backbone, Configuration, DownloadManagers, directDownload_Content) {
	

	var DirectDownloadView = Backbone.View.extend({

		initialize : function(options){
			this.url = options.url;
		},
		
		// Send a request to retreive the download helper URL
		requestHelperUrl: function() {
			var downloadHelperUrl = Configuration.baseServerUrl + "/downloadHelper" + "?productURI=" + encodeURIComponent(this.url + '.ngeo');
			$.ajax({
				url: downloadHelperUrl,
				type : 'GET',
				dataType: 'text',
				success: function(data) {
					$('#downloadHelperUrl').removeClass('ui-disabled');
					$('#downloadHelperUrl').attr('href',data);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					$("#directDownloadMessage").show();
					$("#directDownloadMessage").append('<p> It is not possible to use the download manager </p>');
					$("#directDownloadMessage").append('<p>' + textStatus + ' ' + errorThrown + '</p>');
				}
			});
		},
		
		// Render the view
		render : function() {
		
			if (DownloadManagers.attributes.downloadmanagers.length >= 1){
				this.$el.append(_.template(directDownload_Content, {url : this.url, downloadHelperUrl : true}));
				this.requestHelperUrl();
			}else{
				this.$el.append(_.template(directDownload_Content, {url : this.url, downloadHelperUrl : false}));
			}
			this.$el.trigger('create');
			
			return this;
		}
		
	});
	
	return DirectDownloadView;
	
});