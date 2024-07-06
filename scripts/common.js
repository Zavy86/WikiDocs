// insert "insertStr" to "str"
function insertStr (str, index, insertStr) {
    return str.substring(0, index) + insertStr + str.substring(index);
}

// fill zero in left
function padLeft(num, length) {
    return (Array(length).join('0') + num).slice(-length);
}

// get host name
function HostName(){
    let url=window.location.href;
    let position = -1;
    let count = 0;

    for (let i = 0; i<url.length ; i++) {
        if (url[i] === '/') {
            count++;
            if (count === 3) {
                position = i;
                break;
            }
        }
    }

    if (position == -1)
        return "";
    else
        return url.substr(0,position+1);
}

// like {{DOC_PATH}}
function DOC_PATH(){
    var pathname=document.location.pathname;

    if((pathname.substr(-1))!='/') pathname = pathname + '/';

    var index=pathname.substr(1).indexOf("/");
    return insertStr(pathname, index+1, '/datasets/documents');
}

// like {{APP_PATH}}
function APP_PATH(){
    var pathname=document.location.pathname;
    var index=pathname.substr(1).indexOf("/");
    return pathname.substr(0,index+2);
}

// homepage/
function HOME_PATH(){
    return APP_PATH() + 'datasets/documents/';
}

// homepage/config/images/
function IMAGE_PATH(){
    return HOME_PATH() + 'homepage/config/images/';
}

// homepage/config/javascript/
function JS_PATH(){
    return HOME_PATH() + 'homepage/config/javascript/';
}


function showimage(img, width) {
    var fn = DOC_PATH() + img;
    document.write('<a href="'+fn+'"><img src="'+fn+'" width="'+width+'"></a>');
}

function openUrlWithNewWindow(url) {
    window.open(url);
}

function openUrlWithQuery(url, id) {

    // get input value
    var inputValue = document.getElementById(id).value;

    // input value as query param
    if (url.indexOf("%1")>-1)
        queryUrl = url.replace("%1", encodeURI(inputValue));
    else
        queryUrl = url + encodeURIComponent(inputValue);

    // open url in new windows/tab
    window.open(queryUrl);
}

function openUrlWithNewWindow(url) {
    window.open(url);
}


// show search
function WikiDocs_ShowSearch(Title='') {
    document.write('<div>');

    // show search title
    if (Title !='')
        document.write('<span class="wikidocs_search_Title"><a href="'+APP_PATH()+'homepage/config/search" title="config">Search</a></span>');

    for (i=0; i<wikidocs_ArraySearch.length; i++){

        if(wikidocs_ArraySearch[i].length < 1) continue;

        vid = "SearchInput" + i;

        // button
        v0 = wikidocs_ArraySearch[i][0];
        v1 = v2 = v3 = v4 = "";
        // button url
        if(wikidocs_ArraySearch[i].length > 1)
            v1 = wikidocs_ArraySearch[i][1];
        // button url placeholder
        if(wikidocs_ArraySearch[i].length > 2)
            v2 = wikidocs_ArraySearch[i][2];
        // button url placeholder input_style
        if(wikidocs_ArraySearch[i].length > 3)
            v3 = wikidocs_ArraySearch[i][3];
        // button url placeholder input_style button_style
        if(wikidocs_ArraySearch[i].length > 4)
            v4 = wikidocs_ArraySearch[i][4];

        if((v1.indexOf('://') == -1)||(i == 0)) {
            search_str = '<div class="wikidocs_search_category"><span class="wikidocs_search_category" style="'+v4+'">'+wikidocs_ArraySearch[i][0]+'</span></div>';
        }
        else {
            search_str = '<div class="wikidocs_search_container"><form onclick="return false"><input class="wikidocs_search_input browser-default" style="'+v3+'" type="text" id="'+vid+'" placeholder="'+v2+'"> <button class="wikidocs_search_button" style="'+v4+'" onclick="openUrlWithQuery(\''+v1+'\' , \''+ vid+'\')">'+v0+'</button></form></div>';
        }

        // write
        document.write(search_str);
    }
    document.write('</div>');
}

// show navigator
function WikiDocs_ShowNav(Title=''){
    document.write('<div>');

    if (Title != '')
        document.write('<span class="wikidocs_nav_Title"><a href="'+APP_PATH()+'homepage/config/nav" title="config">Navigator</a></span>');

    document.write('<table cellpadding="0" cellspacing="0" width="100%">');
    document.write('<tr class="no-border"><td width="80" class="wikidocs_nav_td"><div>');

    for (i=0; i<wikidocs_ArrayNav.length; i++) {

        if(wikidocs_ArrayNav[i].length < 1) continue;

        text = wikidocs_ArrayNav[i][0];
        link = '';
        tip = '';
        style = '';

        // link
        if(wikidocs_ArrayNav[i].length > 1)
            link = wikidocs_ArrayNav[i][1];
        // tip
        if(wikidocs_ArrayNav[i].length > 2)
            tip = wikidocs_ArrayNav[i][2];
        // link style
        if(wikidocs_ArrayNav[i].length > 3)
            style = wikidocs_ArrayNav[i][3];

        if((wikidocs_ArrayNav[i].length < 2)||(i == 0)||(link.indexOf('/')==-1)){
            if((style=='')&&(tip=='')&&(link!=''))
                style=link;
            nav_str = '</div></td></tr><tr class="no-border"><td class="wikidocs_nav_td"><span class="wikidocs_nav_category" title="'+tip+'" style="'+style+'">'+text+'</span></td><td class="wikidocs_nav_td"><div style="display: flex;">';
        }
        else{
            link = link.replace('{{APP_PATH}}', APP_PATH());
            link = link.replace('{{DOC_PATH}}', DOC_PATH());
            v = '<a class="wikidocs_nav_link" href="'+link+'" onclick="openUrlWithNewWindow(\''+link+'\');return false;" title="'+tip+'" style="'+style+'">'+text+'</a>';
            nav_str = '<div class="wikidocs_nav_container">'+v+'</div> ';
        }

        document.write(nav_str);
    }

    document.write('</td></tr></table></div>');
}

// show Daily Motto
function WikiDocs_ShowDailyMotto(style=""){
    if (wikidocs_dm == '')
        wikidocs_dm = 'Nothing is impossible';
    
    if (wikidocs_dm_style != '')
        style = wikidocs_dm_style;

    document.write('<div class="wikidocs_divDiaryMotto"><span class="wikidocs_DiaryMotto" style="'+style+'" TITLE="'+wikidocs_dm_hint+'">'+wikidocs_dm+'</span></div>');
}

function decodeHtmlEntities(encodedString) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}

// last wallpaper filename
var WikiDocs_WALLPAPER_CURRENT='';
// set current page's walpaper
// img = xx/xx/xx.png | xx.jpg | RANDOM or "" | DAY | BING | BING_AUTOSAVE
//       xx/xx/xx.png or https://xxx.jpg: Specify image file with directory or url
//       xx.jpg: image file in current directory
//       {{IMG_LIB}}xx.jpg: image file in image library
//       RANDOM: random image file in homepage/config/images/ directory every view
//       DAY: random image file in homepage/config/images/ directory per day
//       BING: get today's bing wallpaper
//       BING_AUTOSAVE: get today's bing wallpaper and save to image library
// opacity: 0 - 1
// size: image size, it is CSS background-size Property  
function WikiDocs_setwallpaper(img="", opacity=0.8, size="cover") {

    // replace "\" with "/" and convert to uppercase
    let v = decodeHtmlEntities(img).replace(/\\/g, "/");

    switch (Math.floor(opacity*10)) {
        case 9:ofile = 'opacity_90.png';break;
        case 8:ofile = 'opacity_80.png';break;
        case 7:ofile = 'opacity_70.png';break;
        case 6:ofile = 'opacity_60.png';break;
        case 5:ofile = 'opacity_50.png';break;
        case 4:ofile = 'opacity_40.png';break;
        case 3:ofile = 'opacity_30.png';break;
        case 2:ofile = 'opacity_20.png';break;
        case 1:ofile = 'opacity_10.png';break;
        case 0:ofile = '';break;
        default:return;
    }
    if(ofile != '') ofile = 'url('+APP_PATH()+'scripts/'+ofile+'),';

    imgfile = "";
    if(v == "") v = "RANDOM";
    if((v == "RANDOM")||(v == "DAY")||(v == "BING")||(v == "BING_AUTOSAVE")) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", APP_PATH()+"custom.php?cmd=IMAGE_OF_"+v, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                r = xhr.responseText;
                if(r.indexOf('://')==-1)
                    r = IMAGE_PATH()+r;
                document.body.style.background = ofile + 'url(' + r + ') no-repeat fixed center';
                document.body.style.backgroundSize = size;
                wikidocs_WALLPAPER_CURRENT = xhr.responseText;
            }
        };
        xhr.send();
    }
    else {
        if (v.substr(0, '{{IMG_LIB}}'.length) == '{{IMG_LIB}}') {
            imgfile = IMAGE_PATH()+v.substr('{{IMG_LIB}}'.length);
        }
        else{        
            // include "/" or "://"
            if (v.indexOf("/") > -1){
                imgfile = v;
            }
            else{
                imgfile = DOC_PATH() + v;
            }
        }
        document.body.style.background = ofile + 'url(' + imgfile + ') no-repeat fixed center';
        document.body.style.backgroundSize = size;
        wikidocs_WALLPAPER_CURRENT = imgfile;
    }
}

// show all image library
function WikiDocs_ShowImageLibrary(Title='', showfilename=true) {

    document.write('<div');
    if (Title != '')
        document.write('<span class="wikidocs_nav_Title">'+Title+'</span>');
    document.write('<div id="wikidocs_ImageLibrary">');
    document.write('</div></div>');

    var xhr = new XMLHttpRequest();
    xhr.open("POST", APP_PATH()+"custom.php?cmd=IMAGE_LIBRARY", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            imglist = JSON.parse(xhr.responseText);
            var divElement = document.getElementById("wikidocs_ImageLibrary");
            let n = 0;
            let img = '';
            for ( i=0; i < imglist.length; i++) {
                tip = 'Title="'+(i+1)+'/'+imglist.length+' '+imglist[i]+'"';
                img = img + '<a class="wikidocs_imageLibrary" href="'+IMAGE_PATH()+imglist[i]+'" '+tip+'><img width="240" border="8" style="border-color:#E5A032;border-style:ridge;" src="'+IMAGE_PATH()+imglist[i]+'" '+tip+'>';
                if(showfilename)
                    img = img + '<span class="wikidocs_imageLibraryFileName"><b>'+(i+1)+'</b> - [ '+imglist[i]+' ]</span>';

                img = img + '</a>';
            }
            divElement.innerHTML = img;
        }
    };
    xhr.send();
}

// use javascript
// filename = https://xx.js | xx.js | RANDOM | DAY
//            https://xx.js: Specify js file with url
//            xx.js: "js file in homepage/config/javascript/" directory
//            RANDOM: random js file in "homepage/config/javascript/" directory every view
//            DAY: random image file in "homepage/config/javascript/" directory per day
var WikiDocs_JS_CURRENT='';
function WikiDocs_js(filename) {

    // replace "\" with "/" and convert to uppercase
    let v = decodeHtmlEntities(filename.toUpperCase()).replace(/\\/g, "/");

    if ((filename == "RANDOM")||(filename == "DAY")) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", APP_PATH()+"custom.php?cmd=JS_OF_"+filename, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var script = document.createElement('script');
                script.src = JS_PATH()+xhr.responseText;
                document.body.appendChild(script);
                wikidocs_JS_CURRENT = xhr.responseText;
            }
        };
        xhr.send();
    }
    else {
        if(filename.indexOf('://')==-1)
            filename = JS_PATH()+filename;
        document.write('<script src="'+filename+'"></script>');
        wikidocs_JS_CURRENT = filename;
    }
}

// update file count when wikidocs_FLAG_UPDATE_FILECOUNT = 1, by send query
function update_filecount(){
    if(wikidocs_FLAG_UPDATE_FILECOUNT){
        wikidocs_FLAG_UPDATE_FILECOUNT = 0;  // clear flag
        var xhr = new XMLHttpRequest();
        xhr.open("POST", APP_PATH()+"updatefilecount.php?cmd=update", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send();
    }
}

update_filecount();