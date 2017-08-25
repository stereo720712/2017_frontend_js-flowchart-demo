  <!-- sean -->
                <asp:HiddenField ID="hideTemplateCode" runat="server" />
                <!-- sean 2017-08-25 -->
            <!--<div id="chart_container"> -->
              <div class="flowchart-example-container" id="flowChart"></div>
          <!--  </div> -->
            <script type="text/javascript" src="<%=Page.ResolveUrl("~/") %>Manager/js/newXsign/loadJqChartForSignTemplate.js"></script>
             
                 <script language="javascript" type="text/javascript">
                     $(document).ready(function () {
                         // when page load finish call

                         var hideTplProcessID = document.getElementById('<%=hideTemplateCode.ClientID%>');
                         var templateCode = hideTplProcessID.value;
                         getSignTempleteDrawData(templateCode); // when all code finish un comment it 

                     });

                     // $("#flowChart").scroll(function () {
                     //     draw(flowChartJson);
                     // });
                    
             </script>

       <!--sean  end -->
