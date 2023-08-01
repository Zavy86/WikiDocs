<?php
/**
 * Style class
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

final class Theme{

	private static Theme $singleton;

	private array $strings=[];

	private function __construct(){
		// load default theme
		$theme=Theme::load("default-theme");
		if(empty($theme)){die("/!\ Error loading default theme file..");}
		foreach($theme as $key=>$value){$this->strings[$key]=$value;}
		// check if theme is defined
		if(!defined("THEME")){define('THEME',"default-theme");}
		// check if theme is not the default
		if(THEME!="default-theme"){
			$theme=Theme::load(THEME);
			if(empty($theme)){echo("/!\ Error loading '".THEME."' theme file...");}
			else{foreach($theme as $key=>$value){$this->strings[$key]=$value;}}
		}
	}

	static function getInstance():Theme{
		if(!isset(self::$singleton)){
			self::$singleton=new Theme();
		}
		return self::$singleton;
	}

	public static function available():array{
		$availableThemes=[];
		foreach(scandir(BASE."styles") as $file){
			if(substr(strtolower($file),-5)==".json"){
				$appearance=substr($file,0,-5);
				$theme=Theme::load($appearance);
				$availableThemes[$appearance]=$theme['Name'];
			}
		}
		return $availableThemes;
	}

	private static function load(string $theme):array{
		if(!file_exists(BASE."styles/".$theme.".json")){return array();}
		$parsed=json_decode(file_get_contents(BASE."styles/".$theme.".json"),true);
		return (is_array($parsed)?$parsed:array());
	}

	public function getString(string $key):string{
		if(!array_key_exists($key,$this->strings)){return "{{".$key.":theme-not-found}}";}
		else return $this->strings[$key];
	}

	public function __get(string $key):string{
		return $this->getString($key);
	}

}
