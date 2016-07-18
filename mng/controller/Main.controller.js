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
		
		this.oDataModel = this.getModel();
		this.oDataModel.setUseBatch(false);

		this.oList = this.byId('projectList');
		this.oDetailPage = this.byId("detailPage");
		
		this.oProjectModel = new sap.ui.model.json.JSONModel();
		this.projectCfg = this.getDefaultProjectCfg();
		this.oProjectModel.setData( this.projectCfg);
		this.oProjectModel.setDefaultBindingMode("TwoWay");
		this.byId("projectForm").setModel(this.oProjectModel);

		this.oTable = this.byId("formTable");
		this.oFormModel = new sap.ui.model.json.JSONModel();
		this.aFormCfg = [];
		this.oFormModel.setDefaultBindingMode("TwoWay");
		this.oFormModel.setData( this.aFormCfg);
		this.byId("formTable").setModel(this.oFormModel);

		this.initList();
		//??
		gc = this; 
		gt = this.oTable;
		gl = this.oList;
	},

	fmtCandidate: function(type) {
	    if (type == 'List')
	    	return true;
	    else
	    	return false;
	},
	

	initList: function( evt ) {
		this.listItemTemplate = this.oList.removeAllItems()[0];
		this.freshList();
		// items ="{/Projects}"
	    //as we need refresh it, so we need create template  for it;
	},
	
	freshList: function( evt ) {
	    this.oList.bindItems("/Projects", this.listItemTemplate);
	},
	
	

	fmtProjectId: function( id ) {
	    return "ID: " + id;
	},
	
	getDefaultProjectCfg: function() {
	    return {
	    	AllowCancel: false,  Deadline: "",   Description: "",
	    	DisplayProjectInfoAtTop: true,    Form: "",
	    	Link: "",   MaxNum: 0,   MultipleEntry: false,  Title: "",
	    	ProjectId: ''
	    };
	},

	setDetailPageTitle: function( evt ) {
		if (this.projectCfg.ProjectId) {
	    	this.oDetailPage.setTitle("ID: " + this.projectCfg.ProjectId + "  " + this.projectCfg.Title);
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
		//
		var count  = 19; //now 20 free attr
		var aFreeAttr = [];
	    for (var i=0; i < count; i++) {
	    	aFreeAttr.push(true);
	    }

	    //for the attachment, now use FileName, can use same ??

	    //first loop just find which AttrXX has used, to create the real mapping
	    for ( i=0; i < this.aFormCfg.length; i++) {
	    	var property = this.aFormCfg[i].property;
	    	if ( property  && property.indexOf('Attr') == 0) {
	    		//by the index can know which one taken
	    		var idx = property.substr(4);
	    		idx = parseInt(idx);

	    		aFreeAttr[idx] = false;
	    	}
	    }

	    //then just find the empty property and assign
	    for ( i=0; i < this.aFormCfg.length; i++) {
	    	property = this.aFormCfg[i].property;
	    	var foundIdx = "";

	    	if (!property) {

	    		for (var freeIdx =0; freeIdx < count; freeIdx++) {
	    			if ( aFreeAttr[ freeIdx]) {
	    				aFreeAttr[ freeIdx] = false;
	    				foundIdx = freeIdx;
	    				break;
	    			}
	    		}
	    		if (foundIdx === "") {
	    			alert("Don't have enough attribute, please contact Lucky Li");
	    		}
	    		this.aFormCfg[i].property = 'Attr' + foundIdx;
	    	}
	    }
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
	    		that.freshList();
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
		//??why need use string
		mData.MaxNum = "" + mData.MaxNum;

		this.assignPropertyToFormCfg();
		mData.Form = JSON.stringify( this.aFormCfg);

	    if (bCreate) {
	    	//for new Registration, 
			this.oDataModel.create("/Projects", mData, mParam);
	    } else {
	    	var url = "/Projects(" + this.projectCfg.ProjectId + "L)";
	    	this.oDataModel.update(url, mData, mParam);
	    }

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
		var newHref = href.replace('/mng/',  '/' + newApp + '/');
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
		var item = {property: '', type: 'Input', label: '', tooltip: '', candidate:''};
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
	}
});

	//global data 

	return ControllerController;
});


