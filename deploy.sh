#!/bin/bash
export REV=`git log | head -1 | cut -f 2 -d' '`
tar czvf deploy_$REV.tgz browser_transform.js images index.html javascripts main.js node_modules stylesheets tasks.js
