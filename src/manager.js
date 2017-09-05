let order = load_item('order') || RULE_TYPES;

function show_duplicate (item) {
  let settings = show_duplicate.settings;
  if (!settings) {
    show_duplicate.settings = settings = {
      type: 'basic',
      iconUrl: 'data/conflict.png',
      title: 'Possibly duplicate file found'
    };
    chrome.notifications.onClicked.addListener(id => {
      if (id[0] === '*')
        chrome.downloads.show(+id.substr(1));
      else
        chrome.downloads.showDefaultFolder();
    });
  }
  settings.message = 'Skipping ' + item.filename;
  let id = (item.id === undefined ? item.filename : '*' + item.id);
  chrome.notifications.create(id, settings);
}

function get_fp_regex (filename, dir, is_duplicate) {
  let p = filename.lastIndexOf('.');
  let numbering = ' \\(\\d+\\)';
  let regex;
  if (!is_duplicate)
    numbering = '(|' + numbering + ')';
  if (p < 0)
    regex = filename + numbering;
  else {
    regex = filename.substr(0, p) + numbering + filename.substr(p);
  }
  regex = dir + regex;
  if (navigator.platform.startsWith('Win'))
    regex = regex.replace(/\//g, '\\\\') + '$';
  return regex;
}

function handle_conflict (item, route, suggest) {
  let action = MODE_TO_ACTION[route.mode];
  let filepath = route.path + item.filename;
  if (action) {
    suggest({filename: filepath, conflictAction: action});
  } else {
    // skip download if a file with the same name exists
    chrome.downloads.search({
        filenameRegex: get_fp_regex(item.filename, route.path, false),
        exists: true,
        limit: 1
      },
      items => {
        if (items.length) {
          chrome.downloads.cancel(item.id);
          show_duplicate(items[0]);
        } else {
          suggest({filename: filepath, conflictAction: 'uniquify'});
          // a hack to cancel download when
          // the existing file isn't in the history
          setTimeout(() => {
            chrome.downloads.search({
                filenameRegex: get_fp_regex(item.filename, route.path, true),
                orderBy: ['-startTime'],
                state: 'in_progress',
                limit: 1
              },
              items => {
                if (items.length) {
                  chrome.downloads.cancel(items[0].id);
                  chrome.downloads.erase({id: items[0].id}, undefined);
                  show_duplicate({filename: item.filename});
                }
              });
          }, 200);
        }
      });
  }
  return true;
}

const apply_filename_rule = (rule_type, item, suggest) => {
  let rule = load_rule(rule_type);
  return Object.keys(rule).some(
    keyword => {
      let regex = new RegExp(keyword, 'i');
      if (regex.test(item.filename)) {
        let route = rule[keyword];
        return handle_conflict(item, route, suggest);
      }
    });
};

/* TODO: Support RegExp matching for referrer */
const apply_referrer_rule = (rule_type, item, suggest) => {
  let rule = load_rule(rule_type);
  if (!rule) return false;
  /////
  let ref_domain = (function () {
    let matches;
    if (item.referrer) {
      matches = item.referrer.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
    } else {
      matches = item.url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
    }
    return matches && matches.length && matches[1].replace(/^www\./i, '');
  })();
  if (!ref_domain) return false;
  /////
  if (rule[ref_domain]) {
    let route = rule[ref_domain];
    return handle_conflict(item, route, suggest);
  }
  /////
  if (load_item('global_ref_folders')) {
    let route = {
      path: ref_domain + '/',
      mode: DEFAULT_MODE
    };
    return handle_conflict(item, route, suggest);
  }
};

const apply_mime_rule = (rule_type, item, suggest) => {
  let rule = load_rule(rule_type);
  if (!rule) return false;
  /////
  let mime_type = item.mime;
  // Octet-stream workaround
  if (mime_type === 'application/octet-stream') {
    let matches = item.filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    let extension = matches && matches[1];
    let mapping = {
      'mp3': 'audio/mpeg',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'exe': 'application/exe',
      'avi': 'video/x-msvideo',
      'torrent': 'application/x-bittorrent'
    };
    if (mapping[extension]) {
      mime_type = mapping[extension];
    }
  }
  let route = rule[mime_type];
  return !!route && handle_conflict(item, route, suggest);
};

const apply_rules = create_mapping(RULE_TYPES,
  [apply_filename_rule, apply_referrer_rule, apply_mime_rule]);

chrome.downloads.onDeterminingFilename.addListener(
  (item, suggest) => {
    return order.some(type =>
      apply_rules[type](type, item, suggest));
  });

let version = load_item('version');
if (!version || version !== chrome.runtime.getManifest().version) {
  // Open the options page directly after installing or updating the extension
  chrome.tabs.create({url: 'options.html'});
}