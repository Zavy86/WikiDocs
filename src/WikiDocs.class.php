<?php
/**
 * WikiDocs class
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

final class WikiDocs{

	/** Properties */
	protected bool $DEBUG;
	protected string $VERSION;
	protected string $HOST;
	protected string $ROOT;
	protected string $PATH;
	protected string $URL;
	protected string $DIR;
	protected string $TITLE;
	protected string $SUBTITLE;
	protected string $OWNER;
	protected string $NOTICE;
	protected string $COLOR;
	protected bool $DARK;
	protected bool $AUTHENTICATED;
	protected string $MODE;

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
	 * @return mixed Property value
	 */
	public function __get(string $property){return $this->{$property};}

	/**
	 * Export all properties
	 */
	public function export():array{
		$properties_array=array();
		foreach($this as $key => $value){
			$properties_array[$key]=$value;
		}
		return $properties_array;
	}

}
