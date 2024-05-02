(() => {

const mainContainer = document.getElementById('mainContainer');

// NOTE: `allBookmarks` remains global for the app, which is not ideal. It is directly used in the methods bellow for simplicity. If the code remains functionally oriented the allBookmars instance can be passed as an argument to all function, but since it will be repetitive, I left it being global. If the code is migrated to be object oriented, it will just be part of the default props of the object.
let allBookmarks = {

  // NOTE: use `_root` folder to store bookmarks in the main folder
  _root: {
    _bookmarks: {},
    _folderPath: '_root',
    name: 'All Bookmarks',
    type: 'folder',
    id: generateId()
  }
};

let activeSearchResults = null;

setupState();

drawFolders();

setupBtnListeners();


/**
 * Helper methods
 */

function generateId() {

  // NOTE: This is the easiest randon ID generation, but can be changed
  return Date.now();
}

function getFoldersForDrawing() {

  return activeSearchResults || allBookmarks;
}

function findNestedObject(rootObj, path) {

  return path
    .split('.')
    .reduce((acc, val) => {

      // in each iteration `acc` is the current object and
      // `val` is the key of the next child folder name
      return acc && acc[val]
    }, rootObj);
}
/**
 * END of Helper methods
 */



/**
 * State Storage methods
 */
function saveState() {

  localStorage.setItem('custom_bookmarks', JSON.stringify(allBookmarks));
}

function clearState() {

  localStorage.removeItem('custom_bookmarks');
}

function setupState() {

  const bookmarksInStorage = JSON.parse(localStorage.getItem('custom_bookmarks'));

  bookmarksInStorage && (allBookmarks = {

    ...bookmarksInStorage
  });
}
/**
 * END of State Storage methods
 */



/**
 * Folders methods
 */
function openCreateFolderDialog() {

  document.getElementById('createFolderDialog').classList = 'dialog create-folder-dialog is-opened';
}

function closeCreateFolderDialog() {

  document.getElementById('createFolderDialog').classList = 'dialog create-folder-dialog';
}

function createFolder(props) {

  const {
    folderName,
    folderPath = '_root'
  } = props;

  const newFolderParent = findNestedObject(allBookmarks, folderPath);

  const id = generateId();

  if (!newFolderParent[id]) {

    newFolderParent[id] = {

      // Use _folderPath to quickly find an entry, without having to manually traverse the tree each time
      _folderPath: `${folderPath}.${id}`,
      _bookmarks: {},
      name: folderName,
      id,
      type: 'folder'
    };

    saveState();

    drawFolders();
  }
}


function openChangeFolderNameDialog() {

  document.getElementById('editFolderDialog').classList = 'dialog edit-folder-dialog is-opened';
}

function closeChangeFolderNameDialog() {

  document.getElementById('editFolderDialog').classList = 'dialog edit-folder-dialog';
}

function changeFolderName(id, currentName, newName, folderPath = '_root') {

  const parentFolderPath = folderPath.substring(0, folderPath.lastIndexOf('.'));

  const editedFolderParent = findNestedObject(allBookmarks, parentFolderPath);

  if (editedFolderParent[id] && currentName !== newName) {

    editedFolderParent[id].name = newName;

    saveState();

    drawFolders();
  }
}


function deleteFolder(props) {

  const {
    folderId,
    folderName,
    folderPath = '_root'
  } = props;

  // NOTE: add confirm for the user using folderName

  const parentFolderPath = folderPath.substring(0, folderPath.lastIndexOf('.'));

  const forDeletionFolderParent = findNestedObject(allBookmarks, parentFolderPath);

  delete forDeletionFolderParent[folderId];

  saveState();

  drawFolders();
}

/**
 * END of Folders methods
 */



/**
 * Bookmarks methods
 */

function openEditBookmarkDialog() {

  document.getElementById('editBookmarkDialog').classList = 'dialog edit-bookmark-dialog is-opened';
}

function closeEditBookmarkDialog() {

  document.getElementById('editBookmarkDialog').classList = 'dialog edit-bookmark-dialog';
}

function addBookmark(name, url, folderPath) {

  const newBookmarkFolder = findNestedObject(allBookmarks, folderPath);

  if (newBookmarkFolder) {

    const id = generateId();

    // NOTE: additional checks can be added
    newBookmarkFolder._bookmarks[id] = {
      id,
      name,
      url,
      _folderPath: folderPath,
      type: 'bookmark'
    };

    saveState();

    drawFolders();
  }
}

function editBookmark(id, newName, newUrl, parentFolderPath) {

  const editedBookmarkFolder = findNestedObject(allBookmarks, parentFolderPath);
  const editedBookmark = editedBookmarkFolder._bookmarks[id];

  const oldName = editedBookmark.name;
  const oldUrl = editedBookmark.url;

  if (editedBookmarkFolder && (oldName !== newName || oldUrl !== newUrl)) {

    editedBookmarkFolder._bookmarks[id].url = newUrl;
    editedBookmarkFolder._bookmarks[id].name = newName;

    saveState();

    drawFolders();
  }
}

function deleteBookmark(id, parentFolderPath) {

  const forDeletionBookmarkFolder = findNestedObject(allBookmarks, parentFolderPath);

  if (forDeletionBookmarkFolder) {

    // NOTE: additional checks can be added
    delete forDeletionBookmarkFolder._bookmarks[id];

    saveState();

    drawFolders();
  }
}
/**
 * END of Bookmarks methods
 */



/**
 * Search methods
 */
function recursiveSearch(searchInObject, searchStr, results = {}, isDone = false) {

  for (let prop in searchInObject) {

    const propAsString = searchInObject[prop].toString().toLowerCase();

    if (propAsString.indexOf(searchStr) !== -1) {

      results[searchInObject.id] = searchInObject;
      break;
    }

    if (searchInObject[prop] instanceof Object) {

      recursiveSearch(searchInObject[prop], searchStr, results, isDone);

    } else {

      isDone = true;
    }
  }
  return results;
}

function clearSearch() {

  activeSearchResults = null;

  const searchField = document.getElementById('mainSearchInput');
  searchField.value = '';

  drawFolders();
}
/**
 * END of Search methods
 */



/**
 * Visualizing methods
 */

function setupBtnListeners() {

  if (document.body.addEventListener) {

    document.body.addEventListener('click', handleBtnClicks, false);
  }

  function handleBtnClicks(e) {

    const target = e.target || e.srcElement;

    // NOTE: the check is needed since there is only one eventListener for the page
    // If handling of different click events is needed, this will have to be refactored
    if (!target.className.match(/btn/)) {

      return;
    }

    const actionType = target.getAttribute('data-actionType');
    const folderId = target.getAttribute('data-folderId');
    const folderName = target.getAttribute('data-folderName');
    const folderPath = target.getAttribute('data-folderPath');

    const bookmarkName = target.getAttribute('data-bookmarkName');
    const bookmarkUrl = target.getAttribute('data-bookmarkUrl');
    const bookmarkId = target.getAttribute('data-bookmarkId');

    switch (actionType) {

      /**
       * Folders mapping
       */
      case 'openChangeFolderNameDialog':

        const changeBtn = document.getElementById('changeFolderNameBtn')
        changeBtn.setAttribute('data-folderId', folderId);
        changeBtn.setAttribute('data-folderPath', folderPath);
        changeBtn.setAttribute('data-folderName', folderName);

        const editFolderField = document.getElementById('editFolderTitleField');
        editFolderField.value = folderName;

        openChangeFolderNameDialog({ folderName, folderPath });
        break;

      case 'closeChangeFolderNameDialog':

        closeChangeFolderNameDialog();
        break;

      case 'changeFolderName':

        const editFolderTitleField = document.getElementById('editFolderTitleField');

        changeFolderName(folderId, folderName, editFolderTitleField.value, folderPath);

        editFolderTitleField.value = '';
        closeChangeFolderNameDialog();
        break;

      case 'deleteFolder':

        deleteFolder({ folderId, folderName, folderPath });
        break;

      case 'openCreateFolderDialog':

        const createBtn = document.getElementById('createFolderBtn')
        createBtn.setAttribute('data-folderPath', folderPath);

        openCreateFolderDialog({ folderName, folderPath });
        break;

      case 'closeCreateFolderDialog':

        closeCreateFolderDialog();
        break;

      case 'createFolder':

        const createFolderTitle = document.getElementById('createFolderTitleField');

        createFolder({ folderName: createFolderTitle.value, folderPath });

        createFolderTitle.value = '';
        closeCreateFolderDialog();
        break;

      /**
       * Bookmarks mapping
       */
      case 'addBookmark':

        chrome.windows.getCurrent(w => {
          chrome.tabs.query({active: true, windowId: w.id}, tabs => {

            const fullUrl = tabs[0].url;

            const name = fullUrl.replace(/.+\/\/|www.|\..+/g, '');

            const url = fullUrl;

            addBookmark(name, url, folderPath);
          });
        });
        break;

      case 'openEditBookmarkDialog':

        const editBookmarkBtn = document.getElementById('editBookmarkBtn');

        editBookmarkBtn.setAttribute('data-folderPath', folderPath);
        editBookmarkBtn.setAttribute('data-bookmarkName', bookmarkName);
        editBookmarkBtn.setAttribute('data-bookmarkUrl', bookmarkUrl);
        editBookmarkBtn.setAttribute('data-bookmarkId', bookmarkId);

        const bookmarkNameField = document.getElementById('editBookmarkNameField');
        const bookmarkUrlField = document.getElementById('editBookmarkUrlField');

        bookmarkNameField.value = bookmarkName;
        bookmarkUrlField.value = bookmarkUrl;

        openEditBookmarkDialog();
        break;

      case 'closeEditBookmarkDialog':

        closeEditBookmarkDialog();
        break;

      case 'editBookmark':

        const editBookmarkNameField = document.getElementById('editBookmarkNameField');
        const editBookmarkUrlField = document.getElementById('editBookmarkUrlField');

        const newBookmarkName = editBookmarkNameField.value;
        const newBookmarkUrl = editBookmarkUrlField.value;

        editBookmark(bookmarkId, newBookmarkName, newBookmarkUrl, folderPath);

        editBookmarkNameField.value = '';
        editBookmarkUrlField.value = '';

        closeEditBookmarkDialog();
        break;

      case 'deleteBookmark':

        deleteBookmark(bookmarkId, folderPath);
        break;

      /**
       * Search mapping
       */
      case 'search':

        const searchStr = document.getElementById('mainSearchInput').value.toLowerCase();

        activeSearchResults = recursiveSearch(allBookmarks, searchStr);

        drawFolders()
        break;

      case 'clearSearch':

        clearSearch();
        break;

      default:
        break;
    }
  }
}

function drawFolders(obj = getFoldersForDrawing()) {

  if (!mainContainer) {

    return;
  }

  let result = '';

  _generateHTML(obj);

  function _generateHTML(obj, parent = null) {

    let numberOfFolderTagsOpened = 0;

    for (key in obj) {

      if (!obj.hasOwnProperty(key)) {

        continue;
      }

      if (numberOfFolderTagsOpened) {

        result += '</div>';
        numberOfFolderTagsOpened--;
      }

      // Render a folder
      if (obj[key].type === 'folder') {

        numberOfFolderTagsOpened++;

        result += `
          <div class="folder rounded-md mb-2 text-xs"
            id="${obj[key].id}"
          >
            <header class="mb-2 flex items-center">

              <div class="folder-title text-md mr-2 truncate">${obj[key].name}</div>

              <section class="folder-ctrls flex">

                <button class="btn add-btn mr-1"
                  data-actionType="openCreateFolderDialog"
                  data-folderId="${obj[key].id}"
                  data-folderPath="${obj[key]._folderPath}"
                  data-folderName="${obj[key].name}"
                >
                  <i class="fa fa-plus" aria-hidden="true"></i>
                </button>

                <button class="btn del-btn mr-1 ${key === '_root' && 'hidden'}"
                  data-actionType="deleteFolder"
                  data-folderId="${obj[key].id}"
                  data-folderPath="${obj[key]._folderPath}"
                  data-folderName="${obj[key].name}"

                >
                  <i class="fa fa-trash" aria-hidden="true"></i>
                </button>

                <button class="btn edit-btn mr-1 ${key === '_root' && 'hidden'}"
                  data-actionType="openChangeFolderNameDialog"
                  data-folderId="${obj[key].id}"
                  data-folderPath="${obj[key]._folderPath}"
                  data-folderName="${obj[key].name}"
                >
                  <i class="fa fa-pencil" aria-hidden="true"></i>
                </button>

                <button class="btn add-btn mr-1"
                  data-actionType="addBookmark"
                  data-folderId="${obj[key].id}"
                  data-folderPath="${obj[key]._folderPath}"
                  data-folderName="${obj[key].name}"

                >
                  <i class="fa fa-star" aria-hidden="true"></i>
                </button>

              </section>
            </header>
        `;
      }

      // Render a bookmark
      if (obj[key].type === 'bookmark') {

        result += `
          <header class="link-holder flex items-center p-1 rounded-md mb-1 text-xs">
            <a href="${obj[key].url}" target="_blank" class="link mr-2 truncate">${obj[key].name}</a>
            <button class="btn del-btn mr-1"
              data-actionType="deleteBookmark"
              data-bookmarkId="${obj[key].id}"
              data-folderPath="${obj[key]._folderPath}"
              data-bookmarkName="${obj[key].name}"
              data-bookmarkUrl="${obj[key].url}"

            >
              <i class="fa fa-trash" aria-hidden="true"></i>
            </button>

            <button class="btn edit-btn mr-1"
              data-actionType="openEditBookmarkDialog"
              data-bookmarkId="${obj[key].id}"
              data-folderPath="${obj[key]._folderPath}"
              data-bookmarkName="${obj[key].name}"
              data-bookmarkUrl="${obj[key].url}"

            >
              <i class="fa fa-pencil" aria-hidden="true"></i>
            </button>

          </header>
        `;
      }

      if (typeof obj[key] === 'object' && obj !== null) {

        // Call recursively for the inner object
        _generateHTML(obj[key], obj);
      }
    }

    while (numberOfFolderTagsOpened) {

      result += '</div>';
      numberOfFolderTagsOpened--;
    }
  }

  mainContainer.innerHTML = result;

  return result;
}
/**
 * END of Visualizing methods
 */


})();