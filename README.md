![save tabbed images icon](https://github.com/iqnivek/save_tabbed_images/raw/master/dist/img/icon48.png)

# Save Tabbed Images

A simple and easy-to-use chrome extension to download all images opened as tabs in one click.

[**Get the extension at the Chrome web store**](https://chrome.google.com/webstore/detail/save-tabbed-images/hhcoikfhkkadkgklepjkfgafmjoggefh).

![Demo](https://github.com/iqnivek/save_tabbed_images/raw/master/assets/screenshots/demo.gif)

## Development

Install node modules:

```
npm install
```

Compile and watch for javascript changes:

```
npm run watch
```

Check for linting errors:

```
npm run lint
```

### Packaging for Chrome web store release

* Update version in dist/manifest.json
* Summarize the changes made from the last release (list pull requests) in CHANGELOG.md
* Create git tag with `git tag x.x.x` and push it with `git push origin --tags`
* Build a production version of webpack bundle with `npm run package`
* Create a .zip file of the `dist` folder named `save_tabbed_images_<version>.zip`
* [Create a new release in github](https://github.com/iqnivek/save_tabbed_images/releases) and attach the .zip file. In the description, add the summary from CHANGELOG.md.
* Upload the .zip file to the chrome web store

### License

Save Tabbed Images is [MIT licensed](https://opensource.org/licenses/MIT).
