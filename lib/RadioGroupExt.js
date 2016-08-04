sap.ui.define([
    "sap/m/HBox",
    "sap/m/RadioButton",
], function(HBox, RadioButton) {
    "use strict";
    var s_groupNameIndex = 0; 

    var RadioGroupExt = HBox.extend("csr.lib.RadioGroupExt", {
        metadata : {
            properties : {
                'candidate': {type:"string", defaultValue: "", bindable : "bindable"},
                'value'  : {type:"string", defaultValue: "", bindable : "bindable"},
            },
        },

        renderer : "sap.m.HBoxRenderer"
    });

    RadioGroupExt.prototype.setValue = function(value) {
        //only when the radio button create need update
        var aRadio = this.getItems();
        for (var i=0; i < aRadio.length; i++) {
            if ( value == aRadio[i].getText()) {
                aRadio[i].setSelected(true);
                break;
            }
        }
        this.setProperty('value', value);
    };
    
    RadioGroupExt.prototype.setCandidate = function( value ) {
        this.removeAllItems();
        var aValue = value.split(";");
        var sGroupName = 'GroupName_' + s_groupNameIndex++;
        var bMatchedOne = false;
        for (var i=0; i < aValue.length; i++) {
            var item = aValue[i].trim();
            var radio = new RadioButton({
                text: item, 
                selected: this.getValue() == item,
                select:  [this.onSelectedChanged, this], 
                groupName: sGroupName
            });
            if ( this.getValue() == item)
                bMatchedOne = true;

            //now add to items
            this.addItem( radio);
        }

        if (!bMatchedOne) {
            if (this.getItems().length > 0)
                this.getItems()[0].setSelected( true );
        }
    };


    RadioGroupExt.prototype.onSelectedChanged = function(evt) {
        var source = evt.getSource();
        this.setProperty('value', source.getText());
    };
    
    return RadioGroupExt;

});