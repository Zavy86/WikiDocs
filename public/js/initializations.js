/**
 * Initializations Script
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

// Detect touch screen and enable scrollbar if necessary
function is_touch_device(){
 try{
  document.createEvent("TouchEvent");
  return true;
 }catch(e){
  return false;
 }
}

// Check for touch screen devices
if(is_touch_device()){$("#nav-mobile").css({overflow:"auto"});}

// Plugin initialization
$('.sidenav').sidenav();
$('.tooltipped').tooltip();
$('.modal').modal();
