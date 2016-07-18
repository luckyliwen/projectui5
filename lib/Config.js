sap.ui.define([], function() {
	"use strict";

	//some basic configure, so HR can change it
	var mCfg = {
		// AttachmentLoaderUrl: "https://projectodatap1941885273trial.hanatrial.ondemand.com/projectodata/Attachment", 
		// AttachmentLoaderUrl: "/uploadDownload/Attachment", 
		AttachmentLoaderUrl: "https://projectmngp1941824928trial.hanatrial.ondemand.com/projectMng/Attachment", 

		//??later need check why here use the same location not work
		// RelativeAttachmentLoaderUrl: "https://flpportal-p1941885273trial.dispatcher.hanatrial.ondemand.com/sap/fiori/csr/uploadDownload/Attachment",
		RelativeAttachmentLoaderUrl: "https://projectmngp1941824928trial.hanatrial.ondemand.com/projectMng/Attachment", 

		// FormDownloadUrl: "https://projectodatap1941885273trial.hanatrial.ondemand.com/projectodata/MarathonFom.zip",
		// FormDownloadUrl: "http://localhost:8524/projectodata/Runner_Form.pdf",
		// FormDownloadUrl: "http://localhost:8524/projectodata/MarathonFom.zip",
		// 
		// ZipDownloadUrl: "/uploadDownload/Download", 
		ZipDownloadUrl: "https://projectmngp1941824928trial.hanatrial.ondemand.com/projectMng/Download", 


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
