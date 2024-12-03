document.addEventListener('keydown', function(event) {
    // Check if Ctrl or Command key is pressed along with 'S'
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevent the default save behavior

        // Check if the URL contains '?edit' or '&edit' to confirm we are in edit mode
        if (window.location.href.includes('?edit') || window.location.href.includes('&edit')) {
            // Find the save button and trigger a click event
            var saveButton = document.getElementById('editor-save');
            if (saveButton) {
                saveButton.click();
            }
        }
    }

    // Check if Ctrl or Command key is pressed along with 'E'
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault(); // Prevent the default behavior

        // Check if the URL does not contain '?edit' or '&edit' to confirm we are not in edit mode
        // Any present anchor gets removed additionally to make the edit-URL work
        if (!window.location.href.includes('?edit') && !window.location.href.includes('&edit')) {
            // Redirect to edit mode
            var currentUrl = window.location.href.split('#')[0];
            var editUrl = currentUrl.includes('?') ? currentUrl + '&edit' : currentUrl + '?edit';
            window.location.href = editUrl;
        }
    }
});
