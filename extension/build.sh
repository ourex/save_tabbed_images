#!/usr/bin/env bash

# Borrowed from https://github.com/BinaryMuse/chrome-fast-tab-switcher

./node_modules/.bin/browserify -t reactify -o js_packaged/popup.js js_src/popup.jsx
