sap.ui.define([
    "sap/m/VBox",
    "sap/m/TextArea",
    "./RadioGroupExt"
], function(VBox, TextArea, RadioGroupExt) {
    "use strict";
    var aAnswer = [
        "I agree",
        "I don't agree"
    ];

    var LicenseAgreement = VBox.extend("csr.lib.LicenseAgreement", {
    metadata : {
        properties : {
            'license'  : {type:"string", defaultValue: "", bindable : "bindable"},
            'agreement'  : {type:"boolean", defaultValue: "false", bindable : "bindable"}
        },
    },

    renderer : "sap.m.VBoxRenderer"
});

    LicenseAgreement.prototype.setLicense  = function(text) {
        this._oTextArea.setValue(text);
        this._oTextArea.setRows( Util.fmtRowsByContent( text) );
    };

    LicenseAgreement.prototype.init = function() {
        this._oTextArea = new TextArea({width: "100%"});
        this._oRadioGroup = new RadioGroupExt({
            candidate: aAnswer.join(";"),
            value: aAnswer[1],
            change: [ this.onRadioGroupChanged, this]
        });
        this.addItem(this._oTextArea);
        this.addItem(this._oRadioGroup);
    };

    LicenseAgreement.prototype.onRadioGroupChanged = function( evt ) {
        var value = evt.getParameter("value");
        var idx = aAnswer.indexOf(value);
        this.setProperty("agreement", idx ==0 ? true : false);
    };

    return LicenseAgreement;
});