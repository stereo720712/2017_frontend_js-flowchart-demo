using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using Newtonsoft.Json.Linq;
using System.Text;
using FrameWork.Data;
using FrameWork.Components.NEWXSIGN;
using FrameWork.Data.NEWXSIGN;
using FrameWork.Components;
using Newtonsoft.Json;



namespace FrameWork.web.Manager.Module.NEWXSIGN.SystemManage.Template.Process
{
    /// <summary>
    /// CallSignTempleteFlow 
    /// function:"get Template Flow Chart Data"
    /// </summary>
    public class CallSignTempleteFlow : IHttpHandler
    {
        public const String JSON_RESULT     = "result";
        public const String JSON_SUCCESS  = "success";
        public const String JSON_FAIL            = "fail";
        public const String JSON_MESSAGE = "message";
        public const String JSON_NODELIST = "nodeList";
        public const String JSON_PATHLIST = "pathList";

        string TEMPLATE_CODE = (string)UPS_Common.sink("template_code", MethodType.Get, 50, 0, DataType.Str);
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "application/json";

            context.Response.Write(getTemplateJson());
        }

        private JObject getTemplateJson()
        {
            JObject result = new JObject();

            #region 1.找到对应的流程模板资料
            cls_TemplateProcess cls_template = new cls_TemplateProcess();
            cls_template.Code = TEMPLATE_CODE;
            cls_template.Status = 100;//不管模版状态
            int TotalCount = 0;
            List<cls_TemplateProcess> templateList = NEWXSIGN_BusinessFacade.GetTemplateProcessSean(cls_template, new QueryParam(), out TotalCount);
            if (templateList.Count == 0)
                return new JObject(new JProperty(JSON_RESULT, JSON_FAIL), new JProperty(JSON_MESSAGE, "模板不存在"));
            else if (templateList.Count > 1)
                return new JObject(new JProperty(JSON_RESULT, JSON_FAIL), new JProperty(JSON_MESSAGE, "找到多个对应的模板"));
            cls_TemplateProcess template = (cls_TemplateProcess)templateList[0];

            #endregion
            #region "2.查找该模版所有节点资料"
            cls_TplNode cls_TplNode = new cls_TplNode();
            cls_TplNode.Template = template;
            List<cls_TplNode> tplNodeList = NEWXSIGN_BusinessFacade.GetTplNode(cls_TplNode, new QueryParam(), out TotalCount);
            #endregion
            #region "3.查找该模版所有节点资料"
            cls_TplPath cls_TplPath = new cls_TplPath();
            cls_TplPath.Template = template;
            List<cls_TplPath> tplPathList = NEWXSIGN_BusinessFacade.GetTplPath(cls_TplPath, new QueryParam(), out TotalCount);

            #endregion

            #region "3.组成Json data and return "
    
            //将资料直接丢至 js端处理
            if (tplPathList.Count == 0)
            {
                return new JObject(new JProperty(JSON_RESULT, JSON_FAIL), new JProperty(JSON_MESSAGE, "该模版无路径"));
            }

            result.Add(new JProperty(JSON_RESULT, JSON_SUCCESS));

            JArray jNodeList = new JArray();
            JArray jPathList = new JArray();
            foreach (cls_TplNode node in tplNodeList)
            {
                jNodeList.Add(generateBaseChartNode(node));
            }
            tplNodeList.Clear();
            result.Add(new JProperty(JSON_NODELIST,jNodeList));
            foreach(cls_TplPath path in tplPathList)
            {
                jPathList.Add(generateBaseChartLink(path));

            }//foreach
            tplPathList.Clear();
            result.Add(new JProperty(JSON_PATHLIST,jPathList));
        
            return result;

            #endregion
        }//getTemplateJson


        public bool IsReusable
        {
            get
            {
                return false;
            }
        }// reuse

       //最原始想法：一个 transform function将原始的节点资料跟路径资料转换成流程图LIB 
       //的资料,但是有个问题，流程图节点的位置资料需要在clinet端设定（这样比较好）
        //乾脆点分组好现有的节点跟路径资料先丢过去client端再来调整
        //另外 想不出比较好的资料结构 乾脆直接尽量符合要套用的 flow chart json structure
        //因为Json key 是变数.......自干？
       


        //没办法完整直接弄成 flowchart 的json 结构...
        //因为要分组 在丢去 client 端 重新排序因为节点位置要在Browser 端调整
        //flow chart 的json 无分组
        //ref https://github.com/sdrdis/jquery.flowchart
        public JObject generateBaseChartNode(cls_TplNode node)
        {
            JObject obj = new JObject();
            ChartNode cNode = new ChartNode();
            cNode.nodeID = "n"+ node.TplNodeID.ToString();// to be sure a js string
            cNode.title = node.Name;
            cNode.typeCode = node.NodeType.Code;
            cNode.fCode = node.Code;
            return JObject.FromObject(cNode);
        }//generateBaseChartNode

        public JObject generateBaseChartLink(cls_TplPath path) {
            ChartLink cLink = new ChartLink();
            cLink.linkID = "n" + path.PathID.ToString();// to be sure a js string
            cLink.fromOperator = "n" + path.GetPreNodeID.ToString();// to be sure a js string
            cLink.toOperator = "n" + path.GetNextNodeID.ToString();
            cLink.fCondition = path.Condition;
            return JObject.FromObject(cLink);
        }//generateBaseChartLink

        public class ChartNode
        {
           public  String nodeID { get; set; }
           public String title { get; set; }//
           public String typeCode{ get; set; }
           public String fCode { get; set; } 
          // public List<String> inputs = new List<String>();//chart node input label arr
          // public List<String> outputs = new List<String>();//
          // public int left = 0;// x-axis value
          // public int top = 0;// y-axis value

        }//ChartNode

        public class ChartLink
        {
            public String linkID { get; set; }// map to PathID
            public String fromOperator { get; set; }// map to previous nodeID (Current Node ID)
            //public String fromConnector { get; set; }//output ID @ fromOperator
            public String toOperator { get; set; }//map to next nodeID
            //public String toConnector { get; set; } // map to next node input ID ---decide in client
            public String fCondition { get; set; }// out or input 's label
        }//ChartLink

    }//class
}
