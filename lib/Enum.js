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
			Waiting:   "Waiting",  
			Approved :  "Approved",
			Rejected:  "Rejected",
			Canceled:  "Canceled"
		},

		ControlType: {
			Input: 'Input',
			Date:  "Date",
			List:  "List",
			Attachment: "Attachment",
			Number:  'Number',
			Check:    'Check',
			Radio:    'Radio'
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

		RegistrationSecurity : {
			Public: "Public",
			Protected: "Protected",
			Private: "Private"
		},

		RegistrationLimit: {
			No: 'No',
			OneProject: "OneProject",
			SubProject: "SubProject"
		},

		ActionFlag: {
			Submit: "Submit", Approve: "Approve", Cancel: "Cancel", Others: "Others"
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
				/*{name: "Save", icon: "sap-icon://save"},*/
				{name: "Cancel", type: "Reject",  icon: "sap-icon://sys-cancel"}
			],

			Waiting: [
				{name: "Cancel", type: "Reject", icon: "sap-icon://sys-cancel"},
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
			{mandatory: true, name: "Name", property: 'Name', type: 'Input', label: 'Name', tooltip: 'User Name, must be same as in ID card or passport'},
			{mandatory: true, name: "Id Or Passort", property: 'IdOrPassort', type: 'Input', label: 'Id Or Passort', 
				tooltip: 'For chinese use ID, for foreigner use Passport'},
			{mandatory: true, name: "Age", property: 'Age', type: 'Input', label: 'Age', tooltip: 'Age'},	
			{mandatory: true, name: "Phone", property: 'Phone', type: 'Input', label: 'Phone', tooltip: 'Phone Number'},	
			{mandatory: true, name: "Birthdate", property: 'Birthdate', type: 'Date', label: 'Birthdate', tooltip: 'Birthdate'},
			{mandatory: true, name: "TShirt Size", property: 'TshirtSize', type: 'List', label: 'TShirt Size', tooltip: 'TShirt Size',
				candidate: "XXXL;XXL;XL;L;M;S;XS;XXS"},
			{mandatory: true, name: "Club", property: 'Club', type: 'List', label: 'Club', tooltip: 'Club', 
				candidate: "None;SAP Runner Club - Shanghai;SAP Runner Club - Beijing;SAP Runner Club - Dalian"},
			{mandatory: true, name: "Department", property: 'Department', type: 'List', label: 'Department', tooltip: 'Department',
				candidate: "GSS;GCO;P&I;HR;GFA;IT;oCEO (Marketing, CA, GR, GPO PSD, GPO OEM…);Business Network;Others"},
			{mandatory: true, name: "Email", property: 'Email', type: 'Input', label: 'Email', tooltip: 'Email Address'},
			{mandatory: true, name: "Gender", property: 'Gender', type: 'List', label: 'Gender', tooltip: 'Gender', candidate: "Male;Female"},
			{mandatory: true, name: "Location", property: 'Location', type: 'List', label: 'Location', tooltip: 'Work Location',
				candidate: "Beijing;Shanghai;Dalian;Xi'an;Nanjing;Guangzhou;Shenzhen;Chengdu;HongKong;Taipei;Others" }
			]
	};
});
