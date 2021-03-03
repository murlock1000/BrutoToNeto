/**
 * Created on : 2021-03-03 15:30:32
 * Encoding   : UTF-8
 * 
 *
 * @author    @murlock1000 <https://github.com/murlock1000>
 */

var oboe ={
    workHours : 0,
    pensionPercentage : 0,
    toDisplay : true,

    init: function(){
       // console.log("initialising");
        this.initData();
        this.updateSettings();
    },
    //send message to currently open tab to update values
    updateTab : function(){
        chrome.tabs.query({active: true, currentWindow: true}, (tabs)=> {
            if(tabs[0].id !== undefined){
        //    console.log("sending update: ",this.workHours, " - ",this.toDisplay);
            chrome.tabs.sendMessage(tabs[0].id, {msg:'update',workHours:this.workHours, pensionPercentage:this.pensionPercentage, toDisplay:this.toDisplay});
            }
          });
    },

    //update settings when user changes them in the popup menu
    updateSettings : function(){
        
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=>{
                if(request.msg==="update"){
                    this.workHours=request.workHours;
                    this.pensionPercentage=request.pensionPercentage;
                    this.toDisplay = request.toDisplay;
                  //  console.log("updated");
                    this.updateTab();
                }
            }
        )
    },

    //when opening browser we save default values
    initSettings : function(){
        chrome.storage.sync.set({'workHours':0, 'pensionPercentage':0, 'toDisplay':true}, function(){
          console.log("Set settings to default values");
        });
    },

    //on new page load we listen for new page requests and send out the template and work values or stop the content script 
    templateMatching : function(websiteTags){
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=>{
                if(request.msg==="init"){

                    root=new URL(sender.tab.url).hostname;
                    if(websiteTags[root]!== undefined){
                        sendResponse({msg:"startup",data:[this.workHours,this.pensionPercentage,this.toDisplay],tags:websiteTags[root]});
                       // console.log(websiteTags[root]);
                    }else{
                     //   console.log("background: "+ (new URL(sender.tab.url).hostname)+" - "+request);
                        sendResponse("stop");
                    }
                }
                return true;
            }
        )
    },

    initData: function(){

        //retrieve website specific data
        const url = chrome.runtime.getURL('websiteTags.json');
        fetch(url)
            .then(response => response.json())
            .then(data => {this.templateMatching(data); //console.log("finished reading json.")
        }); 

        //retrieve user settings
        chrome.storage.sync.get(['workHours','pensionPercentage','toDisplay'], (result)=>{
          //  console.log("current value: "+result.workHours);
           if(result.workHours === undefined || result.pensionPercentage === undefined || result.toDisplay === undefined){ //if user has no predefined settings we set the default values
               this.initSettings();
           }else{
               this.workHours = result.workHours;
               this.pensionPercentage = result.pensionPercentage;
               this.toDisplay = result.toDisplay;
           }
        });
    }
}

oboe.init();