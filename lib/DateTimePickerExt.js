sap.ui.define([
    "./Util",
    "sap/m/DateTimePicker"
], function(Util, DateTimePicker) {
    "use strict";

    /**
     * Because now DateTimePicker will store the AM/PM in local language, which will cause issue: 
     *     when get the date value by new Date(picker.getDateValue()) it will cause error because the local character 
     *     such as 上午 can't support 
     * So We will store the Date.getTime() as string then parse it back
     */
    var DateTimePickerExt = DateTimePicker.extend("csr.lib.DateTimePickerExt", {
    metadata : {
        properties : {
            'timeValue'  : {type:"string", defaultValue: "", bindable : "bindable"},
        },
    },

    renderer : "sap.m.DateTimePickerRenderer"
});

    DateTimePickerExt.prototype.init = function( evt ) {
        DateTimePicker.prototype.init.apply(this, arguments);
        this.attachChange(function(oEvent) {
            var date = this.getDateValue();
            this.setProperty('timeValue', date.getTime());
        });
    }
    

    DateTimePickerExt.prototype.setTimeValue = function(value) {
        if (value) {
            this.setDateValue( Util.getDateFromString(value));
        }
        this.setProperty('timeValue',  value, false);        
    }

   
    return DateTimePickerExt;
});