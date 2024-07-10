/**
 * Editor Script
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

/**
 * Custom functions for new buttons
 */
function insertTOC(editor) {
    var cm = editor.codemirror;
    var cursor = cm.getCursor();
    cm.replaceRange("[toc]\n", cursor);
}

function addSubscript(editor) {
    var cm = editor.codemirror;
    var selection = cm.getSelection();
    if (selection) {
        cm.replaceSelection("~" + selection + "~");
    } else {
        var cursor = cm.getCursor();
        cm.replaceRange("~~", cursor);
        cm.setCursor(cursor.line, cursor.ch + 1);
    }
}

function addSuperscript(editor) {
    var cm = editor.codemirror;
    var selection = cm.getSelection();
    if (selection) {
        cm.replaceSelection("^" + selection + "^");
    } else {
        var cursor = cm.getCursor();
        cm.replaceRange("^^", cursor);
        cm.setCursor(cursor.line, cursor.ch + 1);
    }
}

function addRecentEdits(editor) {
    var cm = editor.codemirror;
    var cursor = cm.getCursor();
    cm.replaceRange("[wd-recentedits]\n", cursor);
}

function addTotal(editor) {
    var cm = editor.codemirror;
    var cursor = cm.getCursor();
    cm.replaceRange("[wd-total]\n", cursor);
}

function createTablePicker(editor) {
    const picker = document.createElement('div');
    picker.className = 'table-picker';
    picker.style.display = 'none';

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i + 1;
            cell.dataset.col = j + 1;
            cell.addEventListener('mouseover', () => highlightCells(cell));
            cell.addEventListener('click', () => insertTable(editor, i + 1, j + 1));
            picker.appendChild(cell);
        }
        picker.appendChild(document.createElement('br'));
    }

    document.body.appendChild(picker);
    return picker;
}

function highlightCells(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const cells = document.querySelectorAll('.table-picker .cell');
    cells.forEach(c => {
        if (parseInt(c.dataset.row) <= row && parseInt(c.dataset.col) <= col) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });
}

function insertTable(editor, rows, cols) {
    const cm = editor.codemirror;
    let table = '\n';
    // Header
    table += '| ' + Array(cols).fill('Header').join(' | ') + ' |\n';
    // Separator
    table += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
    // Rows
    for (let i = 0; i < rows; i++) {
        table += '| ' + Array(cols).fill('Cell').join(' | ') + ' |\n';
    }
    cm.replaceSelection(table);
    document.querySelector('.table-picker').style.display = 'none';
}

/**
 * Simple Markdown Editor (EasyMDE)
 */
var simplemde = new EasyMDE({
    element: document.getElementById("simplemde"),
    autoDownloadFontAwesome: false,
    spellChecker: false,
    autofocus: true,
    forceSync: true,
    showIcons: ["code", "table"],
    blockStyles: {
        bold: "**",
        italic: "*",
        code: "```"
    },
    toolbar: [
        "bold", "italic", "strikethrough", "heading", "|",
        "code", "quote", "unordered-list", "ordered-list", "|",
        "link", "image",
        {
            name: "insert-table",
            action: function(editor) {
                const picker = document.querySelector('.table-picker') || createTablePicker(editor);
                const button = editor.toolbarElements['insert-table'];
                const rect = button.getBoundingClientRect();
                picker.style.top = `${rect.bottom + window.scrollY}px`;
                picker.style.left = `${rect.left + window.scrollX}px`;
                picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
            },
            className: "fa fa-th",
            title: "Insert Custom Table",
        },
        "horizontal-rule", "|",
        {
            name: "subscript",
            action: addSubscript,
            className: "fa fa-subscript",
            title: "Add Subscript",
        },
        {
            name: "superscript",
            action: addSuperscript,
            className: "fa fa-superscript",
            title: "Add Superscript",
        },
        {
            name: "insert-toc",
            action: insertTOC,
            className: "fa fa-list-alt",
            title: "Insert Table of Contents",
        },
        {
            name: "recent-edits",
            action: addRecentEdits,
            className: "fa fa-clock-o",
            title: "Insert Recent Edits",
        },
        {
            name: "total",
            action: addTotal,
            className: "fa fa-book",
            title: "Insert Total Number of Documents",
        },
        "|", "preview", "side-by-side", "fullscreen", "|", "undo", "redo"
    ]
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    var picker = document.querySelector('.table-picker');
    if (picker && !picker.contains(event.target) && !event.target.classList.contains('fa-th')) {
        picker.style.display = 'none';
    }
});

/**
 * Changed status
 */
var changed=false;
var changed_draft=false;

/**
 * Event Handlers
 */
// content changed
simplemde.codemirror.on("change",function(){changed=true;changed_draft=true;});
// prevent exit without save
$(window).on("beforeunload",function(){if(changed){return confirm("Do you really want to exit without save?");}});
// save button click
$("#editor-save").click(function(){
	//if(!changed){return false;}
	changed=false;
	$("#editor-form").submit();
});
// revision change
$("#editor-revision").click(function(){
	if($("input[name='revision']").val()==="1"){
		$("input[name='revision']").val("0");
		$("#editor-revision-checkbox").text("check_box_outline_blank");
	}else{
		$("input[name='revision']").val("1");
		$("#editor-revision-checkbox").text("check_box");
	}
});

/**
 * Timer Handler
 */
setInterval(function(){
	if(changed_draft){
		$.ajax({
			url:APP.URL+"submit.php?act=draft_save_ajax",
			type:"POST",
			data:{
				document:DOC.ID,
				content:$("textarea[name='content']").val()
			},
			cache:false,
			success:function(response){
				// decode response
				decoded=JSON.parse(response);
				// alert if error
				if(decoded.error===1){
					alert(decoded.code);
				}else{
					// drfat saved
					changed_draft=false;
				}
			},
			error:function(XMLHttpRequest,textStatus,errorThrown){
				// alert
				alert("Status: "+textStatus+" Error: "+errorThrown);
			}
		});
	}
},10000);
