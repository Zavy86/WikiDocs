<?php
/**
 * WikiDocs class
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * WikiDocs class
 */
class WikiDocs{

 /** Properties */
 protected $DEBUG;
 protected $VERSION;
 protected $HOST;
 protected $ROOT;
 protected $PATH;
 protected $URL;
 protected $DIR;
 protected $TITLE;
 protected $SUBTITLE;
 protected $OWNER;
 protected $NOTICE;
 protected $COLOR;
 protected $DARK;
 protected $AUTHENTICATED;
 protected $MODE;

 /**
  * Constructor
  */
 public function __construct(){
  // definitions
  $this->DEBUG=DEBUG;
  $this->VERSION=VERSION;
  $this->TITLE=TITLE;
  $this->SUBTITLE=SUBTITLE;
  $this->OWNER=OWNER;
  $this->NOTICE=NOTICE;
  $this->COLOR=COLOR;
  $this->DARK=DARK;
  $this->HOST=HOST;
  $this->ROOT=ROOT;
  $this->PATH=PATH;
  $this->URL=URL;
  $this->DIR=DIR;
  $this->AUTHENTICATED=wdf_authenticated();
  $this->MODE=MODE;
  // check for color
  if(substr($this->COLOR,0,1)!="#"){$this->COLOR="#4CAF50";}
  if(!is_bool($this->DARK)){$this->DARK=false;}
 }

 /**
  * Get property
  *
  * @param string $property Property name
  * @return type Property value
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

}
?>