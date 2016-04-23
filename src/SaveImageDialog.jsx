import React from 'react';
import chrome from 'chrome';
import pluralize from 'pluralize';
import _ from 'underscore';
import dateFormat from 'dateformat';

const PENDING = 'pending';
const COMPLETE = 'complete';

class SaveImageDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabList: [],
      downloadStatuses: {},
      useCustomDownloadLocation: false,
      customDownloadLocation: `SaveTabbedImages-${dateFormat(new Date(), "yyyy-mm-dd-HHMMss")}`,
    };

    this.getTabsWithImages = this.getTabsWithImages.bind(this);
    this.getCompletedTabs = this.getCompletedTabs.bind(this);
    this.getDownloadPath = this.getDownloadPath.bind(this);
    this.isDownloading = this.isDownloading.bind(this);
    this.isComplete = this.isComplete.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
    this.hasImages = this.hasImages.bind(this);
    this.renderTabListItem = this.renderTabListItem.bind(this);
    this.imageCount = this.imageCount.bind(this);
    this.renderDownloadOptions = this.renderDownloadOptions.bind(this);
    this.onSubmitDownloadOptions = this.onSubmitDownloadOptions.bind(this);
    this.onClickCloseDownloadedTabs = this.onClickCloseDownloadedTabs.bind(this);
    this.onClickDismiss = this.onClickDismiss.bind(this);
    this.onChangeCustomDownloadLocation = this.onChangeCustomDownloadLocation.bind(this);
    this.onChangeCustomDownloadLocationPath = this.onChangeCustomDownloadLocationPath.bind(this);
  }

  getTabsWithImages(callback) {
    chrome.tabs.query(
      { currentWindow: true },
      (tabs) => {
        // Query background process for which tabs are images
        chrome.runtime.sendMessage({ type: 'checktabs', tabs: tabs }, (response) => {
          callback(response.tabs);
        });
      }
    );
  }

  getCompletedTabs() {
    return _.compact(
      _.map(this.state.downloadStatuses, (status, tabID) => {
        return (status === COMPLETE) ? parseInt(tabID, 10) : null;
      })
    );
  }

  getDownloadPath() {
    if (this.state.useCustomDownloadLocation) {
      return this.state.customDownloadLocation + '/';
    }
    return '';
  }

  componentDidMount() {
    // get image list
    this.getTabsWithImages((tabs) => {
      this.setState({ tabList: tabs });
    });

    // set download location
    chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
      suggest({
        filename: this.getDownloadPath() + downloadItem.filename
      });
    });
  }

  isDownloading() {
    return _.any(
      _.values(this.state.downloadStatuses),
      (status) => (status === PENDING)
    );
  }

  isComplete() {
    return _.size(this.state.downloadStatuses) > 0 &&
      _.all(
        _.values(this.state.downloadStatuses),
        (status) => (status === COMPLETE)
      );
  }

  onClickDownload() {
    this.getTabsWithImages((tabs) => {
      const statuses = _.reduce(tabs, (memo, tab) => {
        memo[tab.id] = PENDING;
        return memo;
      }, {});
      this.setState({
        downloadStatuses: statuses
      });

      tabs.forEach((tab) => {
        chrome.downloads.download(
          { url: tab.url, conflictAction: 'uniquify' },
          (id) => {
            if (id) {
              // Download successful
              const newStatuses = _({}).extend(this.state.downloadStatuses);
              newStatuses[tab.id] = COMPLETE;
              this.setState({
                downloadStatuses: newStatuses
              });
            } else {
              // Download failed
            }
          }
        );
      });
    });
  }

  hasImages() {
    return this.imageCount() > 0;
  }

  renderTabListItem(tab) {
    return (
      <li key={tab.id} className={this.state.downloadStatuses[tab.id]}>
        <a href={tab.url}>{tab.url}</a>
      </li>
    );
  }

  imageCount() {
    return this.state.tabList.length;
  }

  renderDownloadOptions() {
    return (
      <form id="download-options" onSubmit={this.onSubmitDownloadOptions}>
        <ul>
          <li>
            <input
              id="path-option-default"
              type="radio"
              value="default"
              checked={!this.state.useCustomDownloadLocation} onChange={this.onChangeCustomDownloadLocation}
            />
            <label htmlFor="path-option-default">Default download location</label>
          </li>
          <li>
            <input
              id="path-option-custom"
              type="radio"
              value="custom"
              checked={this.state.useCustomDownloadLocation} onChange={this.onChangeCustomDownloadLocation}
            />
            <div className="path-wrapper">
              <label htmlFor="path-option-custom">Subfolder within default location</label>
              <input
                id="path"
                type="text"
                value={this.state.customDownloadLocation}
                disabled={!this.state.useCustomDownloadLocation}
                onChange={this.onChangeCustomDownloadLocationPath}
              />
            </div>
          </li>
        </ul>
      </form>
    );
  }

  onSubmitDownloadOptions(event) {
    event.preventDefault();
    this.onClickDownload();
  }

  onClickCloseDownloadedTabs() {
    chrome.tabs.remove(this.getCompletedTabs());
    this.onClickDismiss();
  }

  onClickDismiss() {
    window.close();
  }

  onChangeCustomDownloadLocation(event) {
    if (event.target.value === 'default') {
      this.setState({ useCustomDownloadLocation: false });
    } else {
      this.setState({ useCustomDownloadLocation: true });
    }
  }

  onChangeCustomDownloadLocationPath(event) {
    this.setState({
      customDownloadLocation: event.target.value
    });
  }

  render() {
    const content = this.hasImages() ? (
      <div>
        <button id="download" disabled={this.isDownloading()} onClick={this.onClickDownload}>
          Download {pluralize('image', this.imageCount(), true)}
        </button>
        {this.renderDownloadOptions()}
        <ul id="links">
          {this.state.tabList.map(this.renderTabListItem)}
        </ul>
        {this.isComplete() ? <button id="close-tabs" onClick={this.onClickCloseDownloadedTabs}>Close Downloaded Tabs</button> : null}
      </div>
    ) : (
      <div>
        <div className="align-center padding">
          <img src="img/icon48.png" alt="icon" />
          <h1>Save Tabbed Images</h1>
          <p>No images opened in current window.</p>
          <p>Right click an image and select "Open Image in New Tab" to get started.</p>
        </div>
        <button id="dismiss" onClick={this.onClickDismiss}>Got it</button>
      </div>
    );

    return (
      <div className="save-image-dialog">
        {content}
      </div>
    );
  }
}

export default SaveImageDialog;
