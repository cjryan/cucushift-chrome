function hack_run(){
    //New menu entry for launching jobs
    put_dialog({});
    var ul = document.evaluate('//*[@id="id_form_case_runs"]/div/div[2]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue; 
    var new_li = document.createElement('li');
    var new_a = $("<a href='#'>Run@CucuShift</a>");
    $(new_a).click(function(){
        var caserun_ids = get_checked_caserun_ids();
        if (caserun_ids.length == 0){
            alert("No caseruns have been checked for testing...");
            return;
        }
        show_dialog({caserun_ids:caserun_ids});
    });
    $(new_li).append(new_a);
    $(ul).append(new_li);

    //1. Add new column to the table
    $("#id_table_cases > thead > tr").append('<th width="100px;">Developer</th>');
    var testrun_id = $("#value_run_id").val();
    $("#id_table_cases > tbody > tr").each(function(){
        var case_id_td = $(this).children()[3];
        var caserun_id_td = $(this).children()[2];
        var case_status_td = $(this).children()[11];
        var case_summary_td = $(this).children()[4];
        var case_astatus_td = $(this).children()[7];
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
            var developer = get_developer(data);
            if (case_status == "error" || case_status == "failed"){
                dev_td.innerHTML = '<a title="File a new JIRA issue" target="_blank" href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?description='+description+'&summary='+case_summary+'&pid=11302&issuetype=1&assignee='+developer+'">'+developer+'</a>';
            }else{ //PASSED => we don't need JIRA link, only developer name
                dev_td.innerHTML = developer;
            }
            //add github url
            var feature_file = get_feature_file(data);
            if (feature_file != null){
                var github_url = 'https://github.com/openshift/cucushift/blob/master/features/'+feature_file;
                var astatus = case_astatus_td.innerHTML;
                case_astatus_td.innerHTML = "";
                $(case_astatus_td).append('<a targe=_blank href="'+github_url+'">'+astatus+'</a>');
            }
        });
        $(this).append(dev_td);
    });
}


function put_dialog(config){
  var dialog = '<div style="display:none;" id="dialog-form" title="Launch cases in CucuShift..."><form><fieldset>';
  if (config.summary){
      dialog += '<label for="summary">Summary</label><input type="text" name="summary" id="summary" value="Testrun ..." class="text ui-widget-content ui-corner-all" />';
  }
  dialog += '<label for="broker">Broker</label>\
    <input type="text" name="broker" id="broker" value="int.openshift.redhat.com" class="text ui-widget-content ui-corner-all" />\
    <label for="runner_type">Runner Type</label>\
    <select name="runner_type" id="runner_type" class="text ui-widget-content ui-corner-all">\
        <option value="stable">stable</option>\
        <option value="master">master</option>\
        <option value="local">local</option>\
    </select>\
    <label for="broker_type">Broker Type</label>\
    <select name="broker_type" id="broker_type" class="text ui-widget-content ui-corner-all">\
        <option value="devenv">devenv</option>\
        <option value="stage">stage</option>\
        <option value="int">int</option>\
        <option value="prod">prod</option>\
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
            var runner_data = {
                    "RHC_BRANCH": rhc_branch.text(),
                    "OPENSHIFT_MAX_GEARS": max_gears.val(),
                    "OPENSHIFT_BROKER": broker.val(),
                    "OPENSHIFT_BROKER_TYPE": broker_type.text(),
                    "OPENSHIFT_ACCOUNTS": accounts.val(),
                    "DEBUG": debug.is(':checked'),
                    "token": "openshift",
                    "TESTRUN_ID": testrun_id};
            if (config.caserun_ids){
                runner_data['CASERUN_IDS'] = config.caserun_ids.join(",");
            }
            if (config.case_ids != undefined && config.case_ids.length>0){
                runner_data['CASE_IDS'] = config.case_ids.join(",");
                runner_data['SUMMARY'] = $("#summary").val();
            }
            var runner_config = {
                stable:"http://ciqe.englab.nay.redhat.com/job/CucuShift-Runner/buildWithParameters",
                master:"http://ciqe.englab.nay.redhat.com/job/Runner-master/buildWithParameters",
                local:"http://localhost:8008/cucushift/buildWithParameters"
            };
            $.ajax({
                type: "POST",
                url: runner_config[$("#runner_type").val()],
                data: runner_data
            }).done(function(){
                alert("Job Sent. Check the jenkins/localhost...");
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

function get_feature_file(data){
    var feature_file = null;
    var matches = data.match(/<span id="display_script" >({[^<"]+)/i);
    if (matches && matches.length>0){
      feature_file = matches[1];
      feature_file = feature_file.replace(/&quot;/g,'"');
      feature_file = JSON.parse(feature_file)["ruby"].split(':')[0];
    }
    return feature_file;
}

function get_developer(data){
    var matches = data.match(/automated([^<\/"]+)/i);
    var developer = "Unknown";
    if (matches && matches.length > 0){
        if (matches[1].match(/ofayans/))
            developer = "ofayans";
        else if (matches[1].match(/cryan/))
            developer = "cryan";
        else if (matches[1].match(/jizhao/))
            developer = "jizhao";
        else if (matches[1].match(/pruan/))
            developer = "pruan";
        else if (matches[1].match(/mzimen/))
            developer = "mzimen";
    }
    return developer;
}
