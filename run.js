function hack_run(){
    //New menu entry for launching jobs
    put_dialog({});
    var ul = document.evaluate('//*[@id="id_form_case_runs"]/div/div[2]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
    //---------CucuShift---
    var new_li = document.createElement('li');
    var new_a = $("<a href='#'><strong>CucuShift</strong></a>");
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
    //---------JIRA---------
    new_li = document.createElement('li');
    new_a = $("<a href='#'><strong>JIRA issue</strong></a>");
    $(new_a).click(function(){
        var caserun_ids = get_checked_caserun_ids();
        if (caserun_ids.length == 0){
            alert("No caseruns have been checked for testing...");
            return;
        }
        var testrun_id = $("#value_run_id").val();
        file_jira_issue({summary:"Fix cases from run%23"+testrun_id,
                         description:caserun_ids.map(function (x){
                             return "https://tcms.engineering.redhat.com/run/"+testrun_id+"/%23caserun_"+x;
                         }).join("%0D%0A")});
    });
    $(new_li).append(new_a);
    $(ul).append(new_li);
    //---------SetDeveloper------
    new_li = document.createElement('li');
    new_a = $("<a href='#'><strong>SetDeveloper</strong></a>");
    $(new_a).click(function(){
        var developer = prompt("Who is the developer to assign?", "");
        var case_ids = get_checked_case_ids_run();
        if (case_ids.length == 0){
            alert("No cases have been checked for assigning developer...");
            return;
        }
        assign_developer({case_ids:case_ids, developer:developer});
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
        var case_istatus_td = $(this).children()[11];
        if (case_id_td == undefined)
            return;
        var case_id = $(case_id_td).find('a')[0].text;
        //var case_id_td_html = case_id_td.innerHTML;
        $(case_id_td).append('<a class="editlink" target=_blank href="http://tcms.engineering.redhat.com/case/'+case_id+'/edit">&nbsp;</a>');
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
            //set STATUS icon as link to REPORT
            /*var istatus = case_istatus_td.innerHTML;
            var report_url = "http://www.postoy.sk";
            case_istatus_td.innerHTML = "";
            $(case_istatus_td).append('<a targe=_blank href="'+report_url+'">'+istatus+'</a>');*/
        });
        $(this).append(dev_td);
    });
}


function put_dialog(config){
  var dialog = '<div style="display:none;" id="dialog-form" title="Launch cases in CucuShift..."><form><fieldset>';
  if (config.summary){
      dialog += '<label for="summary">Summary</label><input type="text" name="summary" id="summary" value="Testrun ..." class="text ui-widget-content ui-corner-all" />';
  }
  dialog += '<label style="display:inline;" for="broker">Broker</label>\
    <input type="text" name="broker" id="broker" value="%QE_mzimen-dev" class="text ui-widget-content ui-corner-all" />\
    <label style="display:inline;" for="launcher_type">Launcher Type</label>\
    <select name="launcher_type" id="launcher_type" class="text ui-widget-content ui-corner-all">\
        <option value="stable">stable</option>\
        <option value="master">master</option>\
        <option value="enterprise">enterprise</option>\
    </select>\
    <label style="display:inline;" for="runner_job">Runner Type</label>\
    <select name="runner_job" id="runner_job" class="text ui-widget-content ui-corner-all">\
        <option value="CucuShift-Runner">CucuShift-Runner</option>\
        <option value="Runner-master">Runner-master</option>\
        <option value="OSE_CucuShift-Runner">OSE_CucuShift_Runner</option>\
        <option value="ORIGIN_CucuShift-Runner">ORIGIN_CucuShift_Runner</option>\
        <option value="Runner-mzimen">Runner-mzimen</option>\
    </select>\
    <label style="display:inline;" for="broker_type">Broker Type</label>\
    <select name="broker_type" id="broker_type" class="text ui-widget-content ui-corner-all">\
        <option value="devenv">devenv</option>\
        <option value="stage">stage</option>\
        <option value="int">int</option>\
        <option value="prod">prod</option>\
        <option value="enterprise">enterprise</option>\
        <option value="origin">origin</option>\
    </select>\
    <label style="display:inline;" for="rhc_branch">RHC_BRANCH</label>\
    <select name="rhc_branch" id="rhc_branch" class="ui-widget-content ui-corner-all">\
        <option value="candidate">candidate</option>\
        <option value="stable">stable</option>\
    </select>\
    <label for="job_count">JOB_COUNT</label>\
    <input type="text" name="job_count" id="job_count" value="3" class="text ui-widget-content ui-corner-all" />\
    <label for="job_count">ACCOUNTS PER JOB</label>\
    <input type="text" name="acc4job" id="acc4job" value="4" class="text ui-widget-content ui-corner-all" />\
    <label for="max_gears">MAX_GEARS</label>\
    <input type="text" name="max_gears" id="max_gears" value="30" class="text ui-widget-content ui-corner-all" />\
    <label for="debug">DEBUG mode</label>\
    <input type="checkbox" name="debug" id="debug" checked=true class="ui-widget-content ui-corner-all" />\
    <label for="accounts">Accounts</label>\
    <textarea style="display:none;" rows="3" cols="50" name="accounts" id="accounts"  class="text ui-widget-content ui-corner-all">\
login1:password1:small,login2:password1:small\
</textarea>\
    <label for="dns_ip">DNS_IP</label>\
    <input type="text" name="dns_ip" id="dns_ip" value="" class="text ui-widget-content ui-corner-all" />\
    <label for="domain_name">DOMAIN_NAME</label>\
    <input type="text" name="domain_name" id="domain_name" value="" class="text ui-widget-content ui-corner-all" />\
    <label for="client_build_tree">CLIENT_BUILD_TREE</label>\
    <input type="text" name="client_build_tree" id="client_build_tree" value="" class="text ui-widget-content ui-corner-all" />\
  </fieldset>\
  </form>\
</div>';
  $(document.body).append(dialog);
  $("#broker_type").change(function(){
      var selected = $(this).find("option:selected").text();
      if (selected == "devenv"){
          //$("#job_count").show();
          //$("#acc4job").show();
          $("#accounts").hide();
      }else{
          if (selected == "enterprise"){
            $("#client_build_tree").show();
            $("#domain_name").show();
            $("#dns_ip").show();
          }
          //$("#job_count").hide();
          //$("#acc4job").hide();
          $("#accounts").show();
      }
  });
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
                    //"TESTRUN_ID": testrun_id,
                    "JOB_NAME": $("#runner_job :selected").text(),
                    "ACCOUNTS_PER_JOB": $("#acc4job").val(),
                    "JOB_COUNT": $("#job_count").val()
                    //TODO MONGO
            };
            if (broker_type == "enterprise"){
                runner_data['DNS_IP'] = $("#dns_ip :selected").text();
                runner_data['DOMAIN_NAME'] = $("#domain_name :selected").text();
                runner_data['CLIENT_BUILD_TREE'] = $("#client_build_tree :selected").text();
            }
            if (config.caserun_ids){
                runner_data['CASERUN_IDS'] = config.caserun_ids.join(",");
            }
            if (config.case_ids != undefined && config.case_ids.length>0){
                runner_data['CASE_IDS'] = config.case_ids.join(",");
                runner_data['SUMMARY'] = $("#summary").val();
            }
            var launcher_config = {
                stable:"http://ciqe.englab.nay.redhat.com/job/CucuShift-Launcher/buildWithParameters",
                enterprise:"http://ciqe.englab.nay.redhat.com/job/OSE_Cucushift_Launcher/buildWithParameters",
                //local:"http://localhost:8008/cucushift/buildWithParameters",
                master:"http://ciqe.englab.nay.redhat.com/job/Launcher-master/buildWithParameters"
            };
            var runner_config = {
                stable:"http://ciqe.englab.nay.redhat.com/job/CucuShift-Runner/buildWithParameters",
                master:"http://ciqe.englab.nay.redhat.com/job/Runner-master/buildWithParameters",
                mzimen:"http://ciqe.englab.nay.redhat.com/job/Runner-mzimen/buildWithParameters",
                local:"http://localhost:8008/cucushift/buildWithParameters"
            };
            $.ajax({
                type: "POST",
                url: launcher_config[$("#launcher_type").val()],
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
  $("#dialog-form").dialog("open");
}


function get_checked_case_ids_run(){
    var case_ids = [];
    $("#id_table_cases > tbody > tr").each(function(){
        var checkbox_td = $(this).children()[0];
        var case_id_td = $(this).children()[3];
        if (case_id_td == undefined)
            return;
        if (checkbox_td == undefined)
            return;
        var case_id = parseInt($(case_id_td).find('a')[0].text.replace('#',''));
        if ($($(checkbox_td).children()[0]).is(':checked')){
            case_ids.push(case_id);
        }
    });
    return case_ids;
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
    var matches = data.match(/automated by(:)?([^<\/"]+)/i);
    var developer = "Unknown";
    if (matches && matches.length > 0){
        if (matches[2].match(/@redhat.com/)){
          email = matches[2].indexOf("@")
          developer = matches[2].substring(0, email)
        } else {
          developer = matches[2]
        }
    }
    return developer;
}

function assign_developer(conf){
    alert("Not yet implemented");
    return;
    for (var c in conf.case_ids){
        var case_id = conf.case_ids[c];
        console.log(case_id);
        $.ajax({
            type: 'POST',
            url: 'https://tcms.engineering.redhat.com/ajax/update',
            data: {content_type:'testcase',
                   object_pk: case_id,
                   field: 'notes',
                   value_str: 'str',
                   value: 'developed by '+conf.developer
           }
        }).done(function(data){
            console.log("DONE");
        });
    }
}

function file_jira_issue(cfg){
   var url = 'https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?description='+cfg.description+'&summary='+cfg.summary+'&pid=11302&issuetype=1';
   window.open(url, '_blank');
}
