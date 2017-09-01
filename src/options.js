function save_options () {
  let maps = [{}, {}, {}];
  let tables = [
    document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0],
    document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0],
    document.getElementById('filename_mapping_table').getElementsByTagName('tbody')[0]
  ];

  for (let idx in tables) {
    if (!tables.hasOwnProperty(idx))
      continue;
    let N = tables[idx].rows.length - 1;
    for (let i = 0; i < N; i++) {
      let fields = tables[idx].rows[i].getElementsByTagName('input');
      if (fields && fields[0].value !== '' && fields[1].value !== '') {
        let target_directory = check_trailing(fields[1].value);
        maps[idx][fields[0].value] = target_directory;
      }
    }
  }

  localStorage.setItem('dr_mime_map', JSON.stringify(maps[0]));
  localStorage.setItem('dr_referrer_map', JSON.stringify(maps[1]));
  localStorage.setItem('dr_filename_map', JSON.stringify(maps[2]));


  let order = document.getElementById('rule_order').value;
  order = order.replace(/\s+/g, '');
  order = order.split(',', 3);

  ['filename', 'referrer', 'mime'].every(function (item) {
    if (order.indexOf(item) === -1) {
      alert('Invalid ruleset hierarchy, resetting to default.');
      order = ['filename', 'referrer', 'mime'];
      return false;
    }

    return true; // Again, abusing every()
  });

  localStorage.setItem('dr_order', JSON.stringify(order));
  localStorage.setItem('dr_global_ref_folders',
    JSON.parse(document.querySelector('#global_ref_folders').checked));

  // Flash a status message
  let status = document.getElementById('status');
  status.innerHTML = '<span class="green">&#10004;</span> Settings saved!';
  //status.innerHTML = '<span class="green">&#10004;</span>' + chrome.i18n.getMessage('msg_saved');
  status.style.display = 'block';
  setTimeout(function () {
    status.innerHTML = '';
    status.style.display = 'none';
  }, 1500);
}

function restore_options () {
  let tables = [
    document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0],
    document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0],
    document.getElementById('filename_mapping_table').getElementsByTagName('tbody')[0]
  ];

  let maps = [
    'dr_mime_map',
    'dr_referrer_map',
    'dr_filename_map'
  ];

  let map_defaults = [
    {'image/jpeg': 'images/', 'application/x-bittorrent': 'torrents/'},
    {},
    {}
  ];

  for (let idx = 0; idx < maps.length; ++idx) {
    // Restore or create mapping table
    let map = localStorage.getItem(maps[idx]);
    if (map) {
      map = JSON.parse(map);
    } else {
      map = map_defaults[idx];
      localStorage.setItem(maps[idx], JSON.stringify(map));
    }

    // Create HTML table elements for corresponding map
    for (let key in map) {
      if (!map.hasOwnProperty(key))
        continue;

      let input = document.createElement('input');
      input.type = 'text';
      input.value = key;
      input.placeholder = key;

      let path = document.createElement('input'); // type = 'file' error explanation here
      path.type = 'text';
      path.value = map[key];
      path.placeholder = map[key];

      add_table_row(tables[idx], input, path);
    }
  }

  let order = localStorage.getItem('dr_order');
  if (order) {
    order = JSON.parse(order);
  } else {
    order = ['filename', 'referrer', 'mime'];
    localStorage.setItem('dr_order', JSON.stringify(order));
  }

  document.getElementById('rule_order').value = order;


  let global_ref_folders = localStorage.getItem('dr_global_ref_folders');
  if (global_ref_folders) {
    global_ref_folders = JSON.parse(global_ref_folders);
  } else {
    global_ref_folders = false;
    localStorage.setItem('dr_global_ref_folders', JSON.stringify(false));
  }

  document.getElementById('global_ref_folders').checked = global_ref_folders;
}

function check_trailing (path) {
  if (path.slice(-1) === '/' || path.slice(-1) === '\\') {
    return path;
  }

  if (navigator.platform.indexOf('Win') !== -1) {
    if (path.indexOf('\\') !== -1) { // Could be an escape, but it's a half-decent guess
      return path + '\\';
    }
  }

  // Windows with no \ delimiter, OSX, Linux, other thing; let's just attempt with a forward slash for now
  return path + '/'
}

function add_table_row (table, element1, element2) {
  let newRow = table.insertRow(table.rows.length - 1);
  let srcCell = newRow.insertCell(0);
  let spaceCell = newRow.insertCell(1);
  let destCell = newRow.insertCell(2);
  let delCell = newRow.insertCell(3);

  srcCell.appendChild(element1);
  destCell.appendChild(element2);

  let delInput = document.createElement('button');
  delInput.className = 'btn delete';
  delInput.innerHTML = '&#215;';
  delInput.onclick = function () {
    let current = window.event.srcElement;
    do {
      current = current.parentElement;
    } while (current.tagName !== 'TR');
    current.parentElement.removeChild(current);
  };

  delCell.appendChild(delInput);
  spaceCell.appendChild(document.createTextNode('➜'));

  newRow.appendChild(srcCell);
  newRow.appendChild(spaceCell);
  newRow.appendChild(destCell);
  newRow.appendChild(delCell);
}

/* The following two functions are invoked from the options page,
 * for adding empty rows to the corresponding tables. */

function add_mime_route () {
  let table = document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0];
  let mimeInput = document.createElement('input');
  mimeInput.type = 'text';
  mimeInput.placeholder = 'E.g. image/jpeg';
  let pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.placeholder = 'some/folder/';

  add_table_row(table, mimeInput, pathInput);
}

function add_referrer_route () {
  let table = document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0];
  let refInput = document.createElement('input');
  refInput.type = 'text';
  refInput.placeholder = 'E.g. 9gag.com (no http://)';
  let pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.placeholder = 'some/folder/';

  add_table_row(table, refInput, pathInput);
}

function add_filename_route () {
  let table = document.getElementById('filename_mapping_table').getElementsByTagName('tbody')[0];
  let refInput = document.createElement('input');
  refInput.type = 'text';
  refInput.placeholder = 'E.g. epub|ebook';
  let pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.placeholder = 'some/folder/';

  add_table_row(table, refInput, pathInput);
}

function options_setup () {
  let cont = document.getElementById('wrap');
  let navs = cont.querySelectorAll('ul#nav li');
  let tabs = cont.querySelectorAll('.tab');
  let active = 'routing';

  // Handle new installations by showing the usage instructions and a quick message
  if (!localStorage.getItem('dr_mime_map')) {
    active = 'usage';
    let status = document.getElementById('status');
    status.innerHTML = 'Thank you for installing Downloads Router!<br>Please read the instructions below, then head over to the routing rules to configure the extension.';
    status.style.display = 'block';
    setTimeout(function () {
      status.innerHTML = '';
      status.style.display = 'none';
    }, 7500);
  }

  navs[0].parentNode.dataset.currentTabId = active;

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id !== active) {
      tabs[i].style.display = 'none';
    }
    navs[i].onclick = handle_click;
    if (navs[i].dataset.tabId === active) {
      navs[i].setAttribute('class', 'active');
    }
  }
  restore_options();
}

function handle_click () {
  let current = this.parentNode.dataset.currentTabId;
  let selected = this.dataset.tabId;

  if (current === selected)
    return;

  document.getElementById(current).style.display = 'none';
  document.getElementById(selected).style.display = 'block';
  let elem = document.getElementById('nav_' + current);
  elem.removeAttribute('class');
  elem.removeAttribute('active');

  this.setAttribute('class', 'active');
  this.parentNode.dataset.currentTabId = selected;
}

/* Event listeners */

document.addEventListener('DOMContentLoaded', options_setup);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#add_mime_route').addEventListener('click', add_mime_route);
document.querySelector('#add_referrer_route').addEventListener('click', add_referrer_route);
document.querySelector('#add_filename_route').addEventListener('click', add_filename_route);
