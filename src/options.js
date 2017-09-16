const TABLES = create_map(
  RULE_TYPES.map(type => type + '_rule_table'),
  id => g(id).getElementsByTagName('tbody')[0]);

const DEFAULT_RULES = [
  {'image/jpeg': 'images/', 'application/x-bittorrent': 'torrents/'},
  {}, {}];

function create_route (path, mode, use_regex) {
  let canonicalize =
    create_route.cp = create_route.cp ||
      (path => {
        if (!path) return './';
        path = path.replace(/\\/g, '/');
        if (path[path.length - 1] !== '/')
          path += '/';
        return path;
      });
  return {
    path: canonicalize(path),
    mode: mode || this.DEFAULT_MODE,
    regex: use_regex
  };
}

function save_options () {
  let rule_list = [{}, {}, {}];
  TABLES.keys.forEach((id, i) => {
    let rules = rule_list[i];
    let table = TABLES[id];
    let last_row = table.rows[table.rows.length - 1];
    Array.prototype.forEach.call(table.rows,
      row => {
        if (row === last_row) return;
        let fields = row.getElementsByTagName('input');
        let keyword = fields[0].value.trim();
        let path = fields[1].value.trim();
        let use_regex = true; //fields[fields.length - 1].checked;
        if (!!keyword && !!path) {
          let mode = null;
          Array.prototype.some.call(fields,
            field => field.type === 'radio' && field.checked && (mode = field.title)
          );
          let route = create_route(path, mode, use_regex);
          rules[keyword] = route;
          fields[1].value = route.path;
        }
      });
    save_rule(RULE_TYPES[i], rules);
  });

  let order = g('rule_order').value;
  order = order.replace(/\s+/g, '');
  order = order.split(',', 3);

  RULE_TYPES.every(function (item) {
    if (order.indexOf(item) === -1) {
      alert('Invalid ruleset hierarchy, resetting to default.');
      order = RULE_TYPES;
      return false;
    }
    return true;
  });

  save_item('order', order);
  save_item('global_ref_folders', g('global_ref_folders').checked);

  // Flash a status message
  let status = g('status');
  status.innerHTML = '<span class="green">&#10004;</span> Settings saved!';
  //status.innerHTML = '<span class="green">&#10004;</span>' + chrome.i18n.getMessage('msg_saved');
  status.style.display = 'block';
  setTimeout(function () {
    status.innerHTML = '';
    status.style.display = 'none';
  }, 1500);
}

function restore_options () {
  RULE_TYPES.forEach((rule_type, i) => {
    let rules = load_rule(rule_type) || DEFAULT_RULES[i];
    for (let keyword in rules) {
      if (!rules.hasOwnProperty(keyword))
        continue;
      let rule = rules[keyword];
      if (!rule.path || !rule.mode)
        continue;
      add_table_row(TABLES[i],
        {value: keyword}, {value: rule.path}, rule.mode, rule.regex);
    }
  });

  g('rule_order').value = load_item('order') || RULE_TYPES;
  g('global_ref_folders').checked = load_item('global_ref_folders') || false;
}

function add_table_row (table, srcAttr, dstAttr, mode, use_regex) {
  let row_id = add_table_row.row_id = (add_table_row.row_id || 0) + 1;
  let newRow = table.insertRow(table.rows.length - 1);
  let srcCell = newRow.insertCell(0);
  let spaceCell = newRow.insertCell(1);
  let destCell = newRow.insertCell(2);
  let modeCell = newRow.insertCell(3);
  let delCell = newRow.insertCell(4);
  /////
  let srcElem = document.createElement('input');
  srcElem.type = 'text';
  Object.assign(srcElem, srcAttr);
  srcCell.appendChild(srcElem);
  /////
  let dstElem = document.createElement('input');
  dstElem.type = 'text';
  Object.assign(dstElem, dstAttr);
  destCell.appendChild(dstElem);
  spaceCell.appendChild(document.createTextNode('➜'));
  /////
  MODES.forEach(MODE => {
    let btn = document.createElement('input');
    btn.title = MODE;
    btn.type = 'radio';
    btn.name = 'radios-' + row_id;
    btn.id = 'radio-' + row_id + '-' + MODE;
    btn.checked = (MODE === (!!mode ? mode : DEFAULT_MODE));
    let label = document.createElement('label');
    label.setAttribute('for', btn.id);
    label.appendChild(document.createTextNode(MODE));
    modeCell.appendChild(label);
    modeCell.appendChild(btn);
    modeCell.appendChild(document.createTextNode('　'));
  });
  /////
  // let regCell = document.createElement('input');
  // regCell.type = 'checkbox';
  // regCell.checked = !!use_regex;
  /////
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
  /////
  newRow.appendChild(srcCell);
  newRow.appendChild(spaceCell);
  newRow.appendChild(destCell);
  newRow.appendChild(modeCell);
  //newRow.appendChild(regCell);
  newRow.appendChild(delCell);
}

function options_setup () {
  let cont = g('wrap');
  let navs = cont.querySelectorAll('ul#nav li');
  let tabs = cont.querySelectorAll('.tab');
  let active = 'routing';
  // Handle new installations by showing the usage instructions
  // and a quick message
  if (!load_item('version')) {
    active = 'usage';
    let status = g('status');
    status.innerHTML = 'Thank you for installing Downloads Router!<br>'
      + 'Please read the instructions below, then head over to the routing rules'
      + 'to configure the extension.';
    status.style.display = 'block';
    setTimeout(function () {
      status.innerHTML = '';
      status.style.display = 'none';
    }, 7500);
    save_item('version', chrome.runtime.getManifest().version);
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
  g(current).style.display = 'none';
  g(selected).style.display = 'block';
  let elem = g('nav_' + current);
  elem.removeAttribute('class');
  elem.removeAttribute('active');
  this.setAttribute('class', 'active');
  this.parentNode.dataset.currentTabId = selected;
}

/* Event listeners */

document.addEventListener('DOMContentLoaded', options_setup);

Array.prototype.forEach.call(
  document.getElementsByClassName('save-btn'),
  elem => {
    elem.addEventListener('click', save_options);
    elem.innerHTML = '&#10004; Save configuration';
  });

Array.prototype.forEach.call(
  document.getElementsByClassName('add-rule-btn'),
  elem => {
    elem.innerHTML = '<strong>+</strong> Add new routing rule';
    elem.addEventListener('click', (() => {
      switch (elem.id) {
        case 'add_mime_rule':
          return () => add_table_row(TABLES['mime_rule_table'],
            {placeholder: 'E.g. image/jpeg'},
            {placeholder: 'some/folder/'});
        case 'add_referrer_rule':
          return () => add_table_row(TABLES['referrer_rule_table'],
            {placeholder: 'E.g. 9gag.com (no http://)'},
            {placeholder: 'some/folder/'});
        case 'add_filename_rule':
          return () => add_table_row(TABLES['filename_rule_table'],
            {placeholder: 'E.g. epub|ebook'},
            {placeholder: 'some/folder/'});
      }
    })());
  });