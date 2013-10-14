function plan_inject_into_menu(){
    var ul = document.evaluate('//*[@id="testcases"]/form/div[1]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
    var new_li = document.createElement('li');
    var new_a = $('<input type="button" value="Run@CucuShift">');
    $(new_a).click(function(){
        show_dialog({});
    });
    $(new_li).append(new_a);
    $(ul).append(new_li);
}

function hack_plan(){
    put_dialog();

    //1. Add new column to the table
    $("#id_buttons").append("<input id='id_button_cucushift_hack' type='button' value='CucuShift Hack'>").click(function(){
        if ($("#testcases > table > thead > tr").length == 0){
            alert("Not ready...");
            return;
        }
        plan_inject_into_menu();
        //$("#id_button_cucushift_hack").val("Processing...");
        $("#testcases > table > thead > tr").append("<th align='left' width='100px'><a href='#'>Developer</a></th>");
        var i=0;
        var rows_num = $("#testcases > table > tbody > tr.case_title").length;
        $("#testcases > table > tbody > tr.case_title").each(function(){
            i=i+1;
            document.title= i+"/"+rows_num+" done";
            var case_id_td = $(this).children()[2];
            var case_status_td = $(this).children()[7];
            var case_summary_td = $(this).children()[3];
            if (case_id_td == undefined)
                return;
            var case_id = $(case_id_td).find('a')[0].text;
            var case_summary = encodeURIComponent(case_id+"|"+$(case_summary_td).find('a')[0].text);
            var description = encodeURIComponent("case_id=https://tcms.engineering.redhat.com/case/"+case_id);

            var dev_td = document.createElement('td');
            dev_td.innerHTML = "touch";
            $(dev_td).attr("id", "dev_id_"+case_id);
            $(dev_td).addClass("developer");
            $(this).one('mouseenter', function(){
                $.ajax({
                    context: dev_td,
                    url: 'https://tcms.engineering.redhat.com/case/'+case_id
                }).done(function(data){
                    var dev_td = this;
                    var matches = data.match(/automated([^<\/"]+)/i);
                    if (matches.length>0){
                        var assignee = "";
                        if (matches[1].match(/ofayans/))
                            assignee = "ofayans";
                        else if (matches[1].match(/cryan/))
                            assignee = "cryan";
                        else if (matches[1].match(/jizhao/))
                            assignee = "jizhao";
                        else if (matches[1].match(/pruan/))
                            assignee = "pruan";
                        else
                            assignee = "mzimen";
                        dev_td.innerHTML = '<a title="File a new JIRA issue" target="_blank" href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?description='+description+'&summary='+case_summary+'&pid=11302&issuetype=1&assignee='+assignee+'">'+matches[1]+'</a>';
                    }else{
                        dev_td.innerHTML = "Unknown";
                    }
                });
            });
            $(this).append(dev_td);
        });
        //$("#id_button_cucushift_hack").css("display", "none");
    });
}

