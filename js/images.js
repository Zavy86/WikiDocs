/**
 * Images Script
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Form upload
 */
$("#uploader-form").on('submit',(function(e){
 // prevent default submit
 e.preventDefault();
 // lock buttons
 $("#uploader-submit").val("Uploading..");
 $("#uploader-submit").attr("disabled",true);
 $.ajax({
  url:$(this).attr('action'),
  type:"post",
  data:new FormData(this),
  contentType:false,
  cache:false,
  processData:false,
  success:function(response){
   // decode response
   decoded=JSON.parse(response);
   // alert if error
   if(decoded.error===1){
    alert(decoded.code);
   }else{
    // build image object
    image="<div class=\"col s6 m3\"><a href=\"#\" class=\"image-picker waves-effect waves-light\" image=\""+decoded.name+"\">";
    image+="<img class=\"polaroid\" src=\""+decoded.path+"\"/></a></div>";
    // append to images list
    $("#images-list").append(image);
   }
   // unlock buttons
   $("#uploader-path").val("");
   $("#uploader-submit").val("Upload");
   $("#uploader-submit").attr("disabled",false);
  },
  error:function(XMLHttpRequest,textStatus,errorThrown){
   // alert
   alert("Status: "+textStatus+" Error: "+errorThrown);
   // unlock buttons
   $("#uploader-submit").val("Upload");
   $("#uploader-submit").attr("disabled",false);
  }
 });
}));

/**
 *  Image picker
 */
//$(".image-picker").click(function(){
$('body').on('click','.image-picker',function(){
 image_tag=$(this).attr("image");
 simplemde.codemirror.replaceSelection('![]('+path+'/'+image_tag+')');
 $("#modal_uploader").modal("close");
});
