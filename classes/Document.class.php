<?php
/**
 * Document class
 *
 * @package Document
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
  * Get
  *
  * @param string $property Property name
  * @return string Property value
  */
 public function __get($property){return $this->$property;}

 /**
  * Load document content form source file
  *
  * /** @todo separare la creazione dell'indice e valutare come aggiungere pagina successiva e precedente..
  *
  * @param string $paths Path format (WEB|FS)
  * @return string Content in HTML source code
  */
 public function loadContent($paths="WEB"){
  // check if file exist
  if(file_exists($this->FILE)){
   // load content from file
   $content=file_get_contents($this->FILE);
  }
  // check for content
  if(!strlen($content)){
   // search for documents
   $index_array=wdf_document_list($this->ID);
   // check for elements
   if(count($index_array)){
    // build index
    $content="# ".$this->TITLE."\n";
    // cycle all documents
    foreach($index_array as $element_fe){
     // make document list
     $content.="- [".$element_fe->label."](".PATH.$element_fe->url.")\n";
     // search for sub-documents
     $subindex_array=wdf_document_list($element_fe->url);
     // cycle all sub-documents
     foreach($subindex_array as $subelement_fe){
      // make sub-documents list
      $content.="\t- [".$subelement_fe->label."](".PATH.$subelement_fe->url.")\n";
     }
    }
   }else{
    // check for edit authorization
    if(wdf_authenticated()==2){
     // new document
     $content="# ".$this->TITLE."\n";
     if(MODE=="view"){
      $content.="We are sorry but the page you are looking for does not exist.\n\n";
      $content.="Click the edit button to create this page!";
     }
    }else{
     // document not found
     $content="# Error 404 \n";
     $content.="We are sorry but the page you are looking for does not exist.\n\n";
    }
   }
  }
  // replace path placeholders
  switch(strtoupper(trim($paths))){
   case "WEB":
    $content=str_replace("{{APP_PATH}}",PATH,$content);
    $content=str_replace("{{DOC_PATH}}",$this->PATH."/",$content);
    break;
   case "FS":
    $content=str_replace("{{APP_PATH}}",URL,$content);
    $content=str_replace("{{DOC_PATH}}",$this->DIR."/",$content);
    break;
  }
  // return
  return $content;
 }

 /*
  * Document images
  */
 public function images(){
  // definition
  $images_array=array();
  // scan directory for documents
  $elements=scandir($this->DIR);
  // cycle all elements
  foreach($elements as $element_fe){
   // skip directories
   if(is_dir($this->DIR."/".$element_fe)){continue;}
   $file_extension=explode(".",$element_fe);
   if(!in_array(end($file_extension),array("png","gif","jpg","jpeg"))){continue;}
   // add element to documents array
   $images_array[]=$element_fe;
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

?>