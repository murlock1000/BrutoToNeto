/**
 * Created on : 2021-03-03 15:30:32
 * Encoding   : UTF-8
 *
 * @author    @murlock1000 <https://github.com/murlock1000>
 */

var oboe = {
  workHours : document.getElementById("workHours"),
  pensionPercentage : document.getElementById("pensionPercentage"),
  toDisplay : document.getElementById("toDisplay"),

  _this: this,
  init : function(){
    this.retrieveSettings();
    this.setupListeners();
  //  console.log("initialized");
  },
  
  //debugging func
  tester : function(){
    var htmlList = document.getElementById("idk");
    console.log(htmlList.textContent);

  },

  //send settings to background.js
  sendSettings : function(){
   //console.log("updating: ",this.toDisplay.value);
    chrome.extension.sendMessage({msg:'update',workHours:this.workHours.value, pensionPercentage:this.pensionPercentage.value, toDisplay:this.toDisplay.checked}, function(response) {
    });
  },

  //update stored settings
  updateSettings : function(){
    chrome.storage.sync.set({'workHours':this.workHours.value, 'pensionPercentage':this.pensionPercentage.value, 'toDisplay':this.toDisplay.checked}, function(){
      console.log("Values set to: "+'workHours'+this.workHours.value+ 'pensionPercentage'+this.pensionPercentage.value);
    });
  },

  //update user settings and send updated settings to background.js
  setupListeners : function(){
    this.workHours.onchange = ()=>{
      this.updateSettings();
      this.sendSettings();
    };

    this.pensionPercentage.onchange = ()=>{
      this.updateSettings();
      this.sendSettings();
    };

    this.toDisplay.onchange = ()=>{
      console.log("display changed into: ",this.toDisplay.checked);
      this.updateSettings();
      this.sendSettings();
    }
  },

  //when first open the extension we retrieve user settings and apply them
  retrieveSettings : function(){
    window.addEventListener('DOMContentLoaded', ()=>{
      chrome.storage.sync.get(['workHours','pensionPercentage','toDisplay'], (result)=>{
      //  console.log("current value: "+result.workHours);
     //   this.tester();
        if(result.workHours === undefined || result.pensionPercentage === undefined){ //if user has no predefined settings we set the default values
          this.updateSettings();
        }else{
          this.workHours.value = result.workHours;
          this.pensionPercentage.value = result.pensionPercentage;
          this.toDisplay.checked = result.toDisplay;
        }
      });
    });
  }

};

oboe.init();








