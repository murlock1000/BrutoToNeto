/**
 * Created on : 2021-03-03 15:30:32
 * Encoding   : UTF-8
 * Description:
 * Converts bruto payments into neto on sites described in websiteTags.json
 *
 * @author    @murlock1000 <https://github.com/murlock1000>
 */



var oboe ={

    //variables
    workValues:{
        0:0,
        1:1,
        2:0.5
    },
    pensionValues:{
        0:0,
        1:2.1,
        2:3
    },
    workHours : 0,
    pensionPercentage : 0,
    toDisplay : true,
    tags : {},
    netoTag: 'div',//'oboeDiv',
    netoClass: 'oboe',
    netoWrapperClass : 'oboewrapper',
    netoTextClass : 'oboetext',

    
    init: function(){
       // console.log("running on website");
        this.initData();
    },
    
    //functions

    //algorithm based on www.finansistas.net/atlyginimo-skaiciuokle bruto to neto calculator.
    calc : function(data){
        var bruto = data['bruto'];
        var work = data['workability'];
        var pension = data['pension'];
        var c1R3 = (642);
        var c1O28 = (0.2);
        var c1O29 = (0.0698);
        var c1O30 = (0.1252);
        var c1O6 = (((400) - (((0.18) * (((bruto) - (c1R3)))))));
        var c1D29 = (((bruto) * (c1O29)));
        var c1C30 = (c1O30);
        var c1D30 = (((bruto) * (c1C30)));
        var c1Z40 = (((pension===2.4) ? (0.024) : (0.03)));
        var c1O9 = (((((c1O6) < (0))) ? (0) : (c1O6)));
        var c1O11 = (((((bruto) <= (c1R3))) ? (400) : (c1O9)));
        var c1O13 = (((work===0) ? (c1O11) : ((work===0.5) ? (645) : (600))));
        var c1O17 = (((((c1O13) > (bruto))) ? (bruto) : (c1O13)));
        var c1Z39 = (((pension===0) ? (0) : (c1Z40)));
        var c1D28 = (((((bruto) - (c1O17))) * (c1O28)));
        var c1O39 = (((bruto) * (c1Z39)));
        var c1D39 = bruto - c1D28 - c1D29 - c1D30 - c1O39; //neto
        return c1D39

    },
    //bruto to neto conversion algorithm
    convert : function(bruto){
        st={};
        st['bruto'] = parseFloat(bruto);//bruto
        st['workability'] = this.workValues[this.workHours];//workability
        st['pension'] = this.pensionValues[this.pensionPercentage];//pension
        return ("Neto: "+(this.calc(st)).toFixed(2)+" EUR");
    },

    createNetoCapsule : function(bruto){
        var netoCapsule = document.createElement(this.netoTag);
        netoCapsule.className = this.netoClass;

        //creating a wrapper to combat overflow:hidden on some sites
        netoWrapper = document.createElement("span");
        netoWrapper.className = this.netoWrapperClass;
        netoCapsule.appendChild(netoWrapper);

        //creating neto tooltip and storing it inside netoWrapper
        netoText = document.createElement("span"); 
        netoText.className = this.netoTextClass;
        netoText.textContent = this.convert(bruto);
        netoWrapper.appendChild(netoText);

        return netoCapsule;
    },

    insertNeto : function(node, bruto){ //node ->brutoNode

        var match = node.data.match(bruto);

        if (match === null) {
            return false;
        }

        //isolating bruto text out of the node by splitting at the start and end of match
        var brutoNode = node.splitText(match.index);
        brutoNode.splitText(match[0].length); 

        //encapsulate new bruto node with our own net tooltip.
        var netoCapsule = this.createNetoCapsule(bruto);
        netoCapsule.appendChild(brutoNode.cloneNode(true));
        brutoNode.parentNode.replaceChild(netoCapsule, brutoNode);
    },

    //recursively traverse children of root node to find text element with bruto
    addNeto : function(node, bruto){

        //if the node is a textNode try matching bruto to it
        if (node.nodeType === 3) {
            if (node.data.replace(/(\s)/g, '') != '') {
                this.insertNeto(node, bruto);
            }
        }
        //if the node is an element, has children, does not contain tag script/style, is not an element already created by us, we traverse its children with addNeto  
        else if ((node.nodeType === 1) &&
            node.childNodes &&
            !/(script|style)/i.test(node.tagName) &&
            !(node.className === this.netoTextClass) && !(node.className === this.netoClass)) 
            {
            for (var i = 0; i < node.childNodes.length; i++) {
                this.addNeto(node.childNodes[i], bruto);
            }
        }   
    },

    //match bruto payments in text
    extractBruto : function(brutoElement){
        textElement = brutoElement.textContent;
        matches = textElement.match(/\d*[,.]\d+|\d+/g); //match floats from text  
        return matches;
    },

    //check if payment is in bruto or already converted to neto
    containsBruto : function(node){
        for (var i = 0; i < this.tags["brutoSigns"].length; i++){
            if(node.textContent.includes(this.tags["brutoSigns"][i])){
                return true;
            }
        }
        return false;
    },

    findBruto : function(){ //websites display
        if (this.tags["rootType"]==="id"){
            node = document.getElementById(this.tags["root"]); //get root object by id
            if(this.containsBruto(node)){
                var bruto = this.extractBruto(node);
                for (let i=0; i<bruto.length;i++){
                    this.addNeto(node, bruto[i]);
                }
                
            }
        }else{
           // console.log("reading nodes by className");
            nodes = document.getElementsByClassName(this.tags["root"]); //root objects of payments by class names
            for(let item of nodes){
               // console.log("checking item: ",item);
                if(this.containsBruto(item)){
                  //  console.log("item contains bruto!");
                    var bruto = this.extractBruto(item);
                    for (let i=0; i<bruto.length;i++){
                        this.addNeto(item, bruto[i]);
                    }
                }
            }
        }     
    },

    //remove neto capsules from page
    removeNeto : function(){
        var capsules = document.querySelectorAll(this.netoTag + '.' + this.netoClass);
    
            for (var i=0; i< capsules.length; i++) {
                var capsuleNode = capsules[i];
                var parentNode  = capsuleNode.parentNode;

                parentNode.replaceChild(capsuleNode.childNodes[1], capsuleNode);
                parentNode.normalize();
            }
      //  console.log("deleted");
    },

    //listen to updates from background.
    updateSettings : function(){
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=>{
                if(request.msg==="update"){

                    if(this.workHours!==request.workHours || this.pensionPercentage!==request.pensionPercentage){ //if settings changed and we are displaying - reset display with updated values
                        this.workHours=request.workHours;
                        this.pensionPercentage=request.pensionPercentage;
                        if(this.toDisplay){
                            this.removeNeto();
                            this.findBruto();
                        }
                    }

                    if(this.toDisplay && !request.toDisplay){ //turn off display
                        this.toDisplay = request.toDisplay;
                        this.removeNeto();
                    }else if(!this.toDisplay && request.toDisplay){ //turn on display
                        this.toDisplay = request.toDisplay;
                        this.findBruto();
                    }
                    
                   // console.log("updated: ",request.workHours,"-",this.pensionPercentage,"-",this.toDisplay);
                }
            }
        )
    },


    initData: function(){
        chrome.runtime.sendMessage({msg:"init"},(response)=>{
            if(response.msg==="startup"){ 
                this.workHours=response.data[0];
                this.pensionPercentage=response.data[1];
                this.toDisplay=response.data[2];
                this.tags=response.tags;
              //  console.log("setup content script complete");
              //  console.log(this.tags);
                if(this.toDisplay===true){
                    this.findBruto(); //start content
                }
                this.updateSettings(); //start listening for data updates from popup menu
            }else{
                return 0;
            }
        });
    }
}

oboe.init();

