define(
		[ 'jquery', 'backbone', 'configuration', "dataAccess/model/downloadManagers", 
		  "text!dataAccess/template/directDownloadWidgetContent.html"],
	
 function($, Backbone, Configuration, DownloadManagers, directDownload_Content) {
	

	var DirectDownloadView = Backbone.View.extend({

		initialize : function(options){
			this.url = options.url;
		},
		
		events : {
		
		},
		
		render : function() {
		
			if (DownloadManagers.attributes.downloadmanagers.length >= 1){
				console.log(this.url);
				var downloadHelperUrl = Configuration.data.downloadHelperService.url + "?productURI=" + this.url + '.ngeo';
				this.$el.append(_.template(directDownload_Content, {url : this.url, downloadHelperUrl : downloadHelperUrl}));

			}else{
				this.$el.append(_.template(directDownload_Content, {url : this.url}));
			}
			
			this.delegateEvents();
			//TODO not working jqm styling!
			$("#downloadChoiceList").trigger('create');
			return this;
		}
		
	});
	
	return DirectDownloadView;
	
});