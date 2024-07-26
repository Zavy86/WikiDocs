/**
 * Initializations Script
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

// Detect touch screen and enable scrollbar if necessary
function is_touch_device(){
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch(e) {
    return false;
  }
}

// Plugin initialization
$(document).ready(function(){
  const sidenav = $('.sidenav');
  sidenav.sidenav({
    edge: 'left',
    draggable: true
  });
  $('.tooltipped').tooltip();
  $('.modal').modal();
  // Check for touch screen devices
  if(is_touch_device()) {
    $("#nav-mobile").css({overflow: "auto"});
  }
});
