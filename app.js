let notes = [];
let focusNote = {};
let deleteOptions = [];
let noteAreaDOM = document.querySelector("#notes");
let newNoteDOM = document.querySelector("#note");
let headerDOM = document.querySelector("#header");
let navActionDOM = document.querySelector("#nav-action");
let deleteManyDOM = document.querySelector("#nav-delete");
let downloadDOM = document.querySelector('#nav-download');

let noteTitleDOM = document.querySelector("#note-title");
let noteContentDOM = document.querySelector("#note-content");

noteTitleDOM.onchange = (e) => updateNote(e);
noteContentDOM.onchange = (e) => updateNote(e);

deleteManyDOM.addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");

    if (action === 'delete') {
        if (Object.keys(focusNote).length > 0) {
            // Delete specific 
            browser.storage.local.remove(focusNote.modified.toString())
            navActionDOM.setAttribute('data-action', 'other');
            navActionDOM.click();
        } else {
            e.target.setAttribute('data-action', 'confirm');
            e.target.innerHTML = `Delete (<span id='d-count'>0</span>)`;
            navActionDOM.setAttribute('data-action', 'home');
            navActionDOM.innerHTML = "&lt; Cancel";
            renderNotes('delete');
        }
    } else {
        e.target.setAttribute('data-action', 'delete');
        e.target.textContent = "Delete";

        navActionDOM.setAttribute('data-action', 'new');
        navActionDOM.innerHTML = "&plus; New";

        deleteOptions.forEach(key => {
            browser.storage.local.remove(key.toString())
        })
        getAll();
    }
})

downloadDOM.addEventListener("click", (e) => {
    if (Object.keys(focusNote).length > 0) {
        // Download specific note
        console.log('downloading note');
        const options = {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        };
        const lastModified = new Date(focusNote.modified);
        const hours = `${(lastModified.getHours()<10?'0':'') + lastModified.getHours()}:${(lastModified.getMinutes()<10?'0':'') + lastModified.getMinutes()}`;
        const timeStamp = `${new Intl.DateTimeFormat('en-US', options).format(lastModified)}`;

        const parsedNote = `\n ${timeStamp}\n ${hours} \n\n ${focusNote.title} \n\n ${focusNote.text}`;
        downloadNote(parsedNote, `${focusNote.modified}.txt`, 'text/plain');
    } else {
        // ToDo: Download all of them (zip?)
        console.log('downloading archives');
    }
})

navActionDOM.addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    focusNote = {};

    if (action === 'new') {
        e.target.setAttribute('data-action', 'home');
        e.target.innerHTML = "&lt; Back";

        deleteManyDOM.classList = " hidden";
        // downloadDOM.classList = " hidden";

        headerDOM.textContent = "New Note";
        newNoteDOM.classList = '';
        noteAreaDOM.classList = 'hidden';


        noteContentDOM.value = '';
        noteTitleDOM.value = '';
    } else {
        e.target.setAttribute('data-action', 'new');
        e.target.innerHTML = "&plus; New";
        newNoteDOM.classList = " hidden";

        deleteManyDOM.setAttribute('data-action', 'delete');
        deleteManyDOM.textContent = `Delete`;
        deleteManyDOM.classList = "";


        downloadDOM.classList = " hidden";
        noteAreaDOM.classList = "";
        headerDOM.textContent = "Notes";

        deleteOptions = [];
        getAll();
    }
})



function getAll() {
    notes = [];
    browser.storage.local.get().then(res => {
        if (Object.keys(res).length > 0) {
            const entries = Object.keys(res);
            // console.log(entries);
            entries.forEach(k => {
                notes.push(res[k]);
            });
        }
        renderNotes('list');
    }, err => {
        console.log(err);
    });
}


function renderNotes(layout) {
    console.log(layout, notes);
    noteAreaDOM.textContent = "";
    if (notes.length > 0) {
        notes.forEach(item => {
            let noteEntryDOM = document.createElement('div');
            let noteEntryDetailsDOM = document.createElement('div');
            let entryTitleDOM = document.createElement('p');
            let noteBlurbDOM = document.createElement('p');
            let noteTimeDOM = document.createElement('span');

            entryTitleDOM.textContent = item.title;
            noteTitleDOM.classList = 'entry-title';

            noteBlurbDOM.textContent = (item.text.length > 25 ? `${item.text.substr(0,30)}...` : item.text);
            noteBlurbDOM.classList = 'entry-blurb';


            const modified = new Date(item.modified);
            const options = {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            };
            const hourFormat = `${(modified.getHours()<10?'0':'') + modified.getHours()}:
            ${(modified.getMinutes()<10?'0':'') + modified.getMinutes()}`;

            const itemTimeStamp = `${new Intl.DateTimeFormat('en-US', options).format(modified)}`;
            noteTimeDOM.textContent = `Modified ${itemTimeStamp} ${hourFormat}`;
            noteTimeDOM.classList = 'entry-modified';

            noteEntryDetailsDOM.appendChild(entryTitleDOM);
            noteEntryDetailsDOM.appendChild(noteBlurbDOM);
            noteEntryDetailsDOM.appendChild(noteTimeDOM);
            noteEntryDetailsDOM.addEventListener('click', (e) => {
                console.log(item);
                deleteManyDOM.setAttribute('data-action', 'delete');
                deleteManyDOM.textContent = `Delete`;

                noteAreaDOM.classList = 'hidden';
                newNoteDOM.classList = '';
                downloadDOM.classList = '';

                navActionDOM.setAttribute('data-action', 'home');
                navActionDOM.innerHTML = "&lt; Back";

                headerDOM.textContent = 'Modify Note';
                noteContentDOM.value = item.text || item.details || '';
                noteTitleDOM.value = item.title;
                focusNote = item;
            });

            noteEntryDOM.classList += 'note-entry';

            if (layout == 'delete') {
                let itemCheckBox = document.createElement('input');
                itemCheckBox.type = 'checkbox';
                itemCheckBox.classList = 'selection';
                itemCheckBox.setAttribute('data-key', item.modified);
                itemCheckBox.addEventListener('click', (e) => {
                    const status = e.target.checked;
                    if (status) {
                        deleteOptions.push(e.target.getAttribute('data-key'));
                    } else {
                        deleteOptions = deleteOptions.filter(i => i != e.target.getAttribute('data-key'));
                    }
                    document.querySelector('#d-count').textContent = deleteOptions.length;
                })
                noteEntryDOM.prepend(itemCheckBox);
            }
            noteEntryDOM.appendChild(noteEntryDetailsDOM);
            noteAreaDOM.prepend(noteEntryDOM); //latest goes on top
        })
        // append to notes area
    } else {
        deleteManyDOM.classList = "hidden";
        noteAreaDOM.textContent = "No notes found.";
    }
}

// Function to download data to a file
function downloadNote(data, filename, type) {
    var file = new Blob([data], {
        type: 'text/plain'
    });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function updateNote() {
    const timeStamp = Date.now();
    if (Object.keys(focusNote).length > 0) {
        // Update existing note by removing the previous saved entry
        browser.storage.local.remove(focusNote.modified.toString());
    }

    if (noteTitleDOM.value != '' || noteContentDOM.value != '') {
        // Generate a new note (no empty notes generated)
        const newNote = {
            modified: timeStamp,
            title: noteTitleDOM.value == '' ? 'Untitled' : noteTitleDOM.value,
            text: noteContentDOM.value
        }
        focusNote = newNote;
        browser.storage.local.set({
            [timeStamp]: newNote
        })
    }
}

getAll()