sap.ui.define([
    "sap/m/CheckBox",
    "./Util"
], function(CheckBox, Util) {
    "use strict";

    //!!as the value is not boolean, and when add the formatter, it can't set to TwoWay, so add a extension
    
    var CheckBoxExt = CheckBox.extend("csr.lib.CheckBoxExt", {
        metadata : {
            properties : {
                'value'  : {type:"string", defaultValue: "", bindable : "bindable"},
            },
        },

            renderer : "sap.m.CheckBoxRenderer"
        });

    CheckBoxExt.prototype.setValue = function(value) {
        var b = Util.fmtBoolean(value);
        this.setSelected( b );
    };

    //auto register event 
    CheckBoxExt.prototype.init = function() {
        var that = this;
        this.attachSelect( function( evt) {
            var value = this.getSelected() ? 'true' : 'false';
            this.setProperty('value', value);
        });
    };
    
    return CheckBoxExt;
});