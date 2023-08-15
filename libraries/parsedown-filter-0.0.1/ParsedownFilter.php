<?php
/**
 * Parsedown Filter
 *
 * An extension for Parsedown http://parsedown.org
 * and ParsedownExtra https://github.com/erusev/parsedown-extra
 * and ParsedownExtended https://github.com/BenjaminHoegh/ParsedownExtended
 *
 * Written by Christopher Andrews http://arduino.land/
 * Released under GPL & MIT licenses.
 *
 * edit by @zavy86
 *
 */

class ParsedownFilter extends ParsedownExtended{

	function __construct(array $params=null){
		parent::__construct($params);
	}

	protected function element(array $Element){
		if(array_key_exists('name',$Element)){
			$result=$this->filters($Element);
			if($result===false){
				// remove tag
			}
		}
		return parent::element($Element);
	}

	protected function filters(array &$Element){
		if($Element['name']=='a'){
			$url=$Element['attributes']['href'];
			/***
			 * If there is no protocol handler, and the link is not an open protocol address,
			 * the links must be relative, so we can return as there is nothing to do.
			 ***/
			if(strpos($url,'://')===false){
				if((($url[0]=='/') && ($url[1]!='/')) || ($url[0]!='/')){
					return;
				}
			}
			if(strpos($url,$_SERVER["SERVER_NAME"])===false){
				$Element['attributes']['rel']='nofollow';
				$Element['attributes']['target']='_blank';
			}
		}
	}
}
