<?php
/**
 * Session class
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

final class Session{

	private static Session $singleton;

	private function __construct(){
		$this->start();
	}

	static function getInstance():Session{
		if(!isset(self::$singleton)){
			self::$singleton=new Session();
		}
		return self::$singleton;
	}

	function start(){
		// start php session
		session_start();
		// check for application session array
		if(!isset($_SESSION['wikidocs']) || !is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
		// check for application debug
		if(!isset($_SESSION['wikidocs']['debug'])){$this->setDebug(false);}
		// check for application session alerts array
		if(!isset($_SESSION['wikidocs']['alerts']) || !is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
	}

	public function destroy(){
		session_destroy();
	}

	public function restart(){
		$this->destroy();
		$this->start();
	}

	public function autenticationLevel():int{
		return intval($_SESSION['wikidocs']['authenticated'] ?? '');
	}

	public function isAuthenticated():bool{
		return ($this->autenticationLevel()>0);
	}

	public function setDebug(bool $value){
		$_SESSION['wikidocs']['debug']=$value;
	}

	public function isDebug():bool{
		return boolval($_SESSION['wikidocs']['debug']);
	}

}
