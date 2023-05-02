<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Initialize session and setup default sessions variables
 */
function wdf_session_start():void{
	// start php session
	session_start();
	// check for application session array
	if(!isset($_SESSION['wikidocs']) || !is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
	// check for application session alerts array
	if(!isset($_SESSION['wikidocs']['alerts']) || !is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
}

/**
 * Authentication level
 *
 * @return int 0 none, 1 view, 2 edit
 */
function wdf_authenticated():int{
	return intval($_SESSION['wikidocs']['authenticated'] ?? '');
}

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param mixed $variable Dump variable
 * @param ?string $label Dump label
 * @param ?string $class Dump class
 * @param bool $force Force dump also if debug is disabled
 */
function wdf_dump($variable,?string $label=null,?string $class=null,bool $force=false):bool{
	if(!DEBUG && !$force){return false;}
	echo "\n<!-- dump -->\n";
	echo "<pre class='debug ".$class."'>\n";
	if($label<>null){echo "<b>".$label."</b>\n";}
	if(is_string($variable)){$variable=str_replace(array("<",">"),array("&lt;","&gt;"),$variable);}
	print_r($variable);
	echo "</pre>\n<!-- /dump -->\n";
	return true;
}

/**
 * Redirect (if debug is enabled show a redirect link)
 *
 * @param string $location Location URL
 */
function wdf_redirect(string $location):void{
	if(DEBUG){die("<a href=\"".$location."\">".$location."</a>");}
	exit(header("location: ".$location));
}

/**
 * Alert (if debug is enabled show a debug message)
 *
 * @param string $message Alert message
 * @param string $class Alert class (success|info|warning|danger)
 * @return bool
 */
function wdf_alert(string $message,string $class="info"):bool{
	// checks
	if(!$message){return false;}
	// build alert object
	$alert=new stdClass();
	$alert->timestamp=time();
	$alert->message=$message;
	$alert->class=$class;
	// check for debug
	if(!DEBUG){
		// add alert to session alerts
		$_SESSION['wikidocs']['alerts'][]=$alert;
	}else{
		// swicth class
		switch($class){
			case "success":$message="(!) ".$message;break;
			case "warning":$message="/!\\ ".$message;break;
			case "danger":$message="<!> ".$message;break;
			default:$message="(?) ".$message;
		}
		// dump alert
		wdf_dump($message,"ALERT");
	}
	// return
	return true;
}

/**
 * Timestamp Format
 *
 * @param ?int $timestamp Unix timestamp
 * @param string $format Date Time format (see php.net/manual/en/function.date.php)
 * @return string|boolean Formatted timestamp or false
 * @throws Exception
 */
function wdf_timestamp_format(?int $timestamp,string $format="Y-m-d H:i:s"){
	if(!is_numeric($timestamp) || $timestamp==0){return false;}
	// build date time object
	$datetime=new DateTime("@".$timestamp);
	// return date time formatted
	return $datetime->format($format);
}

/**
 * Document list in path
 *
 * @param ?string $parent Parent Document ID
 * @return Document[] array of documents
 */
function wdf_document_list(?string $parent=null):array{
	$documents_array=array();
	// check parameters
	if(substr((string)$parent,-1)!="/"){$parent.="/";}
	if($parent=="/"){$parent=null;}
	// make directory full path
	$directory_path=DIR."datasets/documents/".$parent;
	// check for directory
	if(is_dir($directory_path)){
		// scan directory for documents
		$elements=scandir($directory_path);
		// cycle all elements
		foreach($elements as $element_fe){
			// skip versioning and files
			if(in_array($element_fe,array(".","..","versions","homepage"))){continue;}
			if(!is_dir($directory_path.$element_fe)){continue;}
			// build directory
			$document=new stdClass();
			$document->id=$element_fe;
			$document->path=$parent.$element_fe;
			$document->url=URL.$document->path;
			$document->dir=$directory_path.$element_fe;
			// add element to documents array
			$documents_array[]=$document;
		}
	}
	// return
	return $documents_array;
}

/**
 * Documents List
 *
 * @param ?string $parent Parent document ID
 * @return Document[] array of Documents
 */
function wdf_document_index(?string $parent=null):array{
	// definitions
	$index_array=array();
	$documents_array=array();
	// get document list
	$directories_array=wdf_document_list($parent);
	// build documents array
	if(count($directories_array)){
		// cycle all documents
		foreach($directories_array as $document_fe){
			// definitions
			$document_url=$parent."/".$document_fe->id;
			$document_label=wdf_document_title($document_url);
			// check document url
			if(substr($document_url,0,1)=="/"){$document_url=substr($document_url,1);}
			// add document to documents array
			$documents_array[$document_url]=$document_label;
		}
	}
	// sort document array by title
	asort($documents_array);
	// cycle all documents and build index array
	foreach($documents_array as $url_fe=>$label_fe){
		// build index element
		$element=new stdClass();
		$element->label=$label_fe;
		$element->url=$url_fe;
		// add element to index array
		$index_array[]=$element;
	}
	// return
	return $index_array;
}

/**
 * Documents search in path
 *
 * @param string $query String for search
 * @param ?string $parent Parent Document ID
 * @return array of results
 */
function wdf_document_search(string $query,?string $parent=null):array{
	// tree to array
	function tree_to_array(&$array,$parent=null){
		foreach(wdf_document_list($parent) as $dir_fe){
			//wdf_dump($dir);
			$array[]=$dir_fe->path;
			tree_to_array($array,$dir_fe->path);
		}
	}
	// definitions
	$paths_array=array();
	$matches_array=array();
	$queries_array=explode(" ",$query);
	// check for query or return the empty array
	if(!count($queries_array)){return $matches_array;}
	// get all documents directories recursively
	tree_to_array($paths_array,$parent);
	//wdf_dump($paths_array);
	// cycle all directories
	foreach($paths_array as $path_fe){
		// check if content file exist
		if(file_exists(DIR."datasets/documents/".$path_fe."/content.md")){
			// open file handle for read
			$handle=fopen(DIR."datasets/documents/".$path_fe."/content.md","r");
			if($handle){
				while(!feof($handle)){
					// get line in buffer
					$buffer=fgets($handle);
					// define a buffer id
					$buffer_id=md5($buffer.rand());
					// cycle all query words
					foreach($queries_array as $query_fe){
						// check for query word
						if(stripos($buffer,$query_fe)!==false){
							// highlight query word in buffer
							$buffer=str_ireplace($query_fe,"<mark>".$query_fe."</mark>",$buffer);
							$matches_array[$path_fe][$buffer_id]=$buffer;
							// skip current file after 3 matches
							if(count($matches_array[$path_fe])>2){continue(3);}
						}
					}
				}
				fclose($handle);
			}
		}
	}
	return $matches_array;
}

/**
 * Document title
 *
 * @param string $document Document ID
 * @return string Document title
 */
function wdf_document_title(string $document):string{
	$title='';
	// make path
	$content_path=DIR."datasets/documents/".$document."/content.md";
	// load content line by line to find document title if exist
	if(file_exists($content_path)){
		$handle=fopen($content_path,"r");
		while(!feof($handle)){
			$line=fgets($handle);
			if(substr($line,0,2)=="# "){
				$title=trim(substr($line,1));
				break;
			}
		}
		fclose($handle);
	}
	if(!strlen($title)){
		// make title by path
		$hierarchy=explode("/",$document);
		$title=ucwords(str_replace("-"," ",end($hierarchy)));
	}
	// return
	return $title;
}
