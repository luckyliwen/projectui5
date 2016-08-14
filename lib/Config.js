sap.ui.define([], function() {
	"use strict";

	//some basic configure, so HR can change it
	var mCfg = {
		// AttachmentLoaderUrl: "https://projectodatap1941885273trial.hanatrial.ondemand.com/projectodata/Attachment", 
		// AttachmentLoaderUrl: "http://localhost:8731/projectMng/Attachment", 
		// As for cross-original issue, we need use the path defined in neo-app.json
		// AttachmentLoaderUrl: "https://projectmngp1941824928trial.hanatrial.ondemand.com/projectMng/Attachment", 
		AttachmentUrl:  "/attachmentUrl",

		// 
		// ZipDownloadUrl: "/uploadDownload/Download", 
		ZipDownloadUrl: "https://projectmngp1941824928trial.hanatrial.ondemand.com/projectMng/Download", 


		Ui5RootUrl: "https://projectui5-p1941824928trial.dispatcher.hanatrial.ondemand.com",

		EmailTemplateTips: 
			"Following special mark will be replace dynamically \r\n" +
			"${UserName} : Employee Name\r\n" +
			"${Title} : Project Title\r\n" +
			"${RejectReason} : Reject reason\r\n",

		DefaultEmailTemplateNoApprove: {
			EmailApproveSubject : "Congratulations, your registration ${Title} has been submitted successful",
			EmailApproveBody: "Hello ${UserName},\r\n" +
					"\tYour registration ${Title} has been submitted.",
			EmailSignature: "Best Regards,\r\nSAP Labs China"
		},

		DefaultEmailTemplateApprove: {
			EmailApproveSubject : "Congratulations, your registration ${Title} has been approved",
			EmailApproveBody: "Hello ${UserName},\r\n" +
					"\tYour registration ${Title} has been approved.",

			EmailRejectSubject : "Sorry, your registration ${Title} has been rejected",
			EmailRejectBody: "Hello ${UserName},\r\n" +
					"\tYour registration ${Title} has been reject because ${RejectReason}.\r\n" +
					"\tPlease correct and resubmit.",
			EmailSignature: "Best Regards,\r\nSAP Labs China"
		}
	};

	return {
		getModel: function( ) {
		    var oModel = new sap.ui.model.json.JSONModel();
        	oModel.setData( mCfg );
        	return oModel;
		},

		getConfigure: function() {
		    return mCfg;
		}
	};
});
