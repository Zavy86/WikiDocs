<?php
/**
 * Submit
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
require_once("bootstrap.inc.php");
// mode definition
define("MODE","engine");
define("ACT",htmlspecialchars($_GET['act'] ?? ''));
// switch action
switch(ACT){
	// authentication
	case "authentication":authentication();break;
	// contents
	case "content_save":content_save();break;
	case "content_restore":content_restore();break;
	case "content_delete":content_delete();break;
	// images
	case "image_upload_ajax":image_upload_ajax();break;
	case "image_drop_upload_ajax":image_drop_upload_ajax();break;
	case "image_delete_ajax":image_delete_ajax();break;
	// attachments
	case "attachment_upload_ajax":attachment_upload_ajax();break;
	case "attachment_delete_ajax":attachment_delete_ajax();break;
	// drafts
	case "draft_save_ajax":draft_save_ajax();break;
	/** @todo case "image_delete_ajax":image_delete_ajax();break; */
	// default
	default:
		// alert and redirect
		wdf_alert("The action ".ACT." does not exist!","danger");
		wdf_redirect(PATH);
}

/**
 * Authentication
 */
function authentication(){
	// get localization
	$TXT=Localization::getInstance();
	// debug
	wdf_dump($_REQUEST,"_REQUEST");
	// reset authentication
	$_SESSION['wikidocs']['authenticated']=0;
	// acquire variables
	$p_document=strtolower($_POST['document']);
	$p_password=$_POST['password'];
	// check edit code
	if(md5($p_password)===EDITCODE){
		// update session
		$_SESSION['wikidocs']['authenticated']=2;
		// alert and redirect
		wdf_alert($TXT->SubmitAuthSuccess,"success");
		wdf_redirect(PATH.$p_document);
	}
	// check view code
	if(md5($p_password)===VIEWCODE){
		// update session
		$_SESSION['wikidocs']['authenticated']=1;
		// alert and redirect
		wdf_alert($TXT->SubmitAuthSuccess,"success");
		wdf_redirect(PATH.$p_document);
	}
	// authenticatiojn error
	if($_SESSION['wikidocs']['authenticated']==0){
		// alert and redirect
		wdf_alert($TXT->SubmitAuthInvalid,"danger");
		wdf_redirect(PATH.$p_document);
	}
}

/**
 * Content Save
 */
function content_save(){
	// get localization
	$TXT=Localization::getInstance();
	// debug
	wdf_dump($_REQUEST,"_REQUEST");
	// acquire variables
	$p_revision=boolval($_POST['revision']);
	$p_document=strtolower($_POST['document']);
	$p_content=$_POST['content'];
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// alert and redirect
		wdf_alert($TXT->SubmitNotAuthenticated,"danger");
		wdf_redirect(PATH.$p_document);
	}
	// check document path
	if(!strlen($p_document)){
		// alert and redirect
		wdf_alert($TXT->SubmitDocumentPathCannotBeEmpty,"danger");
		wdf_redirect(PATH);
	}
	// check content
	if(!strlen($p_content)){
		// alert and redirect
		wdf_alert($TXT->SubmitDocumentContentCannotBeEmpty,"danger");
		wdf_redirect(PATH.$p_document."?edit");
	}
	// initialize document
	$DOC=new Document($p_document);
	// debug
	wdf_dump($DOC,"DOCUMENT");
	// check for directory or make it
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}
	// check revision
	if($p_revision){
		// check for content file
		if(file_exists($DOC->DIR."content.md")){
			// check for revisions directory
			if(!is_dir($DOC->DIR."versions")){mkdir($DOC->DIR."versions",0755,true);}
			rename($DOC->DIR."content.md",$DOC->DIR."versions/".date("Ymd_His").".md");
		}
	}
	// document path definition
	define("DOC_PATH",$DOC->PATH."/");
	// replace url in images
	$p_content=preg_replace_callback('/!\[(.*)\]\s?\((.*)(.png|.gif|.jpg|.jpeg|.svg)(.*)\)/',function($match){return str_replace(DOC_PATH,"{{DOC_PATH}}",$match[0]);},$p_content);
	// replace url in images
	$p_content=preg_replace_callback('/\[(.*)\]:\s?(.*)(.png|.gif|.jpg|.jpeg|.svg|)/',function($match){return str_replace(DOC_PATH,"{{DOC_PATH}}",$match[0]);},$p_content);
	// replace path in url
	$p_content=preg_replace_callback('/\[(.*)\]\s?\((.*)\)/',function($match){return str_replace("(".PATH,"({{APP_PATH}}",$match[0]);},$p_content);
	// debug
	wdf_dump($p_content,"content");
	// save content file
	$bytes=file_put_contents($DOC->DIR."content.md",$p_content);
	// alerts
	if($bytes>0){
		// delete draft if exist
		if(file_exists($DOC->DIR."draft.md")){unlink($DOC->DIR."draft.md");}
		// sum size of all images
		foreach($DOC->images() as $image_fe){$bytes+=filesize($DOC->DIR.$image_fe);}
		if($bytes<1000000){$size=number_format($bytes/1000,2,",",".")." KB";}else{$size=number_format($bytes/1000000,2,",",".")." MB";}
		wdf_alert($TXT->SubmitDocumentSaved." [".$size."]","success");
	}else{
		wdf_alert($TXT->SubmitDocumentError,"danger");
	}
	// regenerate sitemap
	wdf_regenerate_sitemap();
	// redirect
	wdf_redirect(PATH.$p_document);
}

/**
 * Content Restore
 */
function content_restore(){
	// get localization
	$TXT=Localization::getInstance();
	// debug
	wdf_dump($_REQUEST,"_REQUEST");
	// acquire variables
	$p_document=strtolower($_GET['document']);
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// alert and redirect
		wdf_alert($TXT->SubmitNotAuthenticated,"danger");
		wdf_redirect(PATH.$p_document);
	}
	// check document path
	if(!strlen($p_document)){
		// alert and redirect
		wdf_alert($TXT->SubmitDocumentPathCannotBeEmpty,"danger");
		wdf_redirect(PATH);
	}
	// initialize document
	$DOC=new Document($p_document);
	wdf_dump($DOC,'DOC');
	// check if version exixts
	if(!file_exists($DOC->DIR."versions/".$DOC->VERSION.".md")){
		// alert and redirect
		wdf_alert($TXT->SubmitDocumentVersionNotFound,"danger");
		wdf_redirect(PATH);
	}
	// check for content file
	if(file_exists($DOC->DIR."content.md")){
		// check for revisions directory
		if(!is_dir($DOC->DIR."versions")){mkdir($DOC->DIR."versions",0755,true);}
		// store current version
		rename($DOC->DIR."content.md",$DOC->DIR."versions/".date("Ymd_His").".md");
	}
	// restore selected version
	copy($DOC->DIR."versions/".$DOC->VERSION.".md",$DOC->DIR."content.md");
	// regenerate sitemap
	wdf_regenerate_sitemap();
	// alert and redirect
	wdf_alert($TXT->SubmitDocumentRestored,"warning");
	wdf_redirect(PATH.$p_document);
}

/**
 * Content Delete
 */
function content_delete(){
	// get localization
	$TXT=Localization::getInstance();
	// debug
	wdf_dump($_REQUEST,"_REQUEST");
	// acquire variables
	$p_document=strtolower($_GET['document']);
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// alert and redirect
		wdf_alert($TXT->SubmitNotAuthenticated,"danger");
		wdf_redirect(PATH.$p_document);
	}
	// check document path
	if(!strlen($p_document)){
		// alert and redirect
		wdf_alert($TXT->SubmitDocumentPathCannotBeEmpty,"danger");
		wdf_redirect(PATH);
	}
	// initialize document
	$DOC=new Document($p_document);
	wdf_dump($DOC,'DOC');
	// check for trash directory or make it
	if(!is_dir(DIR."datasets/trash")){mkdir(DIR."datasets/trash",0755,true);}
	// set trash id
	$trash_id=str_replace('/','___',$DOC->ID)."_".date("Ymd_His");
	wdf_dump($trash_id);
	// move document to trash
	if(is_dir($DOC->DIR)){rename($DOC->DIR,DIR."datasets/trash/".$trash_id);}
	// regenerate sitemap
	wdf_regenerate_sitemap();
	// alert and redirect
	wdf_alert($TXT->SubmitDocumentDeleted,"warning");
	wdf_redirect(PATH);
}

/**
 * Image Upload (AJAX)
 */
function image_upload_ajax(){
	// acquire variables
	$p_document=strtolower($_POST['document']);
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// error
		echo json_encode(array("error"=>1,"code"=>"not_authenticated"));
		// return
		return false;
	}
	// check document path
	if(!strlen($p_document)){
		// error
		echo json_encode(array("error"=>1,"code"=>"document_empty", 'document' => $p_document));
		// return
		return false;
	}
	// initialize document
	$DOC=new Document($p_document);
	// check for directory or make it
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}
	// check for file
	if(!isset($_FILES['image'])||!is_uploaded_file($_FILES['image']['tmp_name'])||$_FILES["image"]["error"]>0){
		if(!strlen($_POST['image_base64'])){
			// error
			echo json_encode(array("error"=>1,"code"=>"file_error"));
			// return
			return false;
		}
	}
	if(isset($_FILES['image'])){
		$image=$_FILES['image'];
		$image['ext']=strtolower(pathinfo($_FILES['image']['name'],PATHINFO_EXTENSION));
	}
	if(strlen($_POST['image_base64'] ?? '')){
		$image_parts=explode(";base64,",$_POST['image_base64']);
		$image['type']=explode("data:",$image_parts[0])[1];
		$image['ext']=strtolower(explode("image/",$image_parts[0])[1]);
		$image['base64']=str_replace(" ","+",$image_parts[1]);
		$image['name']=md5(date("YmdHisu")).".".$image['ext'];
	}
	// check extension
	if(!in_array($image['ext'],array("png","jpg","jpeg","gif","svg"))){
		// error
		echo json_encode(array("error"=>1,"code"=>"extension_not_allowed","file"=>$image));
		// return
		return false;
	}
	// check file type
	if(!in_array($image["type"],array("image/png","image/gif","image/jpg","image/jpeg","image/svg+xml"))){
		// error
		echo json_encode(array("error"=>1,"code"=>"file_not_allowed","file"=>$image));
		// return
		return false;
	}
	// make file name
	$file_name=strtolower(str_replace(" ","-",$image['name']));
	// check for posted image
	if($image['tmp_name']){
		if(move_uploaded_file($image['tmp_name'],$DOC->DIR.$file_name)){$uploaded=true;}
		// check for pasted image
	}elseif(strlen($image['base64'])){
		$bytes=file_put_contents($DOC->DIR.$file_name,base64_decode($image['base64']));
		if($bytes>0){
			$image['size']=$bytes;
			$uploaded=true;
		}
	}
	// check for uploaded
	if($uploaded){
		// success
		echo json_encode(array("error"=>null,"code"=>"image_uploaded","name"=>$file_name,"path"=>$DOC->PATH."/".$file_name,"size"=>$image['size']));
		// return
		return true;
	}else{
		// error
		echo json_encode(array("error"=>1,"code"=>"uploading_error"));
		// return
		return false;
	}
}

/**
 * Image Upload - drag-n-drop (AJAX)
 */
function image_drop_upload_ajax() {

	$document = $_POST['document'];
	$image_base64     = $_POST['image_base64'];
	$image_filename   = $_POST['image_name'];

	if(Session::getInstance()->autenticationLevel()!=2){
		// error
		echo json_encode(array("error"=>1,"code"=>"not_authenticated"));
		// return
		return false;
	}

	if(!strlen($image_base64)){
		// error
		echo json_encode(array("error"=>1,"code"=>"image_empty", 'file' => $image_filename));
		// return
		return false;
	}

	// initialize document
	$DOC = new Document($document);
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}

	// We need to remove the "data:image/{type};base64," amd split it into parts from $data
	if (preg_match('/^data:image\/(\w+);base64,/', $image_base64, $type)) {
		$image_base64 = substr($image_base64, strpos($image_base64, ',') + 1);
		$type = strtolower($type[1]); // jpg, png, gif

		//check for valid image type
		if (!in_array($type, [ 'jpg', 'jpeg', 'gif', 'png' ])) {
			echo json_encode(array("error"=>1,"code"=>"extension_not_allowed","file"=>$image_filename));
			return false;
		}
		$image_base64 = str_replace( ' ', '+', $image_base64 );
		$image_base64 = base64_decode($image_base64);

		if ($image_base64 === false) {
			$args = [
				'error' => 1,
				'code' => 'base64_decode failed',
				'file' => $image_filename
			];
			echo json_encode($args);
			return false;
		}
	} else {
		$args = [
			'error' => 1,
			'code' => 'did not match data URI with image data',
			'file' => $image_filename
		];
		echo json_encode($args);
		return false;
	}

	// create the filename for the image to store with the correct extension
	$filename_parts             = explode('.', $image_filename);;
	$filename_without_extension = $filename_parts[0];
	$filename_cleaned           = strtolower(str_replace(" ","-",$filename_without_extension));
	$filename                   = "{$filename_cleaned}.{$type}";

	$filepath_absolute  = $DOC->DIR;
	$filepath_relative  = $DOC->PATH;
	$imageFile          = $filepath_absolute.$filename;

	$file = file_put_contents($imageFile, $image_base64);

	if ($file) {
		$args = [
			'error' => null,
			'code' => 'image_uploaded',
			'name' => $filename,
			'path' => $filepath_relative."/".$filename
		];
		echo json_encode($args);
		return true;
	} else {
		$args = [
			'error' => 1,
			'code' => 'image_not_uploaded',
			'name' => $filename,
			'path' => $filepath_relative."/".$filename
		];
		echo json_encode($args);
		return false;
	}

}

/**
 * Image Delete (AJAX)
 */
function image_delete_ajax() {

	$document       = $_POST['document'];
	$image_filename = $_POST['image_name'];

	if (Session::getInstance()->autenticationLevel() != 2) {
		// error
		echo json_encode(array("error" => 1, "code" => "not_authenticated"));
		// return
		return false;
	}

	// initialize document
	$DOC = new Document($document);
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}

	if (empty($image_filename)) {
		echo json_encode(array("error"=>1,"code"=>"filename_empty"));
		return false;
	}

	$filename = $DOC->DIR.$image_filename;

	if (file_exists($filename)) {
		$image_deleted = unlink($filename);
	} else {
		echo json_encode(array("error"=>1,"code"=>"image_not_found","file"=>$filename));
	}

	if ($image_deleted) {
		echo json_encode(array("error" => null, "code" => "image_deleted", "file" => $filename));
		return true;
	} else {
		echo json_encode(array("error"=>1,"code"=>"image_not_deleted","file"=>$filename));
		return false;
	}
}


/**
 * Atachment Upload (AJAX)
 */
function attachment_upload_ajax(){
	// acquire variables
	$p_document=strtolower($_POST['document']);
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// error
		echo json_encode(array("error"=>1,"code"=>"not_authenticated"));
		// return
		return false;
	}
	// check document path
	if(!strlen($p_document)){
		// error
		echo json_encode(array("error"=>1,"code"=>"document_empty"));
		// return
		return false;
	}
	// initialize document
	$DOC=new Document($p_document);
	// check for directory or make it
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}
	// check for file
	if(!isset($_FILES['attachment'])||!is_uploaded_file($_FILES['attachment']['tmp_name'])||$_FILES["attachment"]["error"]>0){
		// error
		echo json_encode(array("error"=>1,"code"=>"file_error"));
		// return
		return false;
	}
	// make attachment
	$attachment=$_FILES['attachment'];
	$attachment['ext']=strtolower(pathinfo($_FILES['attachment']['name'],PATHINFO_EXTENSION));
	// check extension
	if(!in_array($attachment['ext'],array("pdf","doc","docx","xls","xlsx","ppt","pptx"))){
		// error
		echo json_encode(array("error"=>1,"code"=>"extension_not_allowed","file"=>$attachment));
		// return
		return false;
	}
	// check file type
	if(!in_array($attachment["type"],array(
		"application/pdf",
		"application/msword",
		"application/vnd.ms-excel",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation"
	))){
		// error
		echo json_encode(array("error"=>1,"code"=>"file_not_allowed","file"=>$attachment));
		// return
		return false;
	}
	// make file name
	$file_name=strtolower(str_replace(" ","-",$attachment['name']));
	// move temporary file
	$uploaded=move_uploaded_file($attachment['tmp_name'],$DOC->DIR.$file_name);
	// check for uploaded
	if($uploaded){
		// success
		echo json_encode(array("error"=>null,"code"=>"attachment_uploaded","name"=>$file_name,"path"=>$DOC->PATH."/".$file_name,"size"=>$attachment['size']));
		// return
		return true;
	}else{
		// error
		echo json_encode(array("error"=>1,"code"=>"uploading_error"));
		// return
		return false;
	}
}

/**
 * Attachment Delete (AJAX)
 */
function attachment_delete_ajax() {

	$document             = $_POST['document'];
	$attachment_filename  = $_POST['attachment_name'];

	if (Session::getInstance()->autenticationLevel() != 2) {
		// error
		echo json_encode(array("error" => 1, "code" => "not_authenticated"));
		// return
		return false;
	}

	// initialize document
	$DOC = new Document($document);
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}

	if (empty($attachment_filename)) {
		echo json_encode(array("error"=>1,"code"=>"filename_empty"));
		return false;
	}

	$filename = $DOC->DIR.$attachment_filename;

	if (file_exists($filename)) {
		$attachment_deleted = unlink($filename);
	} else {
		echo json_encode(array("error"=>1,"code"=>"attachment_not_found","file"=>$filename));
	}

	if ($attachment_deleted) {
		echo json_encode(array("error" => null, "code" => "attachment_deleted", "file" => $filename));
		return true;
	} else {
		echo json_encode(array("error"=>1,"code"=>"attachment_not_deleted","file"=>$filename));
		return false;
	}
}

/**
 * Draft Save (AJAX)
 */
function draft_save_ajax(){
	// acquire variables
	$p_document=strtolower($_POST['document']);
	$p_content=$_POST['content'];
	// check authentication
	if(Session::getInstance()->autenticationLevel()!=2){
		// error
		echo json_encode(array("error"=>1,"code"=>"not_authenticated"));
		// return
		return false;
	}
	// check document path
	if(!strlen($p_document)){
		// error
		echo json_encode(array("error"=>1,"code"=>"document_empty"));
		// return
		return false;
	}
	// initialize document
	$DOC=new Document($p_document);
	// check for directory or make it
	if(!is_dir($DOC->DIR)){mkdir($DOC->DIR,0755,true);}
	// save draft content file
	$bytes=file_put_contents($DOC->DIR."draft.md",$p_content);
	// check for saved
	if($bytes>0){
		// success
		echo json_encode(array("error"=>null,"code"=>"draft_saved"));
		// return
		return true;
	}else{
		// error
		echo json_encode(array("error"=>1,"code"=>"draft_saving_error"));
		// return
		return false;
	}
}
