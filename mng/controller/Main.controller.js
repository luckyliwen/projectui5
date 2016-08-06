var gf,gt,gl,gc;
sap.ui.define([
	"csr/lib/BaseController",
	"csr/lib/Enum",
	"csr/lib/Config",
	"csr/lib/Util",
	"sap/ui/model/type/DateTime"
], function(BaseController, Enum, Config, Util,DateTime) {
	"use strict";

var ControllerController = BaseController.extend("csr.mng.controller.Main", {
	onInit:function() {
		BaseController.prototype.onInit.call(this);
		
		this.userId = "";
		this.oDataModel = this.getModel();
		this.oDataModel.setUseBatch(false);

		this.oList = this.byId('projectList');
		this.oDetailPage = this.byId("detailPage");
		
		this.oProjectModel = new sap.ui.model.json.JSONModel();
		this.projectCfg = this.getDefaultProjectCfg();

		this.oProjectModel.setData( this.projectCfg);
		this.oProjectModel.setDefaultBindingMode("TwoWay");
		this.byId("detailPage").setModel(this.oProjectModel);

		this.oTable = this.byId("formTable");
		this.oFormModel = new sap.ui.model.json.JSONModel();
		this.aFormCfg = [];
		this.oFormModel.setDefaultBindingMode("TwoWay");
		this.oFormModel.setData( this.aFormCfg);
		this.byId("formTable").setModel(this.oFormModel);

		//create a globlal model to control edit/display model 
		this.mGlobal  = {
			bOwner: true
		};
		this.oGlobalModel = new sap.ui.model.json.JSONModel(this.mGlobal);
		// this.byId("detailPage").setModel(this.oGlobalModel, 'g');	//g means global, for easy write in xml	
		// this.byId("formTable").setModel(this.oGlobalModel, 'g');
		this.oDetailPage.setModel(this.oGlobalModel, 'g');

		this.initList();
		this.getUserInfo();

		//the sub-project limitation
		this.aSubProject = null;
		this.oSubProjectModel = new sap.ui.model.json.JSONModel(this.aSubProject);
		
		//other init work 
		this.byId("emailTemplateTips").setValue( Config.getConfigure().EmailTemplateTips);

		gc = this; 
		gt = this.oTable;
		gl = this.oList;
	},

	fmtCandidate: function(type) {
	    if (type == 'List' || type == 'Radio')
	    	return true;
	    else
	    	return false;
	},
	
	onMyOrOtherSegmentSelected: function( evt ) {
	    this.freshList();
	},

	getUserInfo: function(  ) {
		var that = this;
		function onGetUserInfoSuccess( oData) {
			if (oData) {
				that.userId = oData.UserId;
				that.freshList();
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

	initList: function( evt ) {
		this.listItemTemplate = this.oList.removeAllItems()[0];
		// this.freshList();
		// items ="{/Projects}"
	    //as we need refresh it, so we need create template  for it;
	},
	
	freshList_old: function( evt ) {
	    this.oList.bindItems("/Projects", this.listItemTemplate);
	},

	isMyProjectSegmentSelected: function( evt ) {
	    var key = this.byId("segmentBtn").getSelectedButton();
	    if (key.indexOf("mySegment") != -1)
	    	return true;
	    else 
	    	return false;
	},
	

	/**
	 * [freshList description]
	 * @param  {[type]} bSelectCreatedProject: true means need select the new created project 
	 * @return {[type]}                       [description]
	 */
	freshList: function(selectProjectId) {
		var aFilter = [];

		if ( this.isMyProjectSegmentSelected()) {
			aFilter.push( new sap.ui.model.Filter({
		 	  		filters: [
		 	  			new sap.ui.model.Filter("Author", 'EQ', this.userId),
		 	  			new sap.ui.model.Filter("Administrator", 'Contains', this.userId)
		 	  		],
		 	    	and: false
		 	    }) );
		} else {
			//!! later need find a way in UI5 to support substringof('I068108', Administrator) eq false
			aFilter.push( new sap.ui.model.Filter("ProjectPublic", 'EQ', true) );
			var subFilter = new sap.ui.model.Filter({
	 	  		filters: [
	 	  			new sap.ui.model.Filter("Author", 'NE', this.userId)
	 	  		],
	 	    	and: true
	 	    });
			aFilter.push( subFilter); 
		}
			
		this.oList.bindItems({
	    	path: "/Projects",
	    	filters: aFilter,
	    	template: this.listItemTemplate
		} );
	},
	

	fmtProjectId: function( id ) {
	    return "ID: " + id;
	},
	
	getDefaultProjectCfg: function() {
	    return {
	    	Author: this.userId,
	    	AllowCancel: true,  Deadline: "",   Description: "",
	    	DisplayProjectInfoAtTop: true,    Form: "",
	    	Link: "",   MultipleEntry: false,  Title: "",
	    	ProjectId: '', 
	    	ProjectPublic: true,
	    	RegistrationSecurity: 'Public', 
	    	bOwner: true,
	    	NeedEmailNotification: false,
	    	RegistrationLimit_Ext: "No"
	    };
	},

	setDetailPageTitle: function( evt ) {
		if (this.projectCfg.ProjectId) {
	    	this.oDetailPage.setTitle("ID: " + this.projectCfg.ProjectId + "    Title:" + this.projectCfg.Title);
		} else {
			this.oDetailPage.setTitle("New Project");
		}
	},
	

	onODataRequestCompleted: function( oData ) {
	    // console.error(oData);
	},
	
	
	onListDataReceived: function( oEvent ) {
	    var items = this.oList.getItems();
	    if (items && items.length>0) {
	    	this.oList.setSelectedItem( items[0]);
			this.onListSelectionChanged();
	    }
	},

	onNewProjectPressed: function( evt ) {
		this.oList.removeSelections();

	    this.projectCfg = this.getDefaultProjectCfg();
	    this.oProjectModel.setData( this.projectCfg);
	    this.setDetailPageTitle();

	    this.aFormCfg = []; 
	    this.oFormModel.setData(this.aFormCfg);
	    this.aSubProject = null;
	},

	onActionSheetButtonPressed: function( evt ) {
	    var item = evt.getSource().data('item');
	    //need check can't duplicate 
	    for (var i=0; i < this.aFormCfg.length; i++) {
	    	if ( item.property == this.aFormCfg[i].property) {
	    		Util.info("The " + item.name + " already existed, one property can only use once.");
	    		return;
	    	}
	    }
	    this.aFormCfg.push( item);
	    this.oFormModel.setData(this.aFormCfg);
	},

	onFormTableRowSelectChanged: function( evt ) {
	    var idx = this.oTable.getSelectedIndex();
	    var bSel = true;
	    if (idx == -1) {
	    	bSel = false;
	    }
	    var len = this.aFormCfg.length;  

	    this.byId("rowDeleteBtn").setEnabled(bSel);
	    this.byId("rowClearBtn").setEnabled(bSel);
	    this.byId("rowTopBtn").setEnabled(bSel && len>1 && idx!=0);
		this.byId("rowUpBtn").setEnabled(bSel && len>1 && idx>0);
		this.byId("rowDownBtn").setEnabled(bSel && len>1 && idx!= (len-1));
		this.byId("rowBottomBtn").setEnabled(bSel && len>1 && idx!= (len-1));
	},

	//now need assign the missed property, each time only need set the missed one 
	assignPropertyToFormCfg: function( ) {
		var i, attrCount  = 20, attachmentCount = 5;

		var aFreeAttr = [];
	    for (i=0; i < attrCount; i++) {
	    	aFreeAttr.push(true);
	    }

	    var aFreeAttachment = [];
		for (i=0; i < attachmentCount; i++) {
	    	aFreeAttachment.push(true);
	    }		

	    //for the attachment, now use FileName, can use same ??
		
		var property, idx, freeIdx;
	    //first loop just find which AttrXX FileNamexx has used, to create the real mapping
	    for ( i=0; i < this.aFormCfg.length; i++) {
	    	property = this.aFormCfg[i].property;
	    	if (!property)
	    		continue;

	    	if ( property.indexOf('Attr') == 0) {
	    		//by the index can know which one taken
	    		idx = property.substr(4);
	    		idx = parseInt(idx);
	    		aFreeAttr[idx] = false;
	    	} else if (property.indexOf('FileName') == 0) {
				idx = property.substr(8);
	    		idx = parseInt(idx);
	    		aFreeAttachment[idx] = false;
	    	}
	    }

	    //then just find the empty property and assign
	    for ( i=0; i < this.aFormCfg.length; i++) {
	    	var cfg = this.aFormCfg[i];
	    	property = cfg.property;
	    	var foundIdx = "";
	    	if (property)
	    		continue;
	    	
    		//attachment 
    		if ( cfg.type == Enum.ControlType.Attachment) {
				for (freeIdx =0; freeIdx < attachmentCount; freeIdx++) {
	    			if ( aFreeAttachment[ freeIdx]) {
	    				aFreeAttachment[ freeIdx] = false;
	    				foundIdx = freeIdx;
	    				break;
	    			}
	    		}
	    		if (foundIdx === "") {
	    			alert("Now support the maximum attachment is 5. Any doubt please contact Lucky Li");
	    			return false;
	    		}
	    		this.aFormCfg[i].property = 'FileName' + foundIdx;
    		} else {
	    		for (freeIdx =0; freeIdx < attrCount; freeIdx++) {
	    			if ( aFreeAttr[ freeIdx]) {
	    				aFreeAttr[ freeIdx] = false;
	    				foundIdx = freeIdx;
	    				break;
	    			}
	    		}
	    		if (foundIdx === "") {
	    			alert("Now support the maximum customized attribute is 20. Any doubt please contact Lucky Li");
	    			return false;
	    		}
	    		this.aFormCfg[i].property = 'Attr' + foundIdx;
	    	}
	    }
	    return true;
	},
	
	onSavePressed: function( evt ) {
		var bCreate = !this.projectCfg.ProjectId;
		var that = this;

		if (this.projectCfg.Title.trim().length == 0) {
			Util.info('Please set the title first.');
			return;
		}

   	    function onSaveSuccess(oData) {
	    	
	    	if (bCreate) {
	    		that.projectCfg.ProjectId = oData.ProjectId;
	    		Util.showToast("Create new project with ID: " + oData.ProjectId + " success.");
	    		//in this case, need update the right part list and set the selected item
	    		that.freshList(oData.ProjectId);
	    	} else {
	    		Util.showToast("Save project success.");
	    	}
	    	that.setBusy(false);

	    	//also update the title
	    	that.setDetailPageTitle();
	    }
	    
	    function onSaveError(error) {
	    	that.setBusy(false);
	    	Util.showError("Save project failed ", error);
	    }

		var mParam = {
			success: onSaveSuccess,
			error: onSaveError
		};

		var mData = jQuery.extend({}, true, this.projectCfg);
		delete mData.ProjectId;
		delete mData.Author;
		delete mData.ModifiedTime;
		delete mData.__metadata;
		delete mData.bOwner;
		delete mData.RegistrationLimit_Ext;
		//all the Null property just ignore for performance 
		for (var key in mData) {
			if (mData[key] === null)
				delete mData[key];
		}

		//limit need mapping, now olingo need use string format
		mData.RegistrationLimit = "" + Util.mapRegistrationLimitToNumber(that.projectCfg.RegistrationLimit_Ext, 
			that.projectCfg.RegistrationLimit);

		//!!later we can check it during the operation, now just check it when save
		var ret = this.assignPropertyToFormCfg();
		if (!ret) {
			return;
		}

		mData.Form = JSON.stringify( this.aFormCfg);

	    if (bCreate) {
	    	//for new Registration, 
			this.oDataModel.create("/Projects", mData, mParam);
	    } else {
	    	var url = "/Projects(" + this.projectCfg.ProjectId + "L)";
	    	this.oDataModel.update(url, mData, mParam);
	    }
    	that.setBusy(true);
	},

	onDuplicatePressed: function( evt ) {
		this.oList.removeSelections();

		var newCfg = jQuery.extend({}, true, this.projectCfg);
		newCfg.ProjectId = "";
		this.projectCfg = newCfg;
    	this.oProjectModel.setData( this.projectCfg);
    	this.setDetailPageTitle();

    	//also try to duplicate the form, need one by one 
    	var aForm = [];
    	for (var i=0; i < this.aFormCfg.length; i++) {
    		var cfg = this.aFormCfg[i];
    		aForm.push( jQuery.extend({},true, cfg) );
    	}
		this.aFormCfg = aForm;
		this.oFormModel.setData(this.aFormCfg);
	},
	
	onOpenExplorePressed: function( evt ) {
	    if (!this.projectCfg.ProjectId) {
	    	Util.info("Please first save the project then try this.");
	    	return;
	    }
	    this.openOtherWindow('explore');
	},
	

	onOpenRegistrationPressed: function( evt ) {
	    if (!this.projectCfg.ProjectId) {
	    	Util.info("Please first save the project then try this.");
	    	return;
	    }

	    this.openOtherWindow('register');
	},
	
	openOtherWindow: function( newApp) {
	    var href = document.location.href;   //change the /mng/ to /register/, and add project=
	    //when run inside the lanchPad, url like
		//https://flpportal-p1941824928trial.dispatcher.hanatrial.ondemand.com/sites?siteId=6effabf2-ebba-4220-b05a-d07fbefbab54#project-mng
		//in this case, we need use the static url
		var newHref = "";
		if ( href.indexOf("siteId=") != -1) {
			var root = Config.getConfigure().Ui5RootUrl;
			newHref = root + "/" + newApp + "/index.html";
		} else {
			newHref = href.replace('/mng/',  '/' + newApp + '/');
		}

		//then add the param: 
		var pos = newHref.indexOf("?");
		if (pos == -1) 
			newHref += '?';
		else 
			newHref += "&";

		newHref += "projectId=" + this.projectCfg.ProjectId;
		window.open(newHref);
	},
	

	onPreviewPressed: function( evt ) {
	    if (!this.oPreviewDlg) {
			this.oPreviewDlg = sap.ui.xmlfragment(this.getView().getId(), "csr.mng.view.Preview", this);
	    }

		this.oPreviewDlg.setTitle("Preview of project: " + this.projectCfg.Title);

	    //remove old content and create new 
	    this.oPreviewDlg.removeAllContent();
		var header = this.createProjectHeader(this.projectCfg);
		if ( header)
			this.oPreviewDlg.addContent( header);

		var form  = this.createRegisterForm( this.aFormCfg);
		this.oPreviewDlg.addContent( form );

	    this.oPreviewDlg.open();
	},

	onDialogCloseressed: function( evt ) {
	    this.oPreviewDlg.close();
	},
	
	
	onDeletePressed: function( evt ) {
		if ( !this.projectCfg.ProjectId) {
			Util.info("Project not saved, no need delete!");
			return;
		}

		var ret = confirm("Are you sure to delete? If done, the data can't recover.");
		if (!ret)
			return;

		var that = this;
	    function onDelSuccess() {
	    	Util.showToast("Delete success.");
	    	that.setBusy(false);
	    	//??later check how to set the focus
	    	that.freshList();
	    	that.onNewProjectPressed();
	    }
	    
	    function onDelError(error) {
	    	this.setBusy(false);
	    	Util.showError("Delete failed ", error);
	    }

		var url = "/Projects(" + this.projectCfg.ProjectId + "L)";
		this.oDataModel.remove(url, {
    		success: onDelSuccess, 
    		error:   onDelError,
    	});
		this.setBusy(true);
	},
	
	
	onRowClearPressed: function( evt ) {
	    var idx = this.oTable.getSelectedIndex();
	    var model = this.oTable.getModel();
	    var context = this.oTable.getContextByIndex(idx);
	    model.setProperty("label", "", context);
	    model.setProperty("tooltip", "", context);
	    model.setProperty("candidate", "", context);
	},
	

	onRowAddCommonPressed: function( evt ) {
	    if ( ! this.oActionSheet) {
	    	this.oActionSheet = new sap.m.ActionSheet({
	    		placement: "Bottom"
	    	});

	    	for (var i=0; i < Enum.CommonItems.length; i++) {
	    		var  item = Enum.CommonItems[i];
	    		var btn  = new sap.m.Button({text: item.name, press: [this.onActionSheetButtonPressed, this]});
	    		btn.data("item", item );
	    		this.oActionSheet.addButton( btn);
	    	}
	    }
	    this.oActionSheet.openBy(evt.getSource());
	},

	onRowAddPressed: function( evt ) {
		var item = {mandatory: true, property: '', type: 'Input', label: '', tooltip: '', candidate:''};
		this.aFormCfg.push( item );
	    this.oFormModel.setData(this.aFormCfg);
	},

	onRowDelPressed: function( evt ) {
	    var idx = this.oTable.getSelectedIndex();
	    this.aFormCfg.splice(idx, 1);
	    this.oFormModel.setData(this.aFormCfg);
	},
	
	onRowTopPressed: function( evt ) {
	    this.onRowDoMove(Enum.MoveDirection.Top);
	},
	
	onRowUpPressed: function( evt ) {
	    this.onRowDoMove(Enum.MoveDirection.Up);
	},
	
	onRowDownPressed: function( evt ) {
	    this.onRowDoMove(Enum.MoveDirection.Down);
	},
	
	onRowBottomPressed: function( evt ) {
	    this.onRowDoMove(Enum.MoveDirection.Bottom);
	},

	onRowDoMove: function( direction ) {
	    var idx = this.oTable.getSelectedIndex();
	    var item = this.aFormCfg.splice(idx, 1)[0];
	    var pos;
	    switch ( direction) {
	    	case Enum.MoveDirection.Top: 
	    		this.aFormCfg.unshift(item);
	    		pos = 0;
	    		break;
	    	case Enum.MoveDirection.Up: 
	    		this.aFormCfg.splice(idx-1, 0, item);
	    		pos = idx -1;
	    		break;
	    	case Enum.MoveDirection.Down: 
	    		this.aFormCfg.splice(idx+1,0, item);
	    		pos = idx + 1;
	    		break;
	    	case Enum.MoveDirection.Bottom: 
	    		this.aFormCfg.push(item);
	    		pos = this.aFormCfg.length -1;
	    		break;
	    }
	    this.oFormModel.setData(this.aFormCfg);
	    //also need set the new selection after move
	    this.oTable.setSelectedIndex(pos);
	},
	
	onListSelectionChanged: function() {
		//!!later considerate ask user whether can lost
	    var selItem = this.oList.getSelectedItem();
	    if (selItem) {
	    	var binding = selItem.getBindingContext();
	    	this.projectCfg = binding.getProperty();

	    	//add missed property if not set NeedEmailNotification
	    	if ( !("NeedEmailNotification" in this.projectCfg)) {
	    		this.projectCfg.NeedEmailNotification = false;
	    	}
	    	this.RegistrationLimit_Ext = Util.mapRegistrationLimitToEnum(this.RegistrationLimit);
   		    this.aSubProject = null;


	    	var bOwner = false;
	    	if (this.userId == this.projectCfg.Author) {
				bOwner = true;
			} else if (this.projectCfg.Administrator && this.projectCfg.Administrator.indexOf(this.userId) != -1) {
				bOwner = true;
			} 
			//update the global flag to control readonly 
			this.oGlobalModel.setProperty('/bOwner', bOwner);

	    	this.oProjectModel.setData( this.projectCfg);
	    	this.setDetailPageTitle();

	    	//also try to get the form 
	    	if (this.projectCfg.Form != "") {
	    		try {
	    			this.aFormCfg = JSON.parse( this.projectCfg.Form);
	    			this.oFormModel.setData(this.aFormCfg);
	    		} catch(e) {
	    			console.error("Form format error", this.projectCfg.Form);
	    		}
	    	}
	    }
	},

	//=======================sub project part 
	onSubProjectDefinePressed : function( evt ) {
        if (!this.oSubProjectDlg) {
            this.oSubProjectDlg = sap.ui.xmlfragment(this.getView().getId(), "csr.mng.view.SubProjectDialog", this);
        	this.oSubProjectDlg.setModel(this.oSubProjectModel);
        }

        //mapping from string to array, only need when project changed or not do init
        if ( this.aSubProject === null) {
        	this.aSubProject = [];
			if (this.projectCfg.subProjectInfo) {
				var aInfo = this.projectCfg.subProjectInfo.split(";");
				var aLimit = this.projectCfg.subProjectLimit.split("");
				for (var i=0; i < aInfo.length; i++) {
					this.aSubProject.push({
						info: aInfo[i],
						limit: aLimit[i]
					});
				}
	        } else {
	        	//just 3 default raw 
	        	this.aSubProject= [
	        		{info: "", limit: ""},
	        		{info: "", limit: ""},
	        		{info: "", limit: ""}
	        	];
	        }
	        this.oSubProjectModel.setData( this.aSubProject);
        }
        this.oSubProjectDlg.open();
	},
	
	onSubProjectOkButtonPressed: function( evt ) {
    	//save them back
    	var prjInfo = "", prjLimit = "";
    	for (var i=0; i < this.aSubProject.length; i++) {
    		prjInfo += this.aSubProject[i].info.trim() + ";";
    		prjLimit += this.aSubProject[i].limit.trim() + ";";
    	}
		//remove the last extra ;
		this.projectCfg.SubProjectInfo = prjInfo.substr(0, prjInfo.length -1);
		this.projectCfg.SubProjectLimit = prjLimit.substr(0, prjLimit.length -1);
        
        this.oSubProjectDlg.close();
	},

	onSubProjectRowDeletePressed: function( evt ) {
	    var btn = evt.getSource();
	    var path = btn.getBindingContext().getPath();  // like '/2'
	    var idx = parseInt( path.substr(1));
	    this.aSubProject.splice(idx,1);
        this.oSubProjectModel.setData( this.aSubProject);
	},

	onSubProjectRowAddPressed: function( evt ) {
	    var btn = evt.getSource();
	    var path = btn.getBindingContext().getPath();  // like '/2'
	    var idx = parseInt( path.substr(1));
	    this.aSubProject.splice(idx+1, 0, {info: "", limit: ''});
        this.oSubProjectModel.setData( this.aSubProject);
	},
	

	onSubProjectCancelButtonPressed: function( evt ) {
        this.oSubProjectDlg.close();
	},

	onLoadDefaultEmailTemplatePressed: function( evt ) {
	    var template = Config.getConfigure().DefaultEmailTemplate;
	    for (var key in template) {
	    	this.oProjectModel.setProperty("/" + key, template[key]);
	    }
	},
});

	return ControllerController;
});


