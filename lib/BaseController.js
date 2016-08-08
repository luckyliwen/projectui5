sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/layout/GridData",
	"csr/lib/Config",
	"csr/lib/Enum",
	"csr/lib/Util",
	"csr/lib/FileUploaderExt",
	"csr/lib/RadioGroupExt",
	"csr/lib/CheckBoxExt"
], function(Controller, SimpleForm,GridData, Config, Enum,Util,FileUploaderExt, RadioGroupExt,CheckBoxExt) {
	"use strict";

	/*
        Common base class for the controllers of this app containing some convenience methods
    */
	return Controller.extend("csr.lib.BaseController", {
		onInit : function() {
			//load the common librarys
			jQuery.sap.require('sap.m.Label');
			jQuery.sap.require('sap.m.Text');
			jQuery.sap.require('sap.m.Link');
			jQuery.sap.require('sap.m.DatePicker');
			jQuery.sap.require('sap.m.Input');
			jQuery.sap.require('sap.m.Button');
			jQuery.sap.require('sap.m.Column');

			//now all will need the projectId 
			this.projectId  = jQuery.sap.getUriParameters().get("projectId");

			this.oDateTimeFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance();
		},

		checkProjectId: function( evt ) {
		    if ( ! this.projectId) {
		    	Util.info("Please define the project ID by add ?projectId=xx in the URL. Or contact your system administrator.");
		    	return false;
		    } else {
		    	return true;
		    }
		},
		

		/**
		 * Convenience method for accessing the router in each controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resource model of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Convenience method to get the global model containing the global state of the app.
		 * @returns {object} the global Propery model
		 */
		getGlobalModel: function() {
			return this.getOwnerComponent().getModel("globalProperties");
		},

		
		fmtStatus: function( status ) {
		    if (status == Enum.Status.Approved) {
		    	return "Success";
		    } else if (status == Enum.Status.Rejected) {
		    	return "Error";
		    } else {
		    	return "None";
		    }
		},


		fmtBirthday: function( value ) {
		    if (!value)
		    	return "";
		    else {
		    	var d = new Date(value);
		    	var y = d.getFullYear();
		    	var m = d.getMonth() + 1;
		    	var day = d.getUTCDate(); 
		    	if (m<10) m = '0' + m;
		    	if (day < 10) day = '0' + day;
		    	return y + "-" + m + "-" + day;
		    }
		},
		
		//convert normal yyyy-mm-dd to 2016-02-13T10:39:50.207
		fmtDateToODataDate: function( value ) {
		    return value + "T00:00:00.000";
		},

		fmtTime: function( val ) {
		    if (val) {
		    	return this.oDateTimeFormatter.format(val);
		    } else {
		    	return "";
		    }
		},
		
		fmtUserHref: function( id ) {
			if (!id)
				return "";
			else 
		    	return "https://people.wdf.sap.corp/profiles/" + id;
		},

		setBusy: function(flag) {
		    this.getView().setBusy(flag);
		},

		addTextToForm: function( form, label, text ) {
		    form.addContent( new sap.m.Label({text: label}));
			form.addContent( new sap.m.Text({text: text}));
		},

		//create the simple form for the project header
		createProjectHeader: function(projectCfg) {
			if ( !projectCfg.Deadline  && !projectCfg.Description && !projectCfg.Link)
				return null;

			var form = new SimpleForm({
				width: "100%",
				title: projectCfg.Title,
				// layout: "ResponsiveGridLayout",
				// labelSpanXL: 4,
				// labelSpanL: 4,
			});

			if (projectCfg.Deadline) {
				this.addTextToForm(form, "Dead Line", this.projectCfg.Deadline);
			}
			if (projectCfg.Description) {
				this.addTextToForm(form, "Description", this.projectCfg.Description);
			}

			if (projectCfg.Link) {
				form.addContent( new sap.m.Label({text: "Url for more information"}));
				form.addContent(new  sap.m.Link({text:this.projectCfg.Link, href: this.projectCfg.Link }) );
			}
			return form;
		},

		/**
		 * add the extra property for the project configure, now for the RegistrationLimit
		 * @param {[type]} evt [description]
		 */
		addProjectCfgExtraProperty: function( evt ) {
		   	this.projectCfg.RegistrationLimit_Ext = Util.mapRegistrationLimitToEnum(this.projectCfg.RegistrationLimit);	
		},
	
		getSubProjectFormCfg: function(projectCfg) {
		    if ( projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject) {
				//label: '', tooltip: '', property: '' mandatory: true, type: [input, date, list,attachment], candidate: ['male', 'famel'] 		
				var subPrj = {
					label: "Sub Project",  bSubProject: true, 
					property: "SubProject",  mandatory: true,  type: Enum.ControlType.List
				};
				subPrj.candidate = projectCfg.SubProjectInfo;
				return subPrj;
			} else {
				return null;
			}
		},
		

	createRegisterForm: function(aFormCfg) {
		//then one by one to create the form
		var form = new SimpleForm({
			width: "100%",
			title: "My Registration",
			// labelSpanXL: 5,
			// labelSpanL: 5,
			// emptySpanXL: 1,
			// emptySpanL: 1,
			// emptySpanM: 1,
			// layout: "ResponsiveGridLayout"
		});
		//always show the SAP ID, name 
		form.addContent( new sap.m.Label({text: "Employee ID and Name"}));
		form.addContent( new sap.m.Input({value: "{/UserId}", enabled: false}));
		form.addContent( new sap.m.Input({value: "{/UserName}", enabled: false}));

		//label: '', tooltip: '', property: '' mandatory: true, type: [input, date, list,attachment], candidate: ['male', 'famel'] 
		//bSubProject: only used to control the sub-project selection
		for (var i=0; i < aFormCfg.length; i++) {
			var  cfg = aFormCfg[i];
			var label = new sap.m.Label({text:cfg.label, required: cfg.mandatory});
			if ( cfg.bSubProject) {
				label.setDesign( "Bold");  
			}
			if (cfg.tooltip) {
				label.setTooltip( cfg.tooltip);
			} 
			form.addContent( label);

			//by the type to define the real value
			var path = "{/" + cfg.property + "}";
			switch (cfg.type) {
				case Enum.ControlType.Input:
					form.addContent( new sap.m.Input( {value: path, change: [this.onInputValueChanged,this]}));
					break;
				case Enum.ControlType.Date:
					form.addContent( new sap.m.DatePicker({value: path,change: [this.onInputValueChanged,this]}));
					break;
				case Enum.ControlType.List:
					var select = new sap.m.Select({selectedKey: path, change: [this.onInputValueChanged,this]});
					//for the sub-project, need control the enable/disable also 
					if (cfg.bSubProject) {
						select.bindProperty("enabled", {
							path: "/Status",
							formatter: function( status ) {
							    if ( status == 'New' || status == "Drafted")
							    	return true;
							    else
							    	return false;
							}
						});
					}
					Util.addItemsToSelect(select, cfg.candidate, cfg.bSubProject);
					form.addContent( select);
					break;
				case Enum.ControlType.Attachment:
					var fileUploader = new FileUploaderExt({
						width: "400px",  
						selectFile: [ this.onAttachmentSelectChanged,this],
                    	useMultipart: false, sendXHR: true,
                    	fileName: path, 
                    	uploadComplete: [this.onUploadFileFinished,this],
                    	uploadAborted: [this.onUploadFileFailed,this]
					});
					//for the attachment type, just use the label (remove the whitespace)
					fileUploader.data('type', cfg.property);
					if (this.aUploader)
						this.aUploader.push(fileUploader);
					form.addContent( fileUploader);

					//for the attachment, also add one del button 
					var btn = new sap.m.Button({ icon :"sap-icon://delete",  
						press: [this.onAttachmentDelPressed,this],
						enabled: {
							path: "/" + cfg.property,
							formatter: function( data) {
							    return !!data;
							}
						}
						});
					btn.setLayoutData( new GridData({span: "XL3 L3 M3 S2"}));
					btn.data('property', cfg.property);
					btn.data("type", cfg.property);
					form.addContent(btn);
					break;

				case Enum.ControlType.Number:
					//!!for the type, now just use type to check whether is a number
					form.addContent( new sap.m.Input(
							{value: path,
							change: [this.onInputValueChanged,this]
						}));
					break;
				case Enum.ControlType.Check:
					//!!for the type, now just use type to check whether is a number
					/*form.addContent( new sap.m.CheckBox(
							{
								// selected: path
							selected: {
								"path": "/" + cfg.property,
							}
						}));*/

					form.addContent( new CheckBoxExt( { value: path}));
					break;

				case Enum.ControlType.Radio:	
					form.addContent( new RadioGroupExt(
							{
								value: path,
								candidate: cfg.candidate
							}
						) );
					break;

				default:
					console.error("Not support control type ", cfg.type);
					break;
			}
		}

		return form;
	},

	//some dummy function will be overwrite 
	onInputValueChanged: function( evt ) {},
	onAttachmentSelectChanged: function( evt ) {},
	onUploadFileFinished: function( evt ) {},
	onUploadFileFailed: function( evt ) {},
	onAttachmentDelPressed: function( evt ) {}
		
	});
});