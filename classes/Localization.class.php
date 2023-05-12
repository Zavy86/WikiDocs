<?php
/**
 * Localization class
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

final class Localization{

	private static Localization $singleton;

	private array $strings=[];

	private function __construct(){
		// load default language
		$localization=Localization::load("en");
		if(empty($localization)){die("/!\ Error loading 'en' localization file..");}
		foreach($localization as $key=>$value){$this->strings[$key]=$value;}
		// check if language is defined
		if(!defined("LANG")){define('LANG',"en");}
		// check if language is not the default
		if(LANG!="en"){
			$localization=Localization::load(LANG);
			if(empty($localization)){echo("/!\ Error loading '".LANG."' localization file..");}
			else{foreach($localization as $key=>$value){$this->strings[$key]=$value;}}
		}
	}

	static function getInstance():Localization{
		if(!isset(self::$singleton)){
			self::$singleton=new Localization();
		}
		return self::$singleton;
	}

	public static function available():array{
		$availableLocalizations=[];
		foreach(scandir(BASE."localizations") as $file){
			if(substr(strtolower($file),-5)==".json"){
				$lang=substr($file,0,-5);
				$localization=Localization::load($lang);
				$availableLocalizations[$lang]=$localization['Language'];
			}
		}
		return $availableLocalizations;
	}

	private static function load(string $lang):array{
		if(!file_exists(BASE."localizations/".$lang.".json")){return array();}
		$parsed=json_decode(file_get_contents(BASE."localizations/".$lang.".json"),true);
		return (is_array($parsed)?$parsed:array());
	}

	public function getString(string $key):string{
		if(!array_key_exists($key,$this->strings)){return "{{".$key.":localization-not-found}}";}
		else return $this->strings[$key];
	}

	public function __get(string $key):string{
		return $this->getString($key);
	}

}
