<?php
/**
 * Document class
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Document class
 */
class Document{

 /** Properties */
 protected $ID;
 protected $PATH;
 protected $URL;
 protected $DIR;
 protected $TITLE;
 protected $FILE;
 protected $TIMESTAMP;

 /**
  * Constructor
  *
  * @param string $id Document ID (examples: homepage, samples/typography )
  */
 public function __construct($id){
  // definitions
  $this->ID=$id;
  $this->PATH=PATH."documents/".$this->ID;
  $this->URL=URL.$this->ID;
  $this->DIR=ROOT.$this->PATH."/";
  $this->TITLE=wdf_document_title($this->ID);
  $this->FILE=$this->DIR."content.md";
  $this->TIMESTAMP=null;
  // check if file exist
  if(!file_exists($this->FILE)){$this->FILE=null;}
  if(file_exists($this->FILE)){$this->TIMESTAMP=filemtime($this->FILE);}
 }

 /**
  * Get property
  *
  * @param string $property Property name
  * @return string Property value
  */
 public function __get($property){return $this->$property;}

 /**
  * Export all properties
  */
 public function export(){
  $properties_array=array();
  foreach($this as $key => $value){
   $properties_array[$key]=$value;
  }
  return $properties_array;
 }

 /**
  * Load document content form source file
  *
  * @param string $paths Format for paths [WEB|FS]
  * @return string Content markdown source code
  */
 public function loadContent($paths="WEB"){
  // check if file exist
  if(!file_exists($this->FILE)){return false;}
  // load content from file
  $content=file_get_contents($this->FILE);
  // replace path placeholders
  switch(strtoupper(trim($paths))){
   case "WEB":$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),array(PATH,$this->PATH."/"),$content);break;
   case "FS":$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),array(URL,$this->DIR."/"),$content);break;
   default:$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),"",$content);
  }
  // return
  return $source;
 }

 /*
  * Document render
  *
  * @return string Document HTML source code
  */
 public function render(){
  // load content from file and convert paths for web
  $content=$this->loadContent("WEB");
  // add content or if content is null add document title to source code
  if($content!=false){$source=$content;}else{$source="# ".$this->TITLE."\n";}
	 // search for sub-documents
	 $sub_documents=wdf_document_index($this->ID);
	 // check for elements
	 if(count($sub_documents)){
		 // build sub-documents index
		 $source.="\n\n___\n";
		 // cycle all elements
		 foreach($sub_documents as $sub_element_fe){
			 // add element list
			 $source.="- [".$sub_element_fe->label."](".PATH.$sub_element_fe->url.")\n";
			 // search for sub-sub-documents
			 $sub_sub_documents=wdf_document_index($sub_element_fe->url);
			 // cycle all sub-sub-documents
			 foreach($sub_sub_documents as $sub_sub_element_fe){
				 // add element list
				 $source.="\t- [".$sub_sub_element_fe->label."](".PATH.$sub_sub_element_fe->url.")\n";
			 }
		 }
	 }
  // check for content or elements index
  if(!$content && !count($sub_documents)){
   // check for view mode
   if(MODE=="view"){
    // document not found
    $source="# Error 404 \n";
    $source.="We are sorry but the page you are looking for does not exist.\n\n";
    // check for edit authorization
    if(wdf_authenticated()==2){
     // document can be created
     $source.="Click the edit button to create this page!";
    }
   }
  }
  // return source code
  return $source;
 }

 /*
  * Document images
  */
 public function images(){
  // definition
  $images_array=array();
  // check directory
  if(is_dir($this->DIR)){
   // scan directory for documents
   $elements=scandir($this->DIR);
   // cycle all elements
   foreach($elements as $element_fe){
    // skip directories
    if(is_dir($this->DIR."/".$element_fe)){continue;}
    $file_extension=explode(".",$element_fe);
    if(!in_array(end($file_extension),array("png","gif","jpg","jpeg","svg"))){continue;}
    // add element to documents array
    $images_array[]=$element_fe;
   }
  }
  // sort images
  sort($images_array);
  // return
  return $images_array;
 }

 /*
  * Document hierarchy
  */
 public function hierarchy(){
  // definition
  $hierarchy_array=array();
  // explode document path
  $breadcrumbs=explode("/",$this->ID);
  // cycle all segments
  foreach($breadcrumbs as $index=>$breadcrumb){
   // make path
   $path=null;
   foreach($breadcrumbs as $index_link=>$breadcumb_link){if($index_link<=$index){$path.="/".$breadcumb_link;}}
   // build item
   $item=new stdClass();
   $item->label=$breadcrumb;
   $item->path=substr($path,1);
   // add item to hierarchy array
   $hierarchy_array[]=$item;
  }
  // return
  return $hierarchy_array;
 }

}
