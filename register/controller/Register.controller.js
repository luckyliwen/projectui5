var gf,gc,gm, gsel;
sap.ui.define([
	"csr/lib/BaseController",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/model/json/JSONModel",
	"csr/lib/Enum",
	"csr/lib/Config",
	"csr/lib/Util",
	"csr/lib/FileUploaderExt"
], function(BaseController,SimpleForm, JSONModel, Enum, Config, Util,FileUploaderExt) {
	"use strict";

var ControllerController = BaseController.extend("csr.register.controller.Register", {
	onInit:function() {
		BaseController.prototype.onInit.call(this);
		this.checkProjectId();
		
		gc = this; 

		this.oDataModel = this.getModel('odata');
		this.oDataModel.setUseBatch(false);

		this.oFooterBar = this.byId('footerBar');

		//for the register form data
		this.mRegister = {};
		this.aRegister = []; //for select multiple enty 
		this.currentResigerIndex = -1; //for multiple entry, the index 
		this.bNeedUpdateRegistration = false;  //when create new entry, need udpate

		//project configure 
		this.aFormCfg = null;
		this.projectCfg = null;
		this.projectOpened = true; //overall project status, need considerate both Project/SubProject
		this.aSubProject = null;
		this.subProjectIndex = -1; //select which subproject
		this.getProjectConfigure();
		
		//all the file uploader, as we need do the attachment upload one by one
		this.aUploader = [];  
		this.oSubmitBtn = null; //fomr action button
		this.oSaveBtn = null;
		this.oCancelBtn = null;

		var oModel = new JSONModel();
    	// oModel.setData( this.mRegister );
    	oModel.setDefaultBindingMode("TwoWay");
    	this.oModel = oModel;
    	this.setModel(oModel);

    	this.oEntryModel = new JSONModel();

    	//the pending update attachments
    	this.mPendingUpdateAttachment = null;
	},

	getProjectConfigure: function(  ) {
	    var that = this;

		function onGetProjectCfgSuccess(oData) {
			that.setBusy(false);
			if (oData.results.length >0) {
				that.projectCfg = oData.results[0];

				//here  just set projectOpened by overall status 
	    		that.addProjectCfgExtraProperty();

				that.projectOpened = (that.projectCfg.Status == Enum.ProjectStatus.Opened);
				if (that.projectOpened) {
					//first check whether all the sub-project has closed, if so, inform user now
					var allSubPrjClose  = true;
					if ( that.projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject) {
						for (var i=0; i < that.aSubProject.length; i++) {
							if ( that.aSubProject[i].status == Enum.ProjectStatus.Opened) {
								allSubPrjClose = false;
								break;
							}
						}
						if ( allSubPrjClose) {
							that.projectOpened = false;
						}
					}
				} 
				if ( !that.projectOpened) {
					that.byId("newEntryBtn").setEnabled(false);
					Util.info("Project has been closed, can't register any more!");
				}

				that.createRegisterScreen();

				//as it may be have multiple entry, the entry select dialog need the project information, so need wait to get the project
				that.getMyResistration();	
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
			success: onGetProjectCfgSuccess,
			error: onGetProjectCfgError
		});

		this.setBusy(true);
	},

	
	/**
	 * Create the Register Screen according to the designed project
	 * @param  {[type]} evt [description]
	 * @return {[type]}     [description]
	 */
	createRegisterScreen: function( evt ) {
	    var aFormCfg;
		try {
			aFormCfg = JSON.parse( this.projectCfg.Form );
		} catch (e) {
			Util.showError("The project configure format error." + Enum.GeneralSolution);
			return;
		}

		//add sub-project configure
		var subPrjCfg = this.getSubProjectFormCfg(this.projectCfg);
		if (subPrjCfg) {
			aFormCfg.unshift(subPrjCfg);
		}

		this.aFormCfg = aFormCfg;
		//check whether has the Agreement item, as it will not save to backend, just need user confirm
		for (var i=0; i < aFormCfg.length; i++) {
			if (aFormCfg[i].property == 'Agreement') {
				this.projectCfg.NeedAgreement_Ext = true;
				break;
			}
		}

		this.byId("switchEntryBtn").setVisible(this.projectCfg.MultipleEntry);
		this.byId("newEntryBtn").setVisible(this.projectCfg.MultipleEntry);

		if (this.projectCfg.DisplayProjectInfoAtTop) {
			var header = this.createProjectHeader(this.projectCfg);
			if ( header)
				this.byId("registerPage").addContent( header );
		} else {
			//!!just create a link at the top
		}

		var form  = this.createRegisterForm( aFormCfg);
		this.byId("registerPage").addContent( form);
	},
	

	updatePageTitle: function( status , reason) {
		var title;
		if (status == "Rejected") {
			title = "My Registration of [ {0} ]: status {1}, reason {2}";
			title = title.sapFormat(this.projectCfg.Title, this.mRegister.Status, this.mRegister.RejectReason);
		} else {
			title = "My Registration of [ {0} ]: status {1}";
			title = title.sapFormat(this.projectCfg.Title, this.mRegister.Status);
		}
		
		this.byId('registerPage').setTitle( title );
	},
	
	
	onGetInitialDataFinished: function() {
		this.createOrUpdateFooterButton();
		this.checkButtonStatus();
	},

	//called when user switch the selection or first time just one entry
	updateContentByMultipleEntrySelection: function() {
	    //just one, copy the data
	    if (this.currentResigerIndex != -1) {
			this.mRegister = this.aRegister[ this.currentResigerIndex ];
			//for the other status, end user must accept the license, but for the new version, need manually accept it
			if ( this.mRegister.Status != Enum.Status.New)
				this.mRegister.Agreement = true; 
		} else {
			//now when user create new entry it will come here
		}

		//!!for the Radio type, it need set the initial value for the  first item 
		for (var i=0; i < this.aFormCfg.length; i++) {
		 	if ( this.aFormCfg[i].type == Enum.ControlType.Radio) {
		 		var cfg = this.aFormCfg[i];
		 		var aList = cfg.candidate.split(";");
		 		this.mRegister[ cfg.property] = aList[0];
		 	}
		}

		this.oModel.setData( this.mRegister );
		this.updatePageTitle();
		this.createOrUpdateFooterButton();
		this.checkButtonStatus();
	},
	
	getMyResistration: function( forAutoUpdate ) {
		var that = this;
		function onGetMyRegistrationSuccess(oData) {
			that.setBusy(false);
			that.bNeedUpdateRegistration = false;
			that.aRegister = oData.results;
			if ( that.aRegister.length > 1) {
				//need show dialog to choose one
				that.byId("switchEntryBtn").setEnabled(true);
				that.onSwitchEntryPressed();
			} else {
				that.currentResigerIndex = 0;
				that.updateContentByMultipleEntrySelection();
			}
		}

		function onGetMyRegistrationError(error) {
			that.bNeedUpdateRegistration = false;
			that.setBusy(false);
			Util.showError("Failed to get my registration.", error);
		}

		// var url = "/GetMyRegistration?projectId='" + this.projectId + "'";
		var url = "/GetMyRegistration";
	    this.oDataModel.callFunction(url, {
	    	urlParameters: { 'projectId': this.projectId, '$format': "json"},
			method: "GET",
			success: onGetMyRegistrationSuccess,
			error: onGetMyRegistrationError
		});

	    this.setBusy(true);
	},


	createSelectEntriesDialog: function( dlg ) {
		var listItem = new sap.m.ColumnListItem();
		//!!also the status is important, just add it 
		this.aFormCfg.unshift({
			property: 'Status',
			label:  'Status'
		});
	    for (var i=0; i < this.aFormCfg.length; i++) {
			var  cfg = this.aFormCfg[i];
			//!!now will show all the property exclude the attachment, later can let user define some key property
			if ( cfg.type == Enum.ControlType.Attachment) {
				continue;
			}

			var item = new sap.m.Text({
				text: "{" + cfg.property + "}"
			});
			listItem.addCell( item );

			var col = new sap.m.Column({
				header: new sap.m.Text({text: cfg.label})
			});

			dlg.addColumn( col );
		}

		dlg.bindItems("/", listItem);
	},
	

	onSwitchEntryPressed: function() {
		if (this.bNeedUpdateRegistration) {
			this.getMyResistration();
		} else {
		    if (!this.oSwitchEntryDialog) {
				this.oSwitchEntryDialog = sap.ui.xmlfragment(this.getView().getId(), "csr.register.view.SelectEntryDialog", this);
				//for first time need set the view 
				this.createSelectEntriesDialog( this.oSwitchEntryDialog );
				this.oSwitchEntryDialog.setModel(this.oEntryModel);
			}
			//always use the latest data
			this.oEntryModel.setData( this.aRegister);

			this.oSwitchEntryDialog.open();
		}
	},

	onNewEntryButtonPressed: function( evt ) {
	    var ret = confirm("The unsaved data will be lost, do you want to create new entry ?");
	    if (ret) {
	    	this.mRegister  = Util.createNewRegistration(this.mRegister);
	    	//!!now the uploader still not clear, just clear it manually
	    	for (var i=0; i < this.aUploader.length; i++) {
	    		this.aUploader[i].setFileName('');
	    	}
	    	this.currentResigerIndex = -1;
	    	this.updateContentByMultipleEntrySelection();
	    }
	},
	

	onSelectEntryConfirmed: function( evt ) {
	    //change the current form data;
	    var aContext = evt.getParameter('selectedContexts');
	    if (aContext.length ==0) {
	    	Util.info("You must choose one entry to display!");
	    } else {
	    	//just one 
    		var context = aContext[0];
    		var path = context.getPath();  // like /0
    		this.currentResigerIndex = parseInt(  path.substr(1));
			this.updateContentByMultipleEntrySelection();
	    }

	},
	
	
	getUploadedAttachmentInfo: function(  ) {
		// var url = Util.getMyAttachmentUrl(this.mRegister.UserId);
		var that = this;

		function onGetUploadAttachmentSuccess(oData) {
			for (var i=0; i < oData.results.length; i++) {
				var  attachment = oData.results[i];

				//by the type set the FileName 
				var name = "FileName" + attachment.Type;

				that.mRegister[ name ] = attachment.FileName;
			}

			that.onGetInitialDataFinished();
		}

		function onGetUploadAttachmentError(error) {
			Util.showError("Failed to get Attachment information.", error);
			that.onGetInitialDataFinished();
		} 

	    this.oDataModel.read("/Attachments", {
	    	filters: [new sap.ui.model.Filter("UserId", 'EQ', that.mRegister.UserId)],
			success: onGetUploadAttachmentSuccess,
			error:  onGetUploadAttachmentError
		});
	},
	
	createOrUpdateFooterButton: function() {
		this.oSubmitBtn = null;
		this.oCancelBtn = null;
		this.oSaveBtn = null;

		//for simple first just delete old button 
		this.oFooterBar.removeAllContentRight();

		var aActionInfo = Enum.RegisterActionButton[ this.mRegister.Status];
		for (var i=0; i < aActionInfo.length; i++) {
			var  info = aActionInfo[i];
			if ( info.name == 'Cancel' && !this.projectCfg.AllowCancel) {
				continue;
			}

			var button = new sap.m.Button({
				text: info.name,
				icon: info.icon,
				press: [this.onResigerActionButtonPressed, this]
			});
			//use the data to know how to handle
			button.data('Action', info.name);
			if (info.type) {
				button.setType(info.type);
			}

			this.oFooterBar.addContentRight( button );

			//also set the button 
			var name = 'o' + info.name + 'Btn';
			this[name] = button;
		}
	},

	checkButtonStatus: function( evt ) {
	    //for the save, cancel always enabled 
	    if (this.oSubmitBtn) {
	    	if ( this.projectOpened) {
		    	var status = true;

		    	//check all the necessary input is not null
				for (var i=0; i < this.aFormCfg.length; i++) {
					var cfg = this.aFormCfg[i];
					if (cfg.mandatory) {
						var realValue = this.mRegister[ cfg.property];
						if (realValue == null) {
							status = false;
							break;
						}
	    				if (!realValue) {
	    					//for the Radio/List, only require the lenght not empty, 
	    					//as the candidate value may like '0'
	    					var type = cfg.type;
	    					if (type == Enum.ControlType.List || type == Enum.ControlType.Radio) {
	    						if ( realValue.length ==0) {
	    							status = false;
	    						} 
	    					} else {
	    						status = false;
	    					}
	    					break;
		    			}
					}
				}
		    	this.oSubmitBtn.setEnabled(status);
		    } else {
		    	this.oSubmitBtn.setEnabled(false);
		    }
	    }
	    
	    //for save and sub-project, at least select the sub-project item
	    if ( this.oSaveBtn) {
	    	if (this.projectCfg.RegistrationLimit_Ext == Enum.RegistrationLimit.SubProject) {
	    		this.oSaveBtn.setEnabled( !! this.mRegister.SubProject && this.projectOpened);
	    	} else {
	    		this.oSaveBtn.setEnabled( this.projectOpened);
	    	}
	    }
	},
	
	//for all the input field
	onInputValueChanged: function( oEvent ) {
	    this.checkButtonStatus();
	},

	onAttachmentSelectChanged: function( oEvent ) {
	    this.checkButtonStatus();
	    //!!now the file name not update automaticaly, so just update it manually
	    var uploader = oEvent.getSource();
	    //here need use the setProperty to update, so all register event will no notified
	    var binding = uploader.getBinding("fileName");
	    var model = binding.getModel();
	    model.setProperty(binding.getPath(), uploader.getFileName());
	},
	
	checkStatusOfLimitationCheck: function( ) {
		//only when the expected stats is Submitted then need check whether exceed the limitation
		if ( this.mRegister.Status != Enum.Status.Submitted)
			return;

	    if ( this.projectCfg.NeedApprove || 
	    	this.projectCfg.RegistrationLimit_Ext == Enum.RegistrationLimit.No) { 
	    	return ;
	    }

	    //for the Sub-Project, need check whether that sub-project has limit 
		if (this.projectCfg.RegistrationLimit_Ext == Enum.RegistrationLimit.SubProject) {
			for (var i=0; i < this.aSubProject.length; i++) {
				if (this.mRegister.SubProject == this.aSubProject[i].info) {
					var limit = this.aSubProject[i].limit;
					if ( limit == '' || limit == '0')
						return;	
					}
			}
		}
		//for the OneProject, always need check

		function onQueryStatusSuccess( oData ) {
		    if ( oData.Status == Enum.Status.Submitted) {
		    	Util.info("Congratulations, you have submitted successfully!");
		    } else {
		    	Util.info("Sorry, you have added to the waiting list because registration exceed maximun limitation!");
		    }
		}
		
		function onQueryStatusError( error ) {
		    Util.showError("Error to get the submitted status", error);
		}
		
		
		//just to query to check whether now the status is Submitted or Waiting 
	    var path = "/Registrations(ProjectId=" + this.projectId + "L,RegisterId=" 
	    		+ this.mRegister.RegisterId + "L,UserId='" + this.mRegister.UserId + "')";
		this.oDataModel.read(path, {
			success:  onQueryStatusSuccess,
			error: onQueryStatusError 
		});	    
	},
	
	
	//as Save, Cancel, Submit has similar logic, so use same function
	onResigerActionButtonPressed: function( oEvent ) {
		//for the age, need check ??
		var btn = oEvent.getSource();
		var action = btn.data("Action");

		//for the Save/Submit, if have the agreement, then must agree it 
		if (action == "Cancel") {
			var bConfirm = confirm("Are you sure to cancel the Registraion? After cancel, then can't submit again!");
			if (!bConfirm)
				return;
		} else {
			if ( this.projectCfg.NeedAgreement_Ext) {
				if ( ! this.mRegister.Agreement) {
					Util.info("You must accept the agreement in order to save to submit!");
					return;
				}
			}
		}

		var oldStatus = this.mRegister.Status;
	    var newStatus  = this.getNewStatus( action );

	    var bCreate = true;
	    if (oldStatus != "New") {
	    	bCreate = false;
	    }
	    this.mRegister.Status = newStatus;
	    
	    //for submit, need upload the attachment 
	    var oldAction = action;
	    var that = this;
	    function onRegActionSuccesss( oData) {
	    	//!!here need update local mRegister id, and check the multiple entry
	        //then do update 
	        //only for the create, need get the new RegisterId
	        if (oData &&  oData.RegisterId) {
	        	that.mRegister.RegisterId = oData.RegisterId;
	        }

	        //for the create, it may be add new entry, so we need enable the button if it was from 1 to 2
	        if ( bCreate) {
	        	if ( oData.EntriesCount >1 ) {
	        		that.byId("switchEntryBtn").setEnabled( true ); 
	        		//and now it add new content, so need load the content again
	        		that.bNeedUpdateRegistration = true;
	        	}
	        }

	        //for sub-project, need control the enabled for sub-project selection
	        that.oModel.setProperty("/Status", newStatus);

	        //then update the attachment
	        that.uploadAttachments(btn, oldAction);

	        //for the project has limitation without approve process, need check whether it exceed the limiation or not 
	        that.checkStatusOfLimitationCheck();
	    }
	    
	    function onRegActionError(error) {
	    	//!!how to know for the registration limit, user need enter to waiting list ??
	    	that.setBusy(false);
	    	that.onActionError(error, oldAction);
	    }

	    // do real action
	    var mParam = {
	    	success: onRegActionSuccesss,
	    	error: onRegActionError
	    };

	    //as there are some extra data, so here need just get the required data 
	    var mData = jQuery.extend({}, true, this.mRegister);
		delete mData.EntriesCount;
    	delete mData.RegisterId;
    	delete mData.Agreement;
		
	    //for the null value, need delete 
	    for (var key in mData) {
	    	if ( mData[key] === null) {
	    		delete mData[key];
	    	}
	    	//as now the attchment will upload later by seperate task, so now we will not set the attachment name 
	    	if ( key.indexOf("FileName") ==0)
	    		delete mData[key];	
	    }
	    //for the new entry, need set the projectId 
	    mData.ProjectId = this.projectId;
	    if ( newStatus == Enum.Status.Submitted) {
	    	mData.ActionFlag = Enum.ActionFlag.Submit;	
	    } else if (newStatus == Enum.Status.Canceled){
	    	mData.ActionFlag = Enum.ActionFlag.Cancel;	
	    } else {
	    	mData.ActionFlag = Enum.ActionFlag.Others;	
	    }
	    
	    //?? for the Age, need use the number, sometimes it still need use the string 
	    // if (mData.Age) {
	    // 	mData.Age = parseInt(mData.Age);
	    // }

	    console.error("!!create or update body",  JSON.stringify(mData));

	    if (bCreate) {
	    	//for new Registration, 
			this.oDataModel.create("/Registrations", mData, mParam);
	    } else {
	    	var path = "/Registrations(ProjectId=" + this.projectId + "L,RegisterId=" 
	    		+ this.mRegister.RegisterId + "L,UserId='" + this.mRegister.UserId + "')";
			this.oDataModel.update(path, mData, mParam);
	    }

	    //??also need upload the attachments 
	    this.setBusy(true);
	},

	
	//if save it at same time, then >HTTP Status 500 - Attempting to execute an operation on a closed EntityManager,
	//so change to only when previos finished then do next 
	uploadAttachments: function( btn, action) {
		this.aNeedUploader = [];
		this.mPendingUpdateAttachment = null;
		// this.triggeredBtn = btn;

		for (var i=0; i < this.aUploader.length; i++) {
			var oUploader = this.aUploader[i];
	     	if ( oUploader.getModified()) {
	     		this.aNeedUploader.push(oUploader);
	     	}
		}

	    if (this.aNeedUploader.length>0) {
	    	// btn.setEnabled(false);
	    	this.lastPendingAction = action;
	    	this.uploadAttachmentStepByStep();
	    } else {
	    	this.onActionSuccesss(action);
	    }
	},

	uploadAttachmentStepByStep: function( ) {
		var oUploader = this.aNeedUploader.shift();
		if (oUploader) {
			//userId, projectId, entryId, type
			var url = Util.getAttachmentUploaderUrl( this.mRegister.UserId, this.projectId,
				this.mRegister.RegisterId,   oUploader.data('type'));

 			oUploader.setUploadUrl(url);

 			//also set the slug ?? 

 			oUploader.upload();
 			//clear flag 
 			oUploader.setModified(false);	
		} else {
			//all finished, can show toast now
			this.onActionSuccesss( this.lastPendingAction);
		}
	},

	//need know which attachment succesful 
	onUploadFileFinished: function( evt ) {
		if ( this.mPendingUpdateAttachment == null) {
			this.mPendingUpdateAttachment = {};	
		}
		var uploader = evt.getSource();
		this.mPendingUpdateAttachment[ uploader.data('type') ] = uploader.getFileName();
		
	    this.uploadAttachmentStepByStep();
	},

	onUploadFileFailed: function( evt ) {
	    this.uploadAttachmentStepByStep();
	    //!!later need tell user which file failed
	},
	
	onAttachmentDelPressed: function( evt) {
		if ( !this.mRegister.RegisterId) {
			Util.info("Attachment not upload to server, no need delete!");
		}
		
	    var that = this;
	    var btn = evt.getSource();
	    function onDelSuccess() {
	    	that.setBusy(false);
	    	//clear the property
	    	Util.showToast("Delete attachment successful");
	    	var binding = btn.getBinding('enabled');
	    	var model = binding.getModel();
	    	//now btn binding to property, so can directly set it
	    	model.setProperty(binding.getPath(), "");

	    	//after delete the attachment, need update the register also
	    	var mData = {};
	    	mData[ btn.data('property') ] = "";
	    	var path = "/Registrations(ProjectId=" + that.projectId + "L,RegisterId=" 
	    		+ that.mRegister.RegisterId + "L,UserId='" + that.mRegister.UserId + "')";
			that.oDataModel.update(path, mData);
	    }
	    
	    function onDelError(error) {
	    	that.setBusy(false);
	    }

		// (EntryId='2',ProjectId='1',Type='FileName0',UserId='I068108');
		var url = "/Attachments(EntryId='{0}',ProjectId='{1}',Type='{2}',UserId='{3}')";
		url = url.sapFormat(this.mRegister.RegisterId, this.projectId, btn.data('type'), this.mRegister.UserId);
		this.oDataModel.remove(url, {
    		success: onDelSuccess, 
    		error:   onDelError,
    	});
		this.setBusy(true);
	},
	
	//!!later we can combine update attachment and other together, no update twice
	onActionSuccesss: function(oldAction ) {
		//now only the first time 
		Util.showToast(oldAction + " successful!");
		
		//update the page title 
		this.updatePageTitle();
	    this.createOrUpdateFooterButton();
		this.checkButtonStatus();

		var that = this;
		function onUpdateAttachmentSuccess(oData) {
			Util.showToast("Update attachment name successful!");
			that.setBusy(false);
		}

		function onUpdateAttachmentError(error) {
	    	that.setBusy(false);
	    	Util.showError("Update attachment name error ", error);
	    }

		if ( !this.mPendingUpdateAttachment) {
			that.setBusy(false);
		} else {
			var path = "/Registrations(ProjectId=" + this.projectId + "L,RegisterId=" 
	    		+ this.mRegister.RegisterId + "L,UserId='" + this.mRegister.UserId + "')";
			this.oDataModel.update(path, this.mPendingUpdateAttachment, 
				{
					success: onUpdateAttachmentSuccess,
					error: onUpdateAttachmentError
				}
			);
		}
	},

	onActionError: function( error, oldAction) {
	    Util.showError(oldAction + " failed.", error);
	},
	
	
	getNewStatus: function( action ) {
	    if (action == 'Save') {
	    	//depend on current status 
	    	if (this.mRegister.Status == "Submitted") {
				return "Submitted";
	    	} else {
	    		return 'Drafted';
	    	}
	    } else if (action == "Submit"){
	    	return "Submitted"; 
	    } else if (action == "Cancel") {
	    	return "Canceled";
	    }
	},

	onSubProjectChanged: function( evt, oTextAreaInfo) {
		BaseController.prototype.onSubProjectChanged.call(this, evt, oTextAreaInfo);
		
		//also depend on current select subProject, decided whether it register or not 
		if ( this.projectCfg.Status == Enum.ProjectStatus.Opened) {
			var subPrjStatus = this.aSubProject[this.subProjectIndex].status;
			if ( subPrjStatus == Enum.ProjectStatus.Closed) {
				var info = "The sub-project [{0}] has been closed, please select other open sub-project to register";
				Util.info( info.sapFormat( this.aSubProject[this.subProjectIndex].info)); 
				this.projectOpened = false;
			} else {
				this.projectOpened = true;
			}
		} else {
			this.projectOpened = false;	
		}
		
		//update the status
		this.checkButtonStatus();
	}
});
	
	

	//global data 
	
	return ControllerController;
});