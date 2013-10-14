
jQuery(document).ready(function($) {  

  console.log("READY");
  return;
  $("p").click(function(){
      chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, {method: "getSelection"}, function (response) {
      var text = document.getElementById('text'); 
      text.innerHTML = response.data;
    });
  });
  });
});
