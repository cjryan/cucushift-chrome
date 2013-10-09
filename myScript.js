function hack_case(){
    //$("#display_script").css({background: "red"});
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

function hack_run(){
    put_dialog();
    //1. Add new column to the table
    var ul = document.evaluate('//*[@id="id_form_case_runs"]/div/div[2]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue; 
    var new_li = document.createElement('li');
    var new_a = $("<a href='#'>Run@CucuShift</a>");
    $(new_a).click(function(){
        show_dialog();
    });
    $(new_li).append(new_a);
    $(ul).append(new_li);
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
                        assignee == "ofayans";
                    else if (matches[1].match(/cryan/))
                        assignee == "cryan";
                    else if (matches[1].match(/jizhao/))
                        assignee == "jizhao";
                    else if (matches[1].match(/pruan/))
                        assignee == "pruan";
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
$( document ).ready(function() {
 if (document.location.href.match(/run/)){
   hack_run();
 }else if (document.location.href.match(/case/)){
   hack_case();
 }else if (document.location.href.match(/ciqe/)){
    txtswap();
    $("#accordion").accordion({
        heightStyle: "content"
    });
 }
});


function show_dialog(){
    var caserun_ids = get_checked_caserun_ids();
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

function put_dialog(){
  var dialog = '<div id="dialog-form" title="Launch cases in CucuShift..."> \
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

function txtswap(){
  var body_html = document.body.innerHTML;

  //find the testrun ID
  var found=body_html.match(/TESTRUN_ID=(\d+)/);
  var testrun_id=found[1];

  /*Replace the <pre> tag with an accordion div*/
  var accordion_replace_prefix = body_html.replace(/<span style="display: none;[^<]+<\/span>/g,'');
  accordion_replace_prefix = accordion_replace_prefix.replace(/Scenario ([^#]+)/,'<div id="accordion"><h3>$1</h3><pre>:');
  accordion_replace_prefix = accordion_replace_prefix.replace('</pre>','</div>');
  accordion_replace_prefix = accordion_replace_prefix.replace('Scenario','</pre>Scenario');
  //we can assume that every 6digits are TestCases...
  accordion_replace_prefix = accordion_replace_prefix.replace(/ (\d{6}) /g,'<a target="_blank" href="https://tcms.engineering.redhat.com/case/$1">$1</a>');
  //we can assume that every 6digits are TestCaseRuns...
  accordion_replace_prefix = accordion_replace_prefix.replace(/ (\d{7}) /g,'<a target="_blank" href="https://tcms.engineering.redhat.com/run/'+testrun_id+'/#caserun_$1">$1</a>');
  document.body.innerHTML = accordion_replace_prefix;

  var scenario_replace = document.getElementById("accordion").innerHTML.replace(/Scenario(?: Outline)?: ([^#]+)/g,
                                                                                '</pre><h3>$1</h3><pre class="scenario">SCENARIO: $1');
  document.getElementById("accordion").innerHTML = scenario_replace;

  //now let's detect and set Scenario Status (passed/failed/skipped)
  $(document).find('h3').each(function(){
    var pre=$(this).next()[0];
    if (pre.innerHTML == undefined)
      return;
    var status_class="";
    if (pre.innerHTML.match(/<span style="color: #CD0000;">/)){
      status_class = "failed";
    }
    else if (pre.innerHTML.match(/<span style="color: #00CD00;">/)){
      status_class = "passed";
    }
    else{
      status_class ="skipped"; 
    }
    $(this).addClass(status_class);
  });
}
