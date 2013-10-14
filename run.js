function hack_run(){
    //New menu entry for launching jobs
    put_dialog();
    var ul = document.evaluate('//*[@id="id_form_case_runs"]/div/div[2]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue; 
    var new_li = document.createElement('li');
    var new_a = $("<a href='#'>Run@CucuShift</a>");
    $(new_a).click(function(){
        show_dialog();
    });
    $(new_li).append(new_a);
    $(ul).append(new_li);

    //1. Add new column to the table
    $("#id_table_cases > thead > tr").append("<th>Developer</th>");
    var testrun_id = $("#value_run_id").val();
    $("#id_table_cases > tbody > tr").each(function(){
        var case_id_td = $(this).children()[3];
        var caserun_id_td = $(this).children()[2];
        var case_status_td = $(this).children()[11];
        var case_summary_td = $(this).children()[4];
        if (case_id_td == undefined)
            return;
        var case_id = $(case_id_td).find('a')[0].text;
        var caserun_id = $(caserun_id_td).find('a')[0].text;
        var case_summary = encodeURIComponent(case_id+"|"+$(case_summary_td).find('a')[0].text);
        var description = encodeURIComponent("caserun_id=https://tcms.engineering.redhat.com/run/"+testrun_id+"/#caserun_"+caserun_id+"\ncase_id=https://tcms.engineering.redhat.com/case/"+case_id);
        var case_status = $($(case_status_td).find('img')[0]).attr('class');
        if (case_status.match(/failed/))
            case_status='failed';
        else if (case_status.match(/passed/))
            case_status='passed';
        else if (case_status.match(/error/))
            case_status='error';
        else
            case_status='idle';

        var dev_td = document.createElement('td');
        dev_td.innerHTML = "Checking...";
        $.ajax({
            url: 'https://tcms.engineering.redhat.com/case/'+case_id
        }).done(function(data){
            var matches = data.match(/automated([^<\/"]+)/i);
            if (matches.length>0){
                //console.log("FOUND automated: "+matches[1]);
                if (case_status == "error" || case_status == "failed"){
                    var assignee = "mzimen";
                    if (matches[1].match(/ofayans/))
                        assignee = "ofayans";
                    else if (matches[1].match(/cryan/))
                        assignee = "cryan";
                    else if (matches[1].match(/jizhao/))
                        assignee = "jizhao";
                    else if (matches[1].match(/pruan/))
                        assignee = "pruan";
                    dev_td.innerHTML = '<a title="File a new JIRA issue" target="_blank" href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?description='+description+'&summary='+case_summary+'&pid=11302&issuetype=1&assignee='+assignee+'">'+matches[1]+'</a>';
                }else{
                    dev_td.innerHTML = matches[1];
                }
            }else{
                dev_td.innerHTML = "Unknown";
            }
        });
        $(this).append(dev_td);
    });
}


function put_dialog(){
  var dialog = '<div style="display:none;" id="dialog-form" title="Launch cases in CucuShift..."> \
  <form>\
  <fieldset>\
    <label for="broker">Broker</label>\
    <input type="text" name="broker" id="broker" value="int.openshift.redhat.com" class="text ui-widget-content ui-corner-all" />\
    <label for="broker_type">BrokerType</label>\
    <select name="broker_type" id="broker_type" class="text ui-widget-content ui-corner-all">\
    <option value="devenv">devenv</option>\
    <option value="stage">stage</option>\
    <option>int</option>\
    <option>prod</option>\
    </select>\
    <label for="rhc_branch">RHC_BRANCH</label>\
    <select name="rhc_branch" id="rhc_branch" class="ui-widget-content ui-corner-all">\
    <option value="candidate">candidate</option>\
    <option value="stable">stable</option>\
    </select>\
    <label for="max_gears">MAX_GEARS</label>\
    <input type="text" name="max_gears" id="max_gears" value="30" class="text ui-widget-content ui-corner-all" />\
    <label for="debug">DEBUG mode</label>\
    <input type="checkbox" name="debug" id="debug" checked=true class="ui-widget-content ui-corner-all" />\
    <label for="accounts">Accounts</label>\
    <textarea rows="3" cols="50" name="accounts" id="accounts"  class="text ui-widget-content ui-corner-all">\
login1:password1:small\
</textarea>\
  </fieldset>\
  </form>\
</div>';
    $(document.body).append(dialog);
}


function show_dialog(config){
    var caserun_ids = get_checked_caserun_ids();
    if (caserun_ids.length == 0){
        alert("No caseruns have been checked for testing...");
        return;
    }
    $(function() {

    $("#dialog-form").dialog({
      autoOpen: false,
      height: 500,
      width: 450,
      modal: true,
      buttons: {
        "Launch": function() {
            var testrun_id = $("#value_run_id").val();
            var broker = $("#broker"),
              broker_type = $("#broker_type :selected"),
              rhc_branch = $("#rhc_branch :selected"),
              max_gears = $("#max_gears"),
              debug = $( "#debug" ),
              accounts = $("#accounts" );
            $.ajax({
                type: 'POST',
                url: "http://ciqe.englab.nay.redhat.com/job/Runner-master/buildWithParameters",
                data: {
                    "RHC_BRANCH": rhc_branch.text(),
                    "OPENSHIFT_MAX_GEARS": max_gears.val(),
                    "CASERUN_IDS": caserun_ids.join(","),
                    "OPENSHIFT_BROKER": broker.val(),
                    "OPENSHIFT_BROKER_TYPE": broker_type.text(),
                    "OPENSHIFT_ACCOUNTS": accounts.val(),
                    "DEBUG": debug.is(':checked'),
                    "token": "openshift",
                    "TESTRUN_ID": testrun_id}
            }).done(function(){
                alert("Job Sent. Check the jenkins...");
            });
            $( this ).dialog( "close" );
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      },
      close: function() {
      }
    });
  });
  $("#dialog-form").dialog( "open" );
}


function get_checked_caserun_ids(){
    var caserun_ids = [];
    $("#id_table_cases > tbody > tr").each(function(){
        var checkbox_td = $(this).children()[0];
        var caserun_td = $(this).children()[2];
        var caserun_id_td = $(this).children()[2];
        if (caserun_id_td == undefined)
            return;
        if (checkbox_td == undefined)
            return;
        var caserun_id = parseInt($(caserun_id_td).find('a')[0].text.replace('#',''));
        if ($($(checkbox_td).children()[0]).is(':checked')){
            caserun_ids.push(caserun_id);
        }
    });
    return caserun_ids;
}
