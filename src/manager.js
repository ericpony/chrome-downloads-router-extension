let order = JSON.parse(localStorage.getItem('dr_order'));
let rulesets = {};

if (!order) {
  order = ['filename', 'referrer', 'mime'];
}

rulesets['filename'] = function (downloadItem, suggest) {
  let filename_map = JSON.parse(localStorage.getItem('dr_filename_map'));
  let keys = Object.keys(filename_map);
  if (keys.length) {
    let idx, regex, matches;
    for (idx = 0; idx < keys.length; idx++) {
      regex = new RegExp(keys[idx], 'i');
      matches = regex.exec(downloadItem.filename);
      if (matches) {
        suggest({filename: filename_map[keys[idx]] + downloadItem.filename});
        return true;
      }
    }
  }
  return false;
};

rulesets['referrer'] = function (downloadItem, suggest) {
  let ref_map = JSON.parse(localStorage.getItem('dr_referrer_map'));
  let ref_domain;
  if (Object.keys(ref_map).length) {
    let matches;
    if (downloadItem.referrer) {
      matches = downloadItem.referrer.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
    } else {
      matches = downloadItem.url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
    }
    ref_domain = matches && matches[1].replace(/^www\./i, '');
    if (ref_map[ref_domain]) {
      suggest({filename: ref_map[ref_domain] + downloadItem.filename});
      return true;
    }
  }

  if (JSON.parse(localStorage.getItem('dr_global_ref_folders'))) {
    suggest({filename: ref_domain + '/' + downloadItem.filename});
    return true;
  }
  return false;
};

rulesets['mime'] = function (downloadItem, suggest) {
  let mime_map = JSON.parse(localStorage.getItem('dr_mime_map'));
  let mime_type = downloadItem.mime;

  // Octet-stream workaround
  if (mime_type === 'application/octet-stream') {
    let matches = downloadItem.filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
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
  let folder = mime_map[mime_type];
  if (folder) {
    suggest({filename: folder + downloadItem.filename});
    return true;
  }
  return false;
};


chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {
  order.every(function (idx) {
    return !rulesets[idx](downloadItem, suggest);
  });
});

let version = localStorage.getItem('dr_version');

if (!version || version !== chrome.runtime.getManifest().version) {
  // Open the options page directly after installing or updating the extension
  chrome.tabs.create({url: "options.html"});
  localStorage.setItem('dr_version', chrome.runtime.getManifest().version);
}
