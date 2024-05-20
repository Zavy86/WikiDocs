<?php
/**
 * Document class
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

final class Document{

	protected string $ID;
	protected string $PATH;
	protected string $URL;
	protected string $DIR;
	protected string $TITLE;
	protected string $VERSION;
	protected ?string $FILE;
	protected ?int $TIMESTAMP;

	/**
	 * Constructor
	 *
	 * @param string $id Document ID (examples: homepage, samples/typography )
	 */
	public function __construct(string $id){
		// definitions
		$this->ID=$id;
		$this->PATH=PATH."datasets/documents/".$this->ID;
		$this->URL=URL.$this->ID;
		$this->DIR=ROOT.$this->PATH."/";
		$this->TITLE=self::getTitle($this->ID);
		$this->VERSION=(strlen($_GET['version']??'')?$_GET['version']:"latest");
		$this->FILE=$this->DIR."content.md";
		$this->TIMESTAMP=null;
		// check if file exist
		if(!file_exists($this->FILE)){$this->FILE=null;}
		if(file_exists($this->FILE ?? '')){$this->TIMESTAMP=filemtime($this->FILE);}
	}

	/**
	 * Get property
	 *
	 * @param string $property Property name
	 * @return mixed Property value
	 */
	public function __get(string $property){return $this->{$property};}

	/**
	 * Export all properties
	 *
	 * @return array of properties
	 */
	public function export():array{
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
	public function loadContent($paths="WEB"):string{
		// check for specific version
		if($this->VERSION!=="latest"){
			$file_path=$this->DIR."versions/".$this->VERSION.".md";
			// check if exists or fallback to default file
			if(!file_exists($file_path)){$file_path=$this->FILE ?? '';}
		}else{$file_path=$this->FILE ?? '';}
		// check if file exist
		if(!file_exists($file_path)){return false;}
		// load content from file
		$content=file_get_contents($file_path);
		// replace path placeholders
		switch(strtoupper(trim($paths))){
			case "WEB":$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),array(PATH,$this->PATH."/"),$content);break;
			case "FS":$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),array(URL,$this->DIR."/"),$content);break;
			default:$source=str_replace(array("{{APP_PATH}}","{{DOC_PATH}}"),"",$content);
		}
		// return
		return $source;
	}

	/**
	 * Document render
	 *
	 * @return string Document HTML source code
	 */
	public function render():string{
		// load content from file and convert paths for web
		$content=$this->loadContent("WEB");
		// add content or if content is null add document title to source code
		if($content!=false){$source=$content;}else{$source="# ".$this->TITLE."\n";}
		// check for attachments
		$attachments_array=$this->attachments();
		if(count($attachments_array)){
			// build attachments index
			$source.="\n\n___\n";
			// cycle all attachments
			foreach($attachments_array as $attachment_fe){
				$source.="- [".$attachment_fe->label."](".$attachment_fe->url.")\n";
			}
		}
		// search for sub-documents
		$sub_documents=Document::index($this->ID);
		// check for elements
		if(count($sub_documents)){
			// build sub-documents index
			$source.="\n\n___\n";
			// cycle all elements
			foreach($sub_documents as $sub_element_fe){
				// add element list
				//wdf_dump($sub_element_fe->url);
				$source.="- [".$sub_element_fe->label."](".PATH.$sub_element_fe->url.")\n";
				// search for sub-sub-documents
				$sub_sub_documents=Document::index($sub_element_fe->url);
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
				// check for homepage
				if($this->ID=='homepage'){
					// welcome
					$source="# Welcome\n";
					$source.="This is your Wiki|Docs home page.\n\n";
					// check for edit authorization
					if(Session::getInstance()->autenticationLevel()==2){
						// document can be created
						$source.="Click the edit button to create this page!";
					}
				}else{
					// document not found
					$source="# Error 404\n";
					$source.="We are sorry but the page you are looking for does not exist.\n\n";
					// check for edit authorization
					if(Session::getInstance()->autenticationLevel()==2){
						// document can be created
						$source.="Click the edit button to create this page!";
					}
				}
			}
		}
		// return source code
		return $source;
	}

	/**
	 * Document images
	 *
	 * @return array of images
	 */
	public function images():array{
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
				// check extensions
				if(!in_array(end($file_extension),array("png","gif","jpg","jpeg","svg", "webp"))){continue;}
				// add element to documents array
				$images_array[]=$element_fe;
			}
		}
		// sort images
		sort($images_array);
		// return
		return $images_array;
	}

	/**
	 * Document attachments
	 *
	 * @return array of attachments
	 */
	public function attachments():array{
		// definition
		$attachments_array=array();
		// check directory
		if(is_dir($this->DIR)){
			// scan directory for documents
			$elements=scandir($this->DIR);
			// cycle all elements
			foreach($elements as $element_fe){
				// skip directories
				if(is_dir($this->DIR."/".$element_fe)){continue;}
				$file_extension=explode(".",$element_fe);
				// check extensions
				if(!in_array(end($file_extension),array("pdf","doc","docx","xls","xlsx","ppt","pptx"))){continue;}
				// make element
				$attachment=new stdClass();
				$attachment->label=$element_fe;
				$attachment->url=substr(URL,0,-1).$this->PATH."/".$element_fe;
				// add element to documents array
				$attachments_array[]=$attachment;
			}
		}
		// sort attachments
		sort($attachments_array);
		// return
		return $attachments_array;
	}

	/**
	 * Document versions
	 *
	 * @return array of versions
	 */
	public function versions():array{
		// definition
		$versions_array=array();
		// check directory
		if(is_dir($this->DIR."/versions/")){
			// scan directory for documents
			$elements=scandir($this->DIR."/versions/");
			// cycle all elements
			foreach($elements as $element_fe){
				// skip directories
				if(is_dir($this->DIR."/versions/".$element_fe)){continue;}
				$file_extension=explode(".",$element_fe);
				// check extensions
				if(end($file_extension)!=='md'){continue;}
				// make element
				$version=new stdClass();
				$version->label=$element_fe;
				$version->url=$this->URL."?version=".substr($element_fe,0,-3);
				// add element to documents array
				$versions_array[]=$version;
			}
		}
		// sort versions
		sort($versions_array);
		// return
		return $versions_array;
	}

	/**
	 * Document hierarchy
	 *
	 * @return array of hierarchy links
	 */
	public function hierarchy():array{
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



	/**
	 * Document title
	 *
	 * @param string $document Document ID
	 * @return string Document title
	 */
	static function getTitle(string $document):string{
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

	/**
	 * Document Update Date
	 *
	 * @param string $document Document ID
	 * @return integer Update Date
	 */
	static function getUpdateDate(string $document):string{
		$date=0;
		// make path
		$content_path=DIR."datasets/documents/".$document."/content.md";
		// load content line by line to find document title if exist
		if(file_exists($content_path)){
			$date=filemtime($content_path);
		}
		// return
		return $date;
	}

	/**
	 * Document list in path
	 *
	 * @param ?string $parent Parent Document ID
	 * @return Document[] array of documents
	 */
	static function list(?string $parent=null):array{
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
				if(in_array($element_fe,array(".","..","versions"))){continue;}
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
	 * Documents Index
	 *
	 * @param ?string $parent Parent document ID
	 * @return Document[] array of Documents
	 */
	static function index(?string $parent=null):array{
		// definitions
		$index_array=array();
		$documents_array=array();
		// get document list
		$directories_array=Document::list($parent);
		// build documents array
		if(count($directories_array)){
			// cycle all documents
			foreach($directories_array as $document_fe){
				if($document_fe->id=="homepage"){continue;}
				// definitions
				$document_url=$parent."/".$document_fe->id;
				$document_label=Document::getTitle($document_url);
				// check document url
				if(substr($document_url,0,1)=="/"){$document_url=substr($document_url,1);}
				// add document to documents array
				$documents_array[$document_url]=$document_label;
			}
		}
		// sort document array by title
		asort($documents_array, SORT_NATURAL);
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
	static function search(string $query,?string $parent=null):array{
		// trim the query to remove leading and trailing spaces
		$query = trim($query);
		// return an empty array if the query is empty after trimming
		if (empty($query)) {
			return array();
		}
		// tree to array
		function tree_to_array(&$array,$parent=null){
			foreach(Document::list($parent) as $dir_fe){
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
								$buffer=self::highlighting($query_fe,$buffer);
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

	private static function highlighting($search,$string){
		$index=0;
		$result="";
		while($index<strlen($string)){
			if(strtolower(substr($string,$index,strlen($search)))===strtolower($search)){
				$result.="<mark>".substr($string,$index,strlen($search))."</mark>";
				$index=$index+strlen($search);
			}else{
				$result.=substr($string,$index,1);
				$index++;
			}
		}
		return $result;
	}

}
