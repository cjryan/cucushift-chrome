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
}

$( document ).ready(function() {
    txtswap();
    $("#accordion").accordion({
        heightStyle: "content"
    });
});
