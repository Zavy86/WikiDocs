/**
 * Attachments Script
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

/**
 * Form upload
 */
$("#attachments-uploader-form").on('submit',(function(e){
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
				// build attachment object
				attachment="<li>- "+decoded.name+"</li>";
				// append to attachments list
				$("#attachments-list").append(attachment);
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

/*
 * Attachment delete function
 */
document.querySelectorAll('.attachment-delete').forEach(item => {
	item.addEventListener('click', event => {
		let attachment_name = item.attributes.attachment.value;

		$.ajax({
			url: APP.PATH+"submit.php?act=attachment_delete_ajax",
			type: "post",
			dataType: "html",
			data: "document="+DOC.ID+"&attachment_name="+attachment_name,
			cache: false,
			processData: false,
			success: function( response ) {
				let decodedResponse = JSON.parse(response);
				console.log(decodedResponse.code + " => " + decodedResponse.file);

				if ( decodedResponse.error === 1 ){
					alert(decodedResponse.code);
				} else {
					let attachment_element = document.querySelector(`#attachments-list [attachment="${attachment_name}"]`).parentElement;
					attachment_element.remove();
				}
			},
			error:function(XMLHttpRequest,textStatus,errorThrown){
				alert("Status: "+textStatus+" Error: "+errorThrown);
			}
		});
	})
})
