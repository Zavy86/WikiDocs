<?php
/**
 * Session class
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
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
		// set secure session cookie parameters
		session_set_cookie_params([
			'lifetime' => 0,
			'path' => '/',
			'httponly' => true,                   // prevent javascript access
			'samesite' => 'Strict'                // restrict to same-site requests
		]);
		// start php session
		session_start();
		// check for application session array
		if(!isset($_SESSION['wikidocs']) || !is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
		// check for application debug
		if(!isset($_SESSION['wikidocs']['debug'])){$this->setDebug(false);}
		// check for application session alerts array
		if(!isset($_SESSION['wikidocs']['alerts']) || !is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
		// periodically regenerate session id to prevent fixation attacks
		if (!isset($_SESSION['last_regeneration'])) {
			$_SESSION['last_regeneration'] = time();
		}
		if (time() - $_SESSION['last_regeneration'] > 3600) { // regenerate every 1 hour
			session_regenerate_id(true);
			$_SESSION['last_regeneration'] = time();
		}
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

	public function privacyAgreement(bool $value) {
		setcookie('privacy', $value, [
			'expires' => time() + (60 * 60 * 24 * 30),
			'path' => '/',
			'httponly' => true,
			'samesite' => 'Strict'
		]);
		header('Location:' . PATH . DOC);
	}

	public function privacyAgreeded():bool{
		if(!strlen(PRIVACY ?? '')){return true;}
		return boolval($_COOKIE['privacy'] ?? false);
	}

}
