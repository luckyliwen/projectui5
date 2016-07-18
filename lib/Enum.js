sap.ui.define([], function() {
	"use strict";

	//some common value 
	return {

		GeneralSolution: "Please contact system administrator",

		//status of the resiter
		Status: {
			New:     "New",   //just start to edit
			Drafted: 'Drafted',
			Submitted: "Submitted",
			Approved :  "Approved",
			Rejected:  "Rejected",
			Canceled:  "Canceled"
		},

		ControlType: {
			Input: 'Input',
			Date:  "Date",
			List:  "List",
			Attachment: "Attachment"
		},

		RegisterAction: {
			Save: 'Save',
			Submit: 'Submit',
			Cancel: 'Cancel'
		},

		UpdateFlag: {
			RequestJoin: 'rj',  //request to join team
			New:          'new',  //new registration,
			Approve:      "approve"
		},

		//??later need considereate support the cancel and delete by configure
		RegisterActionButton: {
			New: [
				{name: "Submit", type: "Accept",  icon: "sap-icon://activate"},
				{name: "Save", icon: "sap-icon://save"},
			],

			Drafted: [
				{name: "Submit", type: "Accept", icon: "sap-icon://activate"},
				{name: "Save", icon: "sap-icon://save"},
			],

			Submitted: [
				{name: "Save", icon: "sap-icon://save"},
				{name: "Cancel", type: "Reject",  icon: "sap-icon://sys-cancel"},
			],

			Approved: [
				{name: "Cancel", type: "Reject", icon: "sap-icon://sys-cancel"},
			],

			Rejected: [
				{name: "Submit", type: "Accept", icon: "sap-icon://activate"},
				{name: "Save", icon: "sap-icon://save"},
			],

			Canceled: [],
		},

		MoveDirection: {
			Top: 'Top', Up: 'Up', Down: 'Down', Bottom: 'Bottom'
		},

		//name:  show to user as command, 
		CommonItems: [
			{name: "Name", property: 'Name', type: 'Input', label: 'Name', tooltip: 'User Name, must be same as in ID card or passport'},
			{name: "Id Or Passort", property: 'IdOrPassort', type: 'Input', label: 'Id Or Passort', 
				tooltip: 'For chinese use ID, for foreigner use Passport'},
			{name: "Age", property: 'Age', type: 'Input', label: 'Age', tooltip: 'Age'},	
			{name: "Birthdate", property: 'Birthdate', type: 'Date', label: 'Birthdate', tooltip: 'Birthdate'},
			{name: "TShirt Size", property: 'TshirtSize', type: 'List', label: 'TShirt Size', tooltip: 'TShirt Size',
				candidate: "XXXL;XXL;XL;L;M;S;XS;XXS"},
			{name: "Club", property: 'Club', type: 'List', label: 'Club', tooltip: 'Club', 
				candidate: "None;SAP Runner Club - Shanghai;SAP Runner Club - Beijing;SAP Runner Club - Dalian"},
			{name: "Department", property: 'Department', type: 'List', label: 'Department', tooltip: 'Department',
				candidate: "GSS;GCO;P&I;HR;GFA;IT;oCEO (Marketing, CA, GR, GPO PSD, GPO OEM…);Business Network;Others"},
			{name: "Email", property: 'Email', type: 'Input', label: 'Email', tooltip: 'Email Address'},
			{name: "Gender", property: 'Gender', type: 'List', label: 'Gender', tooltip: 'Gender', candidate: "Male;Female"},
			{name: "Location", property: 'Location', type: 'List', label: 'Location', tooltip: 'Work Location',
				candidate: "Beijing;Shanghai;Dalian;Xi'an;Nanjing;Guangzhou;Shenzhen;Chengdu;HongKong;Taipei;Others" }
			]
	};
});
