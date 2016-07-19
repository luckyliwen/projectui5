var gc;
sap.ui.define([
	"csr/lib/BaseController",
	"csr/lib/Enum",
	"csr/lib/Config",
	"csr/lib/Util",
	'sap/ui/model/json/JSONModel',
], function(BaseController, Enum, Config, Util,JSONModel) {
	"use strict";

var ControllerController = BaseController.extend("csr.explore.controller.Explore", {
	onInit:function() {
		BaseController.prototype.onInit.call(this);

		jQuery.sap.require("sap.ui.table.Table");
		jQuery.sap.require("sap.ui.table.Column");
		//??
		gc = this; 
		this.oDataModel = this.getModel();
		this.oDataModel.setUseBatch(false);
		//default is 100 then dowload have issue
		this.oDataModel.setSizeLimit(1000);

		//global variables
		this.projectCfg = null;
		this.bAdmin = false;

		this.getProjectConfigure();

		this.oRegTable = this.byId('registrationTable');
		// Util.setTableColumnsFilterSortProperty(this.oRegTable);
	},

	getProjectConfigure: function(  ) {
	    var that = this;

		function onGetProjectCfgErrorSuccess(oData) {
			that.setBusy(false);
			if (oData.results.length >0) {
				that.projectCfg = oData.results[0];

				try {
					that.aFormCfg = JSON.parse( that.projectCfg.Form );
				} catch (e) {
					Util.showError("The project configure format error." + Enum.GeneralSolution);
					return;
				}
				that.createRegisterTable();
				that.getUserInfo();
			} else {
				Util.info("Not get correct project configuration." + Enum.GeneralSolution);
				return;
			}
			
		}

		function onGetProjectCfgError(error) {
			that.setBusy(false);
			Util.showError("Failed to get the configuration." + Enum.GeneralSolution, error);
		}

		
	    this.oDataModel.read("/Projects", {
	    	filters: [new sap.ui.model.Filter("ProjectId", 'EQ', this.projectId)],
			success: onGetProjectCfgErrorSuccess,
			error: onGetProjectCfgError
		});

		this.setBusy(true);
	},

	getUserInfo: function(  ) {
		var that = this;

		function onGetUserInfoSuccess( oData) {
			if (oData) {
				that.bAdmin = oData.Admin;
				that.adjustViewByRoleAndConfigure();
			}
		}
		
	    function onGetUserInfoError(error) {
			Util.showError("Failed to call GetUserInfo." + Enum.GeneralSolution, error);
		}

	    this.oDataModel.callFunction("/GetUserInfo", {
			method: "GET",
			success: onGetUserInfoSuccess,
			error: onGetUserInfoError
		});

	},

	onAttachmentLinkPressed: function( evt ) {
		var link = evt.getSource();
		var binding = link.getBinding('text');
		var property = binding.getPath();
		//from the property can get the cfg path 
		// var label ;
		// for (var i=0; i < this.aFormCfg.length; i++) {
		// 	if (property == this.aFormCfg[i].property) {
		// 		label = this.aFormCfg[i].label;
		// 		break;
		// 	}
		// }

		var type = property;
		var data = link.getBindingContext().getProperty();

	    var url = Util.getAttachmentUploaderUrl( data.UserId, data.ProjectId,
				data.RegisterId,   type);
	    window.open(url);
	},

	createRegisterTable: function() {
	    //label: '', tooltip: '', property: '' mandatory: true, type: [input, date, list,attachment], candidate: ['male', 'famel'] 
		//the UserId, SapUserName always need add , just add two cfg to the global aFromCfg
		this.aFormCfg.unshift({property: 'Status', label: 'Status', tooltip: "Status"});
		this.aFormCfg.unshift({property: 'SapUserName', label: 'SAP user name', tooltip: "SAP User name get from system"});
		this.aFormCfg.unshift({property: 'UserId', label: 'SAP user ID', tooltip: "SAP User ID get from system"});
		this.aFormCfg.unshift({property: 'SubmittedTime', label: 'Submitted Time', tooltip: "Submitted Time"});
		

		//if support multiple entry, then add that so can easy know who create multiple entry
		if ( this.projectCfg.MultipleEntry) {
			this.aFormCfg.unshift({property: 'EntriesCount', label: 'Entries Count', 
				tooltip: "How many items for one employee, for example register 2 activity for 2 children"});
		}

		for (var i=0; i < this.aFormCfg.length; i++) {
			var  cfg = this.aFormCfg[i];
			var label = new sap.m.Label({text:cfg.label});
			if (cfg.tooltip) {
				label.setTooltip( cfg.tooltip);
			} 

			var path = "{" + cfg.property + "}";

			var template;
			if (cfg.type != Enum.ControlType.Attachment) {
				if ( cfg.property == "SubmittedTime") {
					template =  new sap.m.Text(
						{ text: { path: cfg.property, formatter: Util.fmtTime} });
				} else {
					template =  new sap.m.Text({text: path });
				}
			} else {
				template = new sap.m.Link({
					text: path,  
					press: [this.onAttachmentLinkPressed, this]
				});
			}

			var col = new sap.ui.table.Column({
				label:  label,
				template: template,
				sortProperty: cfg.property,
				filterProperty:  cfg.property
			});

			this.oRegTable.addColumn( col );
		}

		this.refreshRegisterTable();
	},
	
	onRefreshButtonpressed: function( evt ) {
	    this.refreshRegisterTable();
	},

	onRegTableDataReceived: function( evt ) {
		var count = evt.getParameter('data');
		count = count.__count;
	    this.byId('regTableText').setText("Total " + count + " registrations");
	},
	
	refreshRegisterTable: function( evt ) {
	    this.oRegTable.bindRows({
				path: "/Registrations",
				// sorter: [new sap.ui.model.Sorter("Status")],
				filters: [new sap.ui.model.Filter("ProjectId", 'EQ', this.projectId)],
				events: {
					dataReceived: this.onRegTableDataReceived.bind(this)
				}
		});

		this.onRegistrationTableRowSelectChanged();
	},
	
	
	adjustViewByRoleAndConfigure: function( ) {
	    if (this.bAdmin) {
	    	this.byId("deleteBtn").setVisible(true);
	    	if ( this.projectCfg.NeedAprrove) {
	    		this.byId("approveBtn").setVisible(true);
	    		this.byId("rejectBtn").setVisible(true);
	    	}  
	    } 
	},
	
	
	onRegistrationTableRowSelectChanged: function(  ) {
	    //only the Approved can donate
	    var selIdx = this.oRegTable.getSelectedIndices();
	    var bAllSubmited = false;
		for (var i=0; i < selIdx.length; i++) {
			var context = this.oRegTable.getContextByIndex( selIdx[i]);
			var status = context.getProperty("Status");
			if (status != "Submitted") {
				bAllSubmited = false;
				break;
			} else {
				bAllSubmited = true;
			}
		}
		this.byId("approveBtn").setEnabled( bAllSubmited );
		this.byId("rejectBtn").setEnabled( bAllSubmited );
		this.byId("deleteBtn").setEnabled( selIdx.length > 0 );
	    this.byId("emailBtn").setEnabled( selIdx.length > 0 );
	},

	openRejectDialog: function( fnCallback ) {
	    if (!this.oRejectDialog) {
			this.oRejectDialog = sap.ui.xmlfragment(this.getView().getId(), "csr.explore.view.RejectDialog", this);
		}
		this.oRejectDialog.open();
	},
	
	onDialogCancelPressed: function( evt ) {
	    this.oRejectDialog.close();
	},
	
	onDialogRejectPressed: function( evt ) {
	    this.oRejectDialog.close();
	    var reason = this.byId("reasonTextArea").getValue().trim();
	    this.onApproveRejectPressed(null, reason);
	},
	
	onDialogClearPressed: function() {
	    this.byId("reasonTextArea").setValue("");
	},

	onRejectReasonChanged: function() {
	    var reason = this.byId("reasonTextArea").getValue().trim();
	    this.byId("rejectDialogBtn").setEnabled( !! reason);
	},

	//now it support multiple approve/reject
	onApproveRejectPressed: function( oEvent, reason) {
		var mData = {};
		var that = this;
		var bApprove;
		var totalItems, successItems=0, failedItems=0;

		if (reason) {
			mData.Status = Enum.Status.Rejected;
	    	mData.RejectReason = reason;
	    	bApprove = false;
		} else {
			var id = oEvent.getSource().getId();
			bApprove = (id.indexOf("approve") != -1);
		    if (bApprove) {
		    	mData.Status = Enum.Status.Approved;
		    } else {
				this.openRejectDialog();
		    	return;
		    } 
		}

		function checkFinalResult() {
			if ( successItems + failedItems == totalItems) {
				that.getView().setBusy(false);
				that.refreshRegisterTable();

				var action = bApprove ? "Approve" : "Reject";
				if ( failedItems ==0) {
	        		Util.showToast(action + " successful!");
				} else {
					Util.showError(action + " failed: " + successItems + " success, " + failedItems + " failed");
				}
			}
		}

	    function onApproveRejectSuccess() {
	    	successItems ++;
	    	checkFinalResult();
	    }
	    
	    function onApproveRejectError(error) {
	    	failedItems ++;
	    	checkFinalResult();
	    }

	    //need get all selected items
		var selIdx = this.oRegTable.getSelectedIndices();
	    totalItems = selIdx.length;
	    for (var i=0; i < selIdx.length; i++) {
			var context = this.oRegTable.getContextByIndex( selIdx[i]);
			var url = context.getPath();

			this.oDataModel.update(url, mData, {
	    		success: onApproveRejectSuccess, 
	    		error:   onApproveRejectError,
	    	});
		}

	    this.getView().setBusy(true);
	},	

	
	onDeletePressed: function( evt ) {
		var selIdx = this.oRegTable.getSelectedIndices();
		if (selIdx.length ==0) {
			Util.info("Please first select some row then delete.");
			return;
		}

		var bConfirm = confirm("Are you sure to delete the selected entries ?");
   		if (!bConfirm)
   			return;
   		var that = this;
	    var totalItems, successItems=0, failedItems=0;
	    function checkFinalResult() {
			if ( successItems + failedItems == totalItems) {
				that.getView().setBusy(false);
				that.refreshRegisterTable();
				
				if ( failedItems ==0) {
	        		Util.showToast("Delete successful!");
				} else {
					Util.showError("Delete failed: " + successItems + " success, " + failedItems + " failed");
				}
			}
		}

	    function onDelSuccess() {
	    	successItems ++;
	    	checkFinalResult();
	    }
	    
	    function onDelError(error) {
	    	failedItems ++;
	    	checkFinalResult();
	    }

	    totalItems = selIdx.length;
		for (var i=0; i < selIdx.length; i++) {
			var context = this.oRegTable.getContextByIndex( selIdx[i]);
			var url = context.getPath();
			this.oDataModel.remove(url, {
	    		success: onDelSuccess, 
	    		error:   onDelError,
	    	});
		}

		this.setBusy(true);
	},
	

	onSendEmailPressed : function( evt ) {
		if (!this.oSendEmailDialog) {
			this.oSendEmailDialog = sap.ui.xmlfragment(this.getView().getId(), "csr.explore.view.SendEmailDialog", this);
		}

		var selIdx = this.oRegTable.getSelectedIndices();
		var url="";
		for (var i=0; i < selIdx.length; i++) {
			var context = this.oRegTable.getContextByIndex( selIdx[i]);
			var email = context.getProperty("Email");
			
			//as now some email is same, so need check 
			if ( url.indexOf(email) == -1) {
				if(i>0) {
					url+=";" ;
				}
				url += email;
			}
		}

		this.byId("emailAddress").setValue(url);
		this.oSendEmailDialog.open();

		var that = this;
		setTimeout(	function( evt ) {
		    that.byId("emailAddress").selectText(0,  url.length);
		}, 0);

	},

	onSendEmailClosePressed: function( evt ) {
	    this.oSendEmailDialog.close();
	},

	

	onTableExportPressed: function( evt ) {
		var table = this.byId("registrationTable");
	    Util.exportTableContent(table, "Registration.csv");
	},

	
});
	//global data 
	// mRegister:  //the register information
	//oFooterBar	
	//oSubmitBtn, oCancelBtn, oSaveBtn
	//oUploaderId, oUploaderPhoto, oUploaderForm
	return ControllerController;
});