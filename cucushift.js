$( document ).ready(function() {
 if (document.location.href.match(/\/run\//)){
   hack_run();
 }else if (document.location.href.match(/\/plan\//)){
   hack_plan();
 }else if (document.location.href.match(/\/case\//)){
   hack_case();
 }else if (document.location.href.match(/ciqe\..*consoleFull/)){
   hack_jenkins();
 }
});




