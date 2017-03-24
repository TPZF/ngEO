var Configuration = require('configuration');

/**
 * This module deals with the creation and submission of a generic data access request
 */
var DataAccessRequest = {

  id: "", //data access request id returned by the server 

  step: 0, //step is a counter of request steps. It is set to 0 when no request has been sent
  // it is set to 1 when a request has been sent

  requestStage: "",

  downloadLocation: {
    DownloadManagerId: "",
    DownloadDirectory: ""
  },

  createBulkOrder: false,

  firstRequest: {}, //keeps track of the first stage request in order to validate the second stage request 


  initialize: function() {

    this.step = 0;
    this.id = "";
    this.requestStage = Configuration.localConfig.dataAccessRequestStatuses.validationRequestStage;
    this.downloadLocation = {
      DownloadManagerId: "",
      DownloadDirectory: ""
    };

    this.resetRequest();
  },

  /** Submit the request to the server */
  submit: function() {

    //check that the request is valid before sending it to the server
    if (!this.isValid()) {
      return;
    }

    var self = this;

    return $.ajax({
      data: JSON.stringify(self.getRequest()),
      url: self.url,
      type: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {

        //console.log(" SUCCESS : Received Validation Response from the server :");
        //console.log(data);

        //check the server response status with the configured server response statuses  
        var statusesConfig = Configuration.localConfig.dataAccessRequestStatuses;
        var validStatusesConfig = statusesConfig.validStatuses;

        switch (data.dataAccessRequestStatus.status) {

          case validStatusesConfig.validatedStatus.value:

            //initial stage
            if (self.step == 0 && self.id == "" && self.requestStage == statusesConfig.validationRequestStage) {
              self.step = 1;
              self.id = data.dataAccessRequestStatus.ID;
              self.requestStage = statusesConfig.confirmationRequestStage;

              self.validationProcessing(data.dataAccessRequestStatus);

              self.trigger('SuccessValidationRequest', data.dataAccessRequestStatus.message, validStatusesConfig.validatedStatus.message);

            } else {
              self.trigger('FailureRequest');

            }
            break;

          case validStatusesConfig.bulkOrderStatus.value:

            if (self.step == 0 && self.requestStage == statusesConfig.validationRequestStage) {
              self.step = 1;
              self.id = data.dataAccessRequestStatus.ID;
              //Bulk order is considered add the createBulkOrder
              self.createBulkOrder = true;
              self.requestStage = statusesConfig.confirmationRequestStage;

              self.trigger('SuccessValidationRequest', data.dataAccessRequestStatus.message, validStatusesConfig.bulkOrderStatus.message);
            } else {
              self.trigger('FailureRequest');
            }

            break;

          case validStatusesConfig.pausedStatus.value:
          case validStatusesConfig.inProgressStatus.value:

            if (self.step == 1 /*&& self.id == data.dataAccessRequestStatus.ID*/ &&
              self.requestStage == statusesConfig.confirmationRequestStage) { //2 steps done
              self.trigger('SuccessConfirmationRequest', data.dataAccessRequestStatus.message, validStatusesConfig.inProgressStatus.message);
            } else {
              self.trigger('FailureRequest');
            }
            break;

            /*					 // FL : this status should never happen?
  											case validStatusesConfig.pausedStatus.value:
  												  self.serverResponse = validStatusesConfig.pausedStatus.message;
  												  self.trigger('FailureValidationRequest');
  												  break;
  												  
  											  case validStatusesConfig.cancelledStatus.value:
  												  self.serverResponse = validStatusesConfig.cancelledStatus.message;
  												  self.trigger('FailureValidationRequest');
  												  break;*/

          default:
            self.serverResponse = Configuration.localConfig.dataAccessRequestStatuses.unExpectedStatusError;
            self.trigger('FailureRequest');
            break;
        }

      },

      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status == 0) {
          location.reload();
        } else {
          console.log("ERROR when posting DAR :" + textStatus + ' ' + errorThrown);
          self.serverResponse = Configuration.localConfig.dataAccessRequestStatuses.requestSubmissionError;
          self.trigger('FailureRequest');
        }
      }
    });
  }

}

//add events method to object
_.extend(DataAccessRequest, Backbone.Events);

module.exports = DataAccessRequest;