/**
 * Editor Script
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Simple Markdown Editor (EasyMDE)
 */
var simplemde=new EasyMDE({
 element:document.getElementById("simplemde"),
 spellChecker:false,
 autofocus:true,
 forceSync:true,
 //hideIcons:["image"],
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
var changed_draft=false;

/**
 * Event Handlers
 */
// content changed
simplemde.codemirror.on("change",function(){changed=true;changed_draft=true;});
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

/**
 * Timer Handler
 */
setInterval(function(){
 if(changed_draft){
  $.ajax({
   url:APP.URL+"submit.php?act=draft_save_ajax",
   type:"POST",
   data:{
    document:DOC.ID,
    content:$("textarea[name='content']").val()
   },
   cache:false,
   success:function(response){
    // decode response
    decoded=JSON.parse(response);
    // alert if error
    if(decoded.error===1){
     alert(decoded.code);
    }else{
     // drfat saved
     changed_draft=false;
    }
   },
   error:function(XMLHttpRequest,textStatus,errorThrown){
    // alert
    alert("Status: "+textStatus+" Error: "+errorThrown);
   }
  });
 }
},10000);
