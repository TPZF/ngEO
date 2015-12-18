/**
 * Download managers model 
 * The DownloadManagers is a singleton to be used for DAR and Download managers 
 * assignment and monitoring 
 */

var Configuration = require('configuration');
var SearchResults = require('logger');
var Logger = require('dataAccess/model/dataAccessRequest');

var DownloadManagers = Backbone.Model.extend({

	defaults: {
		downloadmanagers: []
	},

	initialize: function() {
		// The base url to retreive the download managers list
		this.url = Configuration.baseServerUrl + '/downloadManagers';
		this.listenTo(this, "error", this.onError);
	},

	/**
	 * Call when the model cannot be fetched from the server
	 */
	onError: function(model, response) {
		if (response.status == 0) {
			location.reload();
		}
	},

	/**
	 * Get a download manager user friendly name given its id
	 */
	getDownloadManagerName: function(id) {
		var dm = _.findWhere(this.get("downloadmanagers"), {
			downloadManagerId: id
		});
		return dm ? dm.downloadManagerFriendlyName : id;
	},

	/**
	 * Get a download manager status given its id
	 */
	getDownloadManagerStatus: function(id) {
		var dm = _.findWhere(this.get("downloadmanagers"), {
			downloadManagerId: id
		});
		return dm ? dm.status : null;
	},

	/** 
	 * Submit the DM change status request to the server.
	 */
	requestChangeStatus: function(dmID, newStatus) {

		var dm = _.findWhere(this.get("downloadmanagers"), {
			downloadManagerId: dmID
		});
		if (!dm)
			return;

		var self = this;
		var dmChangeStatusURL = self.url + '/' + dmID + '/changeStatus?new_status=' + newStatus;
		var prevStatus = dm.status;

		return $.ajax({
				url: dmChangeStatusURL,
				type: 'GET',
				dataType: 'json'
			})
			.done(function(data) {
				dm.status = data.status;
				self.trigger("status:change");
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.status == 0) {
					location.reload();
				} else {
					Logger.error("Cannot change downloand manager status request :" + textStatus + ' ' + errorThrown);
					// restore previous status
					dm.status = prevStatus;
				}
			});
	}

});

module.exports = new DownloadManagers();