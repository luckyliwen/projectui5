sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/layout/GridData",
	"csr/lib/Config",
	"csr/lib/Enum",
	"csr/lib/Util",
	"csr/lib/FileUploaderExt",
	"csr/lib/RadioGroupExt",
	"csr/lib/CheckBoxExt",
	"csr/lib/LicenseAgreement"
], function(Controller, SimpleForm,GridData, Config, Enum,Util,FileUploaderExt, RadioGroupExt,CheckBoxExt,LicenseAgreement) {
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

		/**
		 * From the text to format as html content, now just replace the http://xx, https://  mailto:// as special mark
		 * @param {[type]} form  [description]
		 * @param {[type]} label [description]
		 * @param {[type]} text  [description]
		 */
		addHtmlToForm: function( form, label, text ) {
		    form.addContent( new sap.m.Label({text: label}));

			var content = Util.fmtContentAsHtml(text, "div");
		    form.addContent( new sap.ui.core.HTML({content: content}));
		},

		//create the simple form for the project header
		createProjectHeader: function(projectCfg) {
			//have case all detail information define as sub-project
			if ( !projectCfg.Location  && !this.projectCfg.StartDate && !this.projectCfg.StartTime
				&& !this.projectCfg.EndDate && !this.projectCfg.EndTime && 
			 !projectCfg.Deadline  && !projectCfg.Description && !projectCfg.Link)
				return null;

			var form = new SimpleForm({
				width: "100%",
				title: "Event " + projectCfg.Title + " Information",
				// layout: "ResponsiveGridLayout",
				// labelSpanXL: 4,
				// labelSpanL: 4,
			});

			//event and reg duration 
			if ( this.projectCfg.EventStartDateTime && this.projectCfg.EventEndDateTime ) {
				this.addTextToForm(form, "Event Duration", 
					Util.fmtDuration(this.projectCfg.EventStartDateTime, this.projectCfg.EventEndDateTime));
			}

			if ( this.projectCfg.RegStartDateTime && this.projectCfg.RegEndDateTime ) {
				this.addTextToForm(form, "Registration Duration", 
					Util.fmtDuration(this.projectCfg.RegStartDateTime, this.projectCfg.RegEndDateTime));
			}

			if (projectCfg.Location) {
				this.addTextToForm(form, "Location", this.projectCfg.Location);
				// form.addContent(new sap.m.Button({text: "Show at google map", icon: "sap-icon://map"}));
			}

			if (projectCfg.Description) {
				this.addHtmlToForm(form, "Description", this.projectCfg.Description);
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
			if ( this.projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject) {
				// if ( this.aSubProject == null) {
					if (this.projectCfg.SubProjectInfo) {
						this.aSubProject = JSON.parse( this.projectCfg.SubProjectInfo);			
					}
				// }
			}
		},
	
		getSubProjectFormCfg: function(projectCfg) {
		    if ( this.projectCfg.RegistrationLimit_Ext  == Enum.RegistrationLimit.SubProject && 
		    	this.aSubProject  && this.aSubProject.length) {
				var subPrj = {
					label: this.projectCfg.SubProjectTitle, bSubProject: true, 
					property: "SubProject",  mandatory: true,  type: Enum.ControlType.List
				};

				//candidate get from info
				var candidate = "";
				for (var i=0; i < this.aSubProject.length; i++) {
					candidate += this.aSubProject[i].info + ";";
				}
				subPrj.candidate = candidate;
				return subPrj;
			} else {
				return null;
			}
		},
		
	onSubProjectChanged: function( evt , oInfoControl) {
	    var selKey = evt.getSource().getSelectedKey();
	    if (selKey) {
	    	for (var i=0; i < this.aSubProject.length; i++) {
	    		if (selKey == this.aSubProject[i].info) {
	    			this.subProjectIndex = i;

	    			var subPrj = this.aSubProject[i];
	    			var info = "<b>Status</b>: ";
	    			info += subPrj.status;
	    			
	    			if (subPrj.startDate || subPrj.startTime) {
	    				info += "  <b>Start date & time</b>: " + 
	    					Util.fmtDateTimeSmart(this.projectCfg.StartDate, this.projectCfg.StartTime, subPrj.startDate,  subPrj.startTime);
	    			}

					if (subPrj.endDate || subPrj.endTime) {
	    				info += "  <b>End date & time</b>: " + 
	    					Util.fmtDateTimeSmart(this.projectCfg.EndDate, this.projectCfg.EndTime, subPrj.endDate, subPrj.endTime);
	    			}
	    			
	    			if (subPrj.location) {
	    				info += "  <b>Location</b>: " + subPrj.location;
	    			}

	    			//if description have hyper link, it will format automatically
	    			if (subPrj.description) {
	    				//new line or not depend on whether have previous information
	    				if (info.length > 30)
	    					info += "<br>";

    					info += "  <br><b>Description</b>: " + subPrj.description;	
	    			}

					if ( oInfoControl.setValue) {
						oInfoControl.setValue(info);	
					} else {
						oInfoControl.setContent( Util.fmtContentAsHtml(info, "div") );	
					}
	    			// oInfoControl.setTooltip(info);
	    		}
	    	}
	    } else {
	    	this.subProjectIndex = -1;
	    	if ( oInfoControl.setValue) {
	    		oInfoControl.setValue(info);	
	    		oInfoControl.setTooltip("");
	    	} else {
	    		//if html 
	    		oInfoControl.setContent(info);	
	    	}
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
		form.addContent( new sap.m.Input({value: "{/UserId}", placeholder: "Filled Automatically", enabled: false}));
		form.addContent( new sap.m.Input({value: "{/UserName}", placeholder: "Filled Automatically",  enabled: false}));

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
					var input = new sap.m.Input( {value: path, change: [this.onInputValueChanged,this]});
					if (cfg.tooltip) {
						input.setPlaceholder(cfg.tooltip);  
					} 
					form.addContent( input );
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

					//also add the subProject information depend on sub-Project selection changed
					if (cfg.bSubProject) {
						form.addContent(new sap.m.Label({text: "Sub-Project information"}));
						/*var oInfoCtrl = new sap.m.TextArea({rows: 1, editable: false,
							placeholder: "Select above list to see detail"});*/
						var oInfoCtrl = new sap.ui.core.HTML({content: "<div>Select above list to see detail</div>"});
						form.addContent(oInfoCtrl);
						select.attachChange( oInfoCtrl, this.onSubProjectChanged, this);
					}
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
				case Enum.ControlType.Agreement: 
					/*var agree = new LicenseAgreement({
						license: cfg.candidate,
						agreement: path
					});
					form.addContent(agree);*/

					var vbox = new sap.m.VBox({
						items: [
							new sap.m.TextArea({value: cfg.candidate, editable: false,
									rows: Util.fmtRowsByContent(cfg.candidate),
								 	width: "100%"}),
							new sap.m.CheckBox({selected: path, 
								select: [this.onInputValueChanged,this],
								text: "I have read and I accept the conditions" })
							/*new RadioGroupExt({value: path, candidate: "I Don't Agree;I Agree"})*/
						]
					});
					form.addContent(vbox);
					
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