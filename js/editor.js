/**
 * Editor Script
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Simple Markdown Editor
 */
var simplemde=new SimpleMDE({
 element:document.getElementById("simplemde"),
 spellChecker:false,
 autofocus:true,
 forceSync:true,
 hideIcons:["image"],
 showIcons:["code","table"],
 blockStyles:{
  bold:"**",
  italic:"*",
  code:"```"
 }
});

/**
 * Changed status
 */
var changed=false;

/**
 * Event Handlers
 */
// content changed
simplemde.codemirror.on("change",function(){changed=true;});
// prevent exit without save
$(window).on("beforeunload",function(){if(changed){return confirm("Do you really want to exit without save?");}});
// save button click
$("#editor-save").click(function(){
 //if(!changed){return false;}
 changed=false;
 $("#editor-form").submit();
});
// revision change
$("#editor-revision").click(function(){
 if($("input[name='revision']").val()==="1"){
  $("input[name='revision']").val("0");
  $("#editor-revision-checkbox").text("check_box_outline_blank");
 }else{
  $("input[name='revision']").val("1");
  $("#editor-revision-checkbox").text("check_box");
 }
});
