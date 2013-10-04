var body_html = document.body.innerHTML;
function txtswap()
{
  /*Replace the <pre> tag with an accordion div*/
  var accordion_replace_prefix = body_html.replace('<pre>','<div id="accordion">');
  accordion_replace_prefix = accordion_replace_prefix.replace('</pre>','</div>');
  accordion_replace_prefix = accordion_replace_prefix.replace(/<span style="display: none;[^<]+<\/span>/g,'');
  document.body.innerHTML = accordion_replace_prefix;

  var scenario_replace = document.getElementById("accordion").innerHTML.replace(/Scenario(.*)/g,'</pre></div><h3>$1</h3><div><pre>Xcenario:');
  document.getElementById("accordion").innerHTML = scenario_replace;
}
$( document ).ready(function() {
 txtswap();
 $("#accordion").accordion({
    heightStyle: "content"
 });
});
