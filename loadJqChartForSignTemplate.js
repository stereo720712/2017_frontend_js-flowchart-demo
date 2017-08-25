
/*
    Sean ,Define: get Template json and draw it .

step 1. call ajax to get sign template json object
step 2. call parse function to get chart json data
     2.1 if result is not success  return "" else do next
     2.2 get node List and path List (Json Object) 
     2.3 find start node all data  you need to draw ()
     2.4 find start node inputs intput list (those nodes whom comes to start nodes should be zero)
     (  think big step:1.get a node data , 2.get inputs node list, 3.get outputs node list , 4.get outputs path list )
step3. call flowchart api to draw
end 

*/
   const API_BASE_URL = "CallSignTempleteFlow.ashx"+"?template_code=" ;

 //Const JSON KEY  
  const J_TYPE_CODE         = 'typeCode';
  const J_LINK_ID                = "linkID";
  const J_NODEID                = "nodeID";
  
  const J_OPERAOTRS       = "operators";
  const J_LINKS                  = "links";
  const J_PROPERTIES       = "properties";
  const J_TITLE                   = "title";
  const J_INPUTS               = "inputs";
  const J_OUTPUTS           = "outputs";
  const J_TOP                     = "top";
  const J_LEFT                   = "left";

  const J_FROM_OPERATOR         = "fromOperator";
  const J_FROM_CONNECTOR    = "fromConnector";
  const J_TO_OPERATOR               = "toOperator";
  const J_TO_CONNECTOR          = "toConnector";
  const J_FCONDITION                 = "fCondition";
  const J_LABEL                              = "label";
 
  const ERROR_MESS_1             =  "资料不足,暂无流程图显示";

  const DEFAULT_CHART_WIDTH = 200;
  const DEFAULT_CHART_HEIGHT =200;

   var xmlHttp = false;
  var node＿sub_level_outputs_node_list = [];
  //var temp_current_inputs_node_list   = [];// nodes list whom come to current nodes  (be a list , it may so much nodes come to one nodes)
  var flowChartJson = {}; // final finish to return
    
 // initial flowchat json field
  flowChartJson[J_OPERAOTRS] = {};
  flowChartJson[J_LINKS] = {};


  var widthUnit               = 153 ;// one node level width base distance
  var heightUnit              = 135; //

  //node initial location
  var topInitial = 20;
  var leftIntital = 5; 

    //cout for use to count location
  var total_width_level_count = 0 ; //node width level,start node level location is 0
  var temp_height_level_count = 0;  //every temp height level in the width level
  var previousHeightCount = 0;// height count highest final

 function jsonArrayCopy(jarrPut,jArrToCopy){
 for (var i = 0; i < jArrToCopy.length; i++) {
    jarrPut.push(jArrToCopy[i]);
 }
}//jsonArrayCopy


  // remove the path @ pathList
  function removePathListFromDefaultList(needRemovePathList,pathLsitToRemove){

      for(var j =0;j<needRemovePathList.length;j++)
      {
          var pathID = needRemovePathList[j][J_LINK_ID];
          for (var i = 0; i < pathLsitToRemove.length; i++) {
                if (pathLsitToRemove[i][J_LINK_ID] == pathID) 
                {
                  pathLsitToRemove.splice(i,1);
                  break;
                }//if
          }//for
      }//for
  } //removeTempPathFromList

  
 function removeNodeListFromDefaultList(tempRemoveNodeList,defaultNodeListToRemove)
      {
          for (var i = 0; i < tempRemoveNodeList.length; i++) {
              
                  for (var j = 0; j < defaultNodeListToRemove.length; j++) {
                  
                      if (defaultNodeListToRemove[j][J_NODEID] == tempRemoveNodeList[i][J_NODEID]) 
                      {
                          defaultNodeListToRemove.splice(j,1);
                          break;
                      }
                  }//for

          }//for

      }//removeNodeFromDefaultList

      
    function removeNodeFromDefaultList(node,defaultNodeList){
        for (var i = 0; i < defaultNodeList.length; i++) {
          if(defaultNodeList[i][J_NODEID] == node[J_NODEID]){
             defaultNodeList.splice(i,1);
             break;
          }
        }//for
    }//removeNodeFromDefaultList

     //add node
          function addNodeToChart(node,chartJsonData,top,left)
          {
          
            var nodeID = node[J_NODEID];
            chartJsonData[J_OPERAOTRS][nodeID] = {};
            chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES] = {};
            chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES][J_TITLE] = node[J_TITLE];
          
            if (node[J_INPUTS] === undefined) 
            {
              chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES][J_INPUTS] = {};
            }else {
                chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES][J_INPUTS] = node[J_INPUTS];
            }
            
            if (node[J_OUTPUTS] === undefined) 
            {
              chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES][J_OUTPUTS] = {};
            }else {
              chartJsonData[J_OPERAOTRS][nodeID][J_PROPERTIES][J_OUTPUTS] = node[J_OUTPUTS];
            }
            chartJsonData[J_OPERAOTRS][nodeID][J_TOP] = top;

            chartJsonData[J_OPERAOTRS][nodeID][J_LEFT] = left;


          }//addNodeToChart


  //add output path
        function addOutputPathLitToChart(outputsPathList,flowChartJsonData){
              
            while(outputsPathList.length > 0){
                var tpath = outputsPathList[0];
                var pathID = tpath[J_LINK_ID];
                flowChartJsonData[J_LINKS][pathID] = {};
                flowChartJsonData[J_LINKS][pathID][J_FROM_OPERATOR]   = tpath[J_FROM_OPERATOR];
                flowChartJsonData[J_LINKS][pathID][J_FROM_CONNECTOR]  = tpath[J_FROM_CONNECTOR];
                flowChartJsonData[J_LINKS][pathID][J_TO_OPERATOR]     = tpath[J_TO_OPERATOR];
                flowChartJsonData[J_LINKS][pathID][J_TO_CONNECTOR]    = tpath[J_TO_CONNECTOR];
                outputsPathList.splice(0,1);

            }//
        }//addOutputPath


/*
    function set_node_OutputPath_and_OuptputNode_jsonArr 
  Define : Set a node's output path list and output node list from source node and path list

  store the path Array and nodes array where fromOperator is the node 
  And add the "inputs array","outputs array" for the output node.
  PS......start node no "inputs array" ,and still not sure how add inputs array
  And add "from connector" and "to connector" property to the output path

  */
  function set_node_OutputPath_and_OuptputNode_jsonArr(node,sourcePathList
    ,sourceNodeList,outputsPathList,outputsNodeList)
  { 

     for (var i=0;i<sourcePathList.length;i++) {
            
            if (sourcePathList[i][J_FROM_OPERATOR] == node[J_NODEID]) 
            {
              //2.1find path start from  node
              var newOutputPath = sourcePathList[i];
                //not add the path now ,need to add "fromConnector" and "toConnector" property
                for (var j = 0; j < sourceNodeList.length; j++) 
                {
                  if(sourceNodeList[j][J_NODEID] == newOutputPath[J_TO_OPERATOR])
                  {
                    //2.2 find node  go from start node
                    var outputNode = sourceNodeList[j];
                    //2.3 set outpath "from connector"  it map : node's outputs array id
                     newOutputPath[J_FROM_CONNECTOR] = outputNode[J_NODEID];//set it as output node's id

                     //2.4 set current node output array where output id = output node id, output label set to output path condition
                     node[J_OUTPUTS][outputNode[J_NODEID]] = {};//set output id
                     node[J_OUTPUTS][outputNode[J_NODEID]][J_LABEL] = newOutputPath[J_FCONDITION]; //set the node outputs arrray content .                     

                     var output_node_input_id = node[J_NODEID];
                     //2.5 set output path "toConnector" to current node id 
                     newOutputPath[J_TO_CONNECTOR] = output_node_input_id;//output node's input'
                     //将output path "to connector "设定成前一输出节点id 
                     //here , output node input id,set to from node ID
                      //Set the output node inputs arr
                      
                      //2.6 set the output node's input id to current node id , label set ""
                      if (outputNode[J_INPUTS] === undefined) {
                       outputNode[J_INPUTS] = {} 
                     }
                      outputNode[J_INPUTS][output_node_input_id] = {};
                      outputNode[J_INPUTS][output_node_input_id][J_LABEL] = "";//node[J_TITLE];

                      //2.7 add path and node to temp list
                      outputsPathList.push(newOutputPath);
                      outputsNodeList.push(outputNode);

                    break;
                  }//if
                }//for node loop end
            }// if
        }//for


  }//set_start_node_OutputPath_and_OuptputNode_jsonArr



//Step1.
function getSignTempleteDrawData(templateCode) {
  
    //var dataToDraw; // data receive to draw
          try {
            xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e2) {
                xmlHttp = false;
            }
        }

        if (!xmlHttp && typeof XMLHttpRequest != 'undefined') 
        {
            xmlHttp = new XMLHttpRequest();
        }
       var URL_LOADING_SIGN_TEMPLATE_DATA  = API_BASE_URL + templateCode;

         xmlHttp.open("post", URL_LOADING_SIGN_TEMPLATE_DATA, true);
         xmlHttp.onreadystatechange = callback_getSignTempleteDrawData;
         xmlHttp.send(null);

  }//getSignTempleteDrawData

  //Step2 
    //parse template json to final chart json   
function parse_Sign_To_Chart_Json(data) 
{ // sign template json data to draw json data 

 

  var currentNode = null; // the temp node operate now 
  var temp_current_outputs_node_list  = [];//nodes list whom current nodes go to other list
  var temp_current_path_outputs_list  = [];//temp store current node path to go other nodes.
  var need_Remove_Path_Temp_List   = [];//temp record the path can be removed 
  
  var getResult = data["result"];

      if (getResult !== "success") 
      {
          return "";
      }
   
      var nodeList = data["nodeList"];
      var pathList = data["pathList"];
      data = {}; // clear data 
      
      //1.find start node (typeCode = C001)
      for(var i = 0; i < nodeList.length;i++)
      {
         if(nodeList[i][J_TYPE_CODE]== 'C001'){
              currentNode = nodeList[i];
              nodeList.splice(i,1);
            break;
         }//if 
      }//for
      //find start node (typeCode = C001) end
      if (currentNode == null) { return "";}

      //2.add current node outputs json define.
      currentNode[J_OUTPUTS] = {};

      //3.add current node  outputs json define. (inputs node will defined @ set output node array)
      set_node_OutputPath_and_OuptputNode_jsonArr(currentNode,pathList
    ,nodeList,temp_current_path_outputs_list,temp_current_outputs_node_list);

      //. add the start node and the path data to chart json object
        //.1 add node
        addNodeToChart(currentNode,flowChartJson,topInitial,leftIntital);
        //.2 add output path
        addOutputPathLitToChart(temp_current_path_outputs_list,flowChartJson);
     

      //remove those pathes found at 2. where fromOperator is start node
      removePathListFromDefaultList(temp_current_path_outputs_list,pathList);
      temp_current_path_outputs_list = [];
      // remove those pathes found from default path list where fromOperator is start node end
     // removeNodeListFromDefaultList(temp_current_outputs_node_list,nodeList);
      
      previousHeightCount = 1;
      total_width_level_count = 0;
          // try save all level group nodes array .(path list need ???)
          var testCount = 0;

        while(nodeList.length > 0)
        { 
          //recurcive
           var currentNodeList = temp_current_outputs_node_list;
           temp_current_outputs_node_list = [];
            total_width_level_count++;
            temp_height_level_count = 0;

           while(currentNodeList.length > 0 )
           {
              currentNode = currentNodeList[0];
              currentNode[J_OUTPUTS] = {};

               // because of multi input cause repeat output node ,check if node in 
              //data first
              if(flowChartJson[J_OPERAOTRS][currentNode[J_NODEID]] !== undefined) { 
                   currentNodeList.splice(0,1);
                   continue;
              }
              set_node_OutputPath_and_OuptputNode_jsonArr(currentNode,pathList,nodeList,
                temp_current_path_outputs_list,temp_current_outputs_node_list);  
            
              currentNodeList.splice(0,1);
                  
                  var tempTop = temp_height_level_count*heightUnit+topInitial;
                  var tempLeft = total_width_level_count*widthUnit+leftIntital;
                addNodeToChart(currentNode,flowChartJson,tempTop,tempLeft);
                temp_height_level_count++;
                removeNodeFromDefaultList(currentNode,nodeList);
              
            
           }//while currentNodeList.length > 0

            if (temp_height_level_count>previousHeightCount) 
            { previousHeightCount = temp_height_level_count;}// for caculate total height use

            if (temp_current_path_outputs_list.length > 0) 
            {
                 addOutputPathLitToChart(temp_current_path_outputs_list,flowChartJson);
                  removePathListFromDefaultList(temp_current_path_outputs_list,pathList);
                  temp_current_path_outputs_list = [];
            }//temp_current_path_outputs_list.length > 0
            //removeNodeListFromDefaultList(currentNodeList,nodeList);
         
            if (temp_current_outputs_node_list.length == 0 && nodeList.length > 0) 
            {
               nodeList = [];
            }
        }//while  nodeList.length > 0

      return flowChartJson;

} //parse_Sign_To_Chart_Json


    //Step3
  function draw(data) {
  
     var $flowchart = $('#flowChart');
 
      if(data == ""){
            //do error execute
              var styleStr = "width:"+100+"%"+";"+ "height:"+50+"px"+";";
              document.getElementById('flowChart').setAttribute("style",styleStr);
            var errorMess = ERROR_MESS_1;
            $flowchart.html("<h3>"+ errorMess + "</h3>");
        }//error
        else 
        {
              chartTotalWidth = (widthUnit*(total_width_level_count))+leftIntital+100;
              chartTotalHeight = (heightUnit*previousHeightCount)+topInitial;
              var tempWidthStr = "width:"+chartTotalWidth+"px";
              var tmepHeightStr = "height:"+chartTotalHeight+"px";
              var styleStr = "width:"+chartTotalWidth+"px"+";"+ "height:"+chartTotalHeight+"px"+";";
              document.getElementById('flowChart').setAttribute("style",styleStr);
    // add set flowchart width and height by node's width and height
   
    $flowchart.flowchart(
    {
      data:data,
      canUserEditLinks:false,
      canUserMoveOperators:true
    }
    );

        }//else success

  } //draw

  function callback_getSignTempleteDrawData() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          var returnValue = xmlHttp.responseText;
          if (returnValue != null && returnValue != "" && returnValue != undefined) {
                var data = parse_Sign_To_Chart_Json(JSON.parse(returnValue));

              draw(data);
              //draw(parse_Sign_To_Chart_Json(data));//---------------show the chart
          } // have get data

      } // readyState === 4 

  } //callback_getSignTempleteDrawData

  
