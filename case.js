function get_script_element(){
    var div = document.evaluate('//*[@id="content"]/div[4]/fieldset/div[2]/div[5]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
    return $(div).find('span')[0];
}

function get_script_name(){
    var script_el = get_script_element();
    try{
        var s = JSON.parse(script_el.innerHTML)["ruby"];
        return s.split(':')[0];
    }catch(err){
        return null;
    }
}

function get_trello_board(summary){
    if (summary.match(/runtime/))
        return "origin_runtime";
    if (summary.match(/ui/) || summary.match(/user_interface/))
        return "origin_ui";
    if (summary.match(/origin_broker/))
        return "origin_broker";
}


function hack_case(){
    var trello_board = get_trello_board($("#display_title").html());
    var trello_config = {
        origin_runtime: "https://trello.com/b/qjfQ62lZ/openshift-origin-runtime",
        broker: "https://trello.com/b/QfI7clCY/broker",
        origin_broker: "https://trello.com/b/nbkIrqKa/openshift-origin-broker",
        origin_ui: "https://trello.com/b/M0rP0aLj/openshift-origin-user-interface"
    };
    var trello_url = trello_config[trello_board];
    $(".rightlistinfo > div").children(':last').append('<a target=_blank href="'+trello_url+'">[Trello]</a>');
    //$("#display_script").css({background: "red"});
    var new_li = document.createElement('li');
    $(new_li).attr('id', 'tabGitHub');
    $(new_li).addClass("tab");
    $("ul#contentTab").append(new_li);
    var new_a = $("<a href='#github'>GitHub</a>");
    $(new_li).append(new_a);
    var feature_file = get_script_name();
    if (feature_file == null){
        $(get_script_element()).css("color", "magenta");
        return;
    }
    $(get_script_element()).append('<a target=_blank href="https://github.com/openshift/cucushift/blob/master/features/'+feature_file+'">[github]</a>');
    $(new_a).click(function(){
        $(".tab_list").css("display", "none");
        try{
            $("#github").load("https://github.com/openshift/cucushift/blob/master/features/"+feature_file+" td.blob-line-code", function(response, status, xhr){
                if ( status == "error" ) {
                    $(get_script_element()).css("color", "red");
                }else{
                    $(get_script_element()).css("color", "green");
                }
                });
        }catch(err){
            $(get_script_element()).css("color", "red");
        }
        $("#github").css("display","");
    });
    $("#attachment").after('<div style="display:none;" id="github" class="tab_list"></div>');
}
