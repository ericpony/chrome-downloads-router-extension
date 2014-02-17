Downloads Router
===============

Downloads Router is an extension for Chromium and Google Chrome that allows the user
to establish routing rules, directing downloads to folders based on filetypes and optionally source website.



Changelog
---------

### 0.2 (February 17, 2014)

* Initial commit, tested on Linux (Chromium) and OS X (Google Chrome)
* Options page allows the creation of routing rules based on filetypes and referrer
* The manager listens to `onDeterminingFilename` events and creates suggestions based on the maps created on the options page