chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest) {

	/* Filename-based mapping */
	filename_map = JSON.parse(localStorage.getItem('dr_filename_map'));

	var keys = Object.keys(filename_map);
	if(keys.length) {
		var idx, regex, matches;
		for(idx = 0; idx < keys.length; idx++) {
			regex   = new RegExp(keys[idx], 'i');
			matches = regex.exec(downloadItem.filename);
			if(matches) {
				suggest({ filename: filename_map[keys[idx]] + downloadItem.filename });
				return;
			}
		}
	}

	/* Referrer-based mapping */
	ref_map = JSON.parse(localStorage.getItem('dr_referrer_map'));

	console.log(ref_map);
	if(Object.keys(ref_map).length) {
		var matches    = downloadItem.referrer.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
		var ref_domain = matches && matches[1];

		if(ref_map[ref_domain]) {
			suggest({ filename: ref_map[ref_domain] + downloadItem.filename });
			return;
		}
	}

	/* MIME-based mapping */
	mime_map  = JSON.parse(localStorage.getItem('dr_mime_map'));
	mime_type = downloadItem.mime;    

	// Octet-stream workaround
	if(mime_type == 'application/octet-stream') {
		var matches   = downloadItem.filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		var extension = matches && matches[1];
		var mapping   = {
			'mp3': 'audio/mpeg',
			'pdf': 'application/pdf',
			'zip': 'application/zip',
			'png': 'image/png',
			'jpg': 'image/jpeg',
			'avi': 'video/x-msvideo'
		};

		if(mapping[extension]) {
			mime_type = mapping[extension];
		}
	}

	folder = mime_map[mime_type];
	if(!folder) {
		return;
	}

	suggest({ filename: folder + downloadItem.filename });
});

if(!localStorage.getItem('dr_mime_map')) {
	// Open the options page directly after installing the extension
	chrome.tabs.create({ url: "options.html" });
}
