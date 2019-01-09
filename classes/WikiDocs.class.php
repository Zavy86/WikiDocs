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
  $this->HOST=HOST;
  $this->ROOT=ROOT;
  $this->PATH=PATH;
  $this->URL=URL;
  $this->DIR=DIR;
  $this->AUTHENTICATED=wdf_authenticated();
  $this->MODE=MODE;
 }

 /**
  * Get property
  *
  * @param string $property Property name
  * @return type Property value
  */
 public function __get($property){return $this->$property;}

}
?>