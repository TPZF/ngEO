

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers', 'text!dataAccess/template/accountDownloadManagersContent.html'], 
		function($, Backbone, Configuration, DownloadManagers, downloadManagersMonitoring_template) {

var DownloadManagersMonitoringView = Backbone.View.extend({

	events :{		
		'click tbody tr' : function(event){
			$(event.currentTarget).toggleClass('dm_selected');
		}
	},
	
	render: function(){
	
		var content = _.template(downloadManagersMonitoring_template, this.model.attributes);
		this.$el.append(content);
		this.delegateEvents();
		this.$el.trigger('create');
		

//		console.log(selector);				
//		var self = this;
//		var dmConfig = Configuration.downloadManager;
//		
//		_.each(this.model.get("downloadmanagers"), function(dm, i){
//			
//			var selector = '"tr:eq(' + i +')"';
//			console.log(selector);
//			var row = self.$el.find(selector);	
//			console.log(row);
//			console.log(row.find("td:eq(0)"));
//			switch(dm.status) {
//				
//				case dmConfig.activeStatus :
//					
//					row.find("td:eq(0)").append('<span class="ui-icon-processing ui-icon">&nbsp;</span>');
//					break;
//				
//				case dmConfig.inActiveStatus :
//					row.find("td:eq(0)").append('<span class="ui-icon-cancelled ui-icon">&nbsp;</span>');
//					break;
//				
//				case dmConfig.stoppedStatus :
//					row.find("td:eq(0)").append('<span class="ui-icon-paused ui-icon">&nbsp;</span>');
//					break;
//					
//				//Unknown Status
//				 default :
//					row.find("td:eq(0)").append('<span class="ui-icon-unknown ui-icon">&nbsp;</span>');
//			  		break;
//			}
//		});
		
		return this;
	},	
});

return DownloadManagersMonitoringView;

});
