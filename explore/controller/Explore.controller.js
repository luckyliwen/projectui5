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
		if ( !this.checkProjectId()) {
			return;
		}

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
		this.userId = "";

		this.getProjectConfigure();

		this.oRegTable = this.byId('registrationTable');
		this.oStatisTable = this.byId('statisTable');

		this.aStatis = [];
		this.oStatisModel = new sap.ui.model.json.JSONModel();

		// Util.setTableColumnsFilterSortProperty(this.oRegTable);
	},

	getProjectConfigure: function(  ) {
	    var that = this;

		function onGetProjectCfgErrorSuccess(oData) {
			that.setBusy(false);
			if (oData.results.length >0) {
				that.projectCfg = oData.results[0];
	    		that.addProjectCfgExtraProperty();
				try {
					that.aFormCfg = JSON.parse( that.projectCfg.Form );
				} catch (e) {
					Util.showError("The project configure format error." + Enum.GeneralSolution);
					return;
				}
				that.createRegisterTable();
				that.createStatisTable();
				that.refreshStatisTable();

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
				that.userId = oData.UserId;
				if ( !that.bAdmin) {
					//if user is the author of project or inside the Administrator then also have the admin right 
					if (that.userId == that.projectCfg.Owner) {
						that.bAdmin = true;
					} else if (that.projectCfg.Administrator && that.projectCfg.Administrator.indexOf(that.userId) != -1) {
						that.bAdmin = true;
					}
				}
				that.adjustViewByRoleAndConfigure();
				that.tryLoadRegistration();
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

	createStatisTable: function( evt ) {
	    var bSubPrj = this.projectCfg.RegistrationLimit_Ext  === Enum.RegistrationLimit.SubProject;

	    //first is label, then property
	    var aCfg =[["Drafted Status","Drafted"], ["Submitted Status","Submitted"], ["Canceled Status", "Canceled"] ];
	    if (bSubPrj) {
	    	aCfg.unshift([ this.projectCfg.SubProjectTitle, 'SubProject']);
	    } 

	    //depend on whether need approve, add the Approved/Rejected
	    if (this.projectCfg.NeedApprove) {
	    	aCfg.push(["Approved Status", "Approved"]);
	    	aCfg.push(["Rejected Status", "Rejected"]);
	    } else {
	    	aCfg.push(["Waiting Status", "Waiting"]);
	    }

	    for (var i=0; i < aCfg.length; i++) {
	    	var  cfg = aCfg[i];
		    var label = new sap.m.Label({text:cfg[0]});
			var path = "{" + cfg[1] + "}";
		/*	var template =  new sap.m.Text({
						text: path,  maxLines:1, 
			});*/
			var template =  new sap.m.Label({
						text: path,  
						design: {
							path: "summary",
							formatter: function( value ) {
							    if (value) {
							    	return "Bold";
							    } else {
							    	return "Standard";
							    }
							}
						}
			});


			var col = new sap.ui.table.Column({
				label:  label,
				template: template,
				sortProperty: cfg[1],
				filterProperty:  cfg[1]
			});
			this.oStatisTable.addColumn( col );
		}

		this.oStatisTable.setModel( this.oStatisModel);
	},
	
	mergeStatisAndFreshTable:function( aResults) {
	    var bSubPrj = this.projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject;
	    this.aStatis = [];
	    var i, m, result;
	    if (!bSubPrj) {
	    	m = {};
	    	for ( i=0; i < aResults.length; i++) {
	    		result = aResults[i];  
	    		//like  Status: 'Submitted', Count: 1
	    		m[ result.Status ] = result.Count;
	    	}
	    	this.aStatis.push(m);
	    } else {
	    	//by the SubProject to know belong to which row 
	    	var mSubPrjIndex = {};
	    	var mSum = { SubProject: "Summary", summary: true};

	    	for ( i=0; i < aResults.length; i++) {
	    		result = aResults[i];  
	    		//like  SubProject 'aa' Status: 'Submitted', Count: 1
	    		var subPrj = result.SubProject;
	    		if ( subPrj in mSubPrjIndex) {
	    			m = this.aStatis[ mSubPrjIndex[subPrj] ];
	    		} else {
	    			//first time, then append to it 
	    			m = { "SubProject": subPrj};
	    			this.aStatis.push(m);
	    			mSubPrjIndex[ subPrj ] = this.aStatis.length-1;
	    		}
	    		m[ result.Status ] = result.Count;

				//need add to sum also 
				if ( result.Status in mSum) {
					mSum[ result.Status ] += result.Count;
				} else {
					mSum[ result.Status ] = result.Count;
				}
	    	}
	    	//last entry is the sum 
	    	this.aStatis.push( mSum);
	    }

	    this.oStatisModel.setData( this.aStatis);
	    this.oStatisTable.setVisibleRowCount( this.aStatis.length);
	},
	

	refreshStatisTable: function( evt ) {
	    var that = this;
		function onGetStatisSuccess(oData) {
			that.setBusy(false);
			var aResult = JSON.parse(oData.GetStatusStatistics);
			that.mergeStatisAndFreshTable( aResult );
		}

		function onGetStatisError(error) {
			that.setBusy(false);
			Util.showError("Failed to get statistics information.", error);
		}

		var url = "/GetStatusStatistics";
		var bSubPrj = this.projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject ? 'true' : 'false';
	    this.oDataModel.callFunction(url, {
	    	urlParameters: { 'ProjectId': this.projectId, 'SubProject': bSubPrj},
			method: "GET",
			success: onGetStatisSuccess,
			error: onGetStatisError
		});

	    this.setBusy(true);
	},
	

	createRegisterTable: function() {
	    //label: '', tooltip: '', property: '' mandatory: true, type: [input, date, list,attachment], candidate: ['male', 'famel'] 
		//the UserId, SapUserName always need add , just add two cfg to the global aFromCfg
		this.aFormCfg.unshift({property: 'Status', label: 'Status', tooltip: "Status"});
		this.aFormCfg.unshift({property: 'SapUserName', label: 'SAP user name', tooltip: "SAP User name get from system", notVisible: true});
		this.aFormCfg.unshift({property: 'UserId', label: 'SAP user ID', tooltip: "SAP User ID get from system"});
		this.aFormCfg.unshift({property: 'SubmittedTime', label: 'Submitted Time', tooltip: "Submitted Time"});

		var subPrjCfg = this.getSubProjectFormCfg(this.projectCfg);
		if (subPrjCfg) {
			this.aFormCfg.unshift(subPrjCfg);
		}
		
		// if support multiple entry, then add that so can easy know who create multiple entry
		if ( this.projectCfg.MultipleEntry) {
			this.aFormCfg.unshift({property: 'EntriesCount', label: 'Entries Count', 
				tooltip: "How many items for one employee, for example register 2 activity for 2 children"});
		}

		for (var i=0; i < this.aFormCfg.length; i++) {
			var  cfg = this.aFormCfg[i];
			if ( cfg.property == "Agreement"){
				continue;
			}
			
			var label = new sap.m.Label({text:cfg.label});
			if (cfg.tooltip) {
				label.setTooltip( cfg.tooltip);
			} 

			var path = "{" + cfg.property + "}";

			var template;
			if (cfg.type != Enum.ControlType.Attachment) {
				if ( cfg.property == "SubmittedTime") {
					template =  new sap.m.Text(
						{ text: { path: cfg.property, formatter: Util.fmtTime}, maxLines:1 });
				} else {
					template =  new sap.m.Text({
						text: path,  maxLines:1, 
						tooltip: {
							path: cfg.property,  
							formatter:  Util.fmtString
						}
					});
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

			if (cfg.notVisible) {
				col.setVisible(false);
			}

			this.oRegTable.addColumn( col );
		}

	},
	
	onRefreshButtonpressed: function( evt ) {
		var source = evt.getSource();
		if ( source.getId().indexOf("refreshStatisTable") != -1) {
			this.refreshStatisTable();
		} else {
		    this.refreshRegisterTable();
		}
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
	
	getMyRegistration: function(  ) {
	    var that = this;

		function onGetMyRegistrationSuccess(oData) {
			that.setBusy(false);
			if (oData.results.length >0) {
				that.refreshRegisterTable();
			} else {
				Util.info("The registration is protected, only all the registers can see it!");
				return;
			}
		}

		function onGetMyRegistrationError(error) {
			that.setBusy(false);
			Util.showError("Failed to get your registration." + Enum.GeneralSolution, error);
		}

	    this.oDataModel.read("/Registrations", {
	    	filters: [	new sap.ui.model.Filter("ProjectId", 'EQ', this.projectId),
	    			new sap.ui.model.Filter("UserId", 'EQ', this.userId)
	    		],
			success: onGetMyRegistrationSuccess,
			error: onGetMyRegistrationError
		});

		this.setBusy(true);
	},

	tryLoadRegistration: function() {
		if ( !this.bAdmin ) {
			if ( this.projectCfg.RegistrationSecurity == Enum.RegistrationSecurity.Public) {
				this.refreshRegisterTable();		
			} if ( this.projectCfg.RegistrationSecurity == Enum.RegistrationSecurity.Protected) {
				//then need check whether he has the registration information or not 
				this.getMyRegistration();
			} else if (this.projectCfg.RegistrationSecurity == Enum.RegistrationSecurity.Private) {
				Util.info("The registration information is private, only administrator can see it.");
				return;
			}
		} else {
			this.refreshRegisterTable();	
		}
	},
	
	adjustViewByRoleAndConfigure: function( ) {
	    //!! need check whether he has the admin role or belong to the administrator group
	    if (this.bAdmin) {
	    	this.byId("deleteBtn").setVisible(true);
	    	if ( this.projectCfg.NeedApprove) {
	    		this.byId("approveBtn").setVisible(true);
	    		this.byId("rejectBtn").setVisible(true);
	    	} else {
	    		this.byId("promoteBtn").setVisible(true);
	    	}

	    	//check if have one form is attachment  
	    	if (this.aFormCfg && this.aFormCfg.length){
	    		var bHasAttachment = false;
	    		for (var i=0; i < this.aFormCfg.length; i++) {
	    			if ( this.aFormCfg[i].type == Enum.ControlType.Attachment) {
	    				bHasAttachment = true;
	    				break;
	    			}
	    		}
	    		this.byId("downloadBtn").setVisible(bHasAttachment);
	    	}
	    } 

	    
	},
	
	
	onRegistrationTableRowSelectChanged: function(  ) {
	    //only the Approved can donate
	    var selIdx = this.oRegTable.getSelectedIndices();
	    var bAllSubmited = false;
	    var bAllWaiting = true;
		for (var i=0; i < selIdx.length; i++) {
			var context = this.oRegTable.getContextByIndex( selIdx[i]);
			var status = context.getProperty("Status");
			if (status != Enum.Status.Submitted) {
				bAllSubmited = false;
				break;
			} else {
				bAllSubmited = true;
			}

			if ( status != Enum.Status.Waiting) {
				bAllWaiting = false;
			}
		}

		this.byId("approveBtn").setEnabled( bAllSubmited );
		this.byId("rejectBtn").setEnabled( bAllSubmited );
		this.byId("deleteBtn").setEnabled( selIdx.length > 0 );
	    this.byId("promoteBtn").setEnabled( selIdx.length > 0  && bAllWaiting);
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
			bApprove = id.indexOf("approve") != -1;
		    var bPromote =  id.indexOf("promote") != -1;
		    if (bApprove) {
		    	mData.Status = Enum.Status.Approved;
		    } else if ( bPromote) {
		    	mData.Status = Enum.Status.Submitted;
		    } else {
				this.openRejectDialog();
		    	return;
		    } 
		}

		function checkFinalResult() {
			if ( successItems + failedItems == totalItems) {
				that.getView().setBusy(false);
				that.refreshRegisterTable();
				that.rerefreshStatisTable();

				var action = mData.ActionFlag;
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
	    if ( mData.Status == Enum.Status.Approved) {
	    	mData.ActionFlag = Enum.ActionFlag.Approve;	
	    } else if ( mData.Status == Enum.Status.Submitted) {
	    	mData.ActionFlag = Enum.ActionFlag.Promote;	
	    } else {
	    	mData.ActionFlag = Enum.ActionFlag.Reject;	
	    }

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
				that.refreshStatisTable();
				
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
	
	onDownloadPressed: function( evt ) {
	    	/*As we need pass a lot of parameter, so we need use Json as format
	 * FileName: zip file name
	 * MultipleEntry: true/false  if false then we can directly use userid as the file prefix 
	 * AttachmentCountPerUser:   if 1 then no need extra for the identify different file one user
	 * ProjectId:  as all share same project id, so we can just pass once
	 * Attachments: [
	 *     {UserId: '', entryId, Type: '' }  (Type if more than one, then separate it by ;   
	 * ]
	 * How to define the file name for one attachment:
	 *    1:  UserId +
	 *    2:  If MultipleEntry = false,  then no need the entryId. Otherwise, add the entryId (as we don't know it is what part)
	 *    3:  If AttachmentCountPerUser =1, then no need add the type, otherwise just get the last part(0~4) of the type
	 *    4:  last is the mine
	 */
		var mParam = {
			"FileName": "1~10.zip", "MultipleEntry":"true", "AttachmentCountPerUser":"1", "ProjectId": "1",
			Attachments: [
				{UserId: 'I068108', EntryId:"1",Type:'FileName0'},
				{UserId: 'I068109', EntryId:"2",Type:'FileName0'},
			]
		};

// {"FileName": "1~10.zip", "MultipleEntry":"true", "AttachmentCountPerUser":"1", "ProjectId": "1",
// "[{"UserId":"I068108","EntryId":"1","Type":"FileName0"},{"UserId":"I068109","EntryId":"2","Type":"FileName0"}]"

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
	    Util.exportTableContent(table, "Registration.csv", this.projectId);
	},

	
});
	//global data 
	// mRegister:  //the register information
	//oFooterBar	
	//oSubmitBtn, oCancelBtn, oSaveBtn
	//oUploaderId, oUploaderPhoto, oUploaderForm
	return ControllerController;
});