import React from 'react';
import update from 'react-addons-update';
import chrome from 'chrome';
import pluralize from 'pluralize';
import _ from 'underscore';

import { getTabsWithImages } from './backgroundHelpers';
import DownloadOptions from './DownloadOptions';
import NoImagesMessage from './NoImagesMessage';

const PENDING = 'pending';
const COMPLETE = 'complete';

class Extension extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabList: [],
      downloadStatuses: {},
      showFileList: false,
    };

    this.getCompletedTabs = this.getCompletedTabs.bind(this);
    this.isDownloading = this.isDownloading.bind(this);
    this.isComplete = this.isComplete.bind(this);
    this.hasImages = this.hasImages.bind(this);
    this.imageCount = this.imageCount.bind(this);
    this.renderTabListItem = this.renderTabListItem.bind(this);
    this.onToggleFileList = this.onToggleFileList.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
    this.onSubmitDownloadOptions = this.onSubmitDownloadOptions.bind(this);
    this.onClickCloseDownloadedTabs = this.onClickCloseDownloadedTabs.bind(this);
  }

  getCompletedTabs() {
    return _.compact(
      _.map(this.state.downloadStatuses, (status, tabID) => {
        return (status === COMPLETE) ? parseInt(tabID, 10) : null;
      })
    );
  }

  componentDidMount() {
    getTabsWithImages((tabs) => {
      this.setState({ tabList: tabs });
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
    getTabsWithImages((tabs) => {
      this.setState({
        downloadStatuses: _.reduce(tabs, (memo, tab) => {
          memo[tab.id] = PENDING;
          return memo;
        }, {})
      });

      tabs.forEach((tab) => {
        chrome.downloads.download(
          { url: tab.url, conflictAction: 'uniquify' },
          (id) => {
            if (id) {
              // Download successful
              this.setState(update(this.state, {
                downloadStatuses: {
                  [tab.id]: { $set: COMPLETE }
                }
              }));
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

  onToggleFileList() {
    this.setState({
      showFileList: !this.state.showFileList,
    });
  }

  renderFileList() {
    if (!this.state.showFileList) {
      return null;
    }
    return (
      <ul id="files" className="background-gray padding text-smaller">
        {this.state.tabList.map(this.renderTabListItem)}
      </ul>
    );
  }

  renderCloseButton() {
    return this.isComplete() ? (
      <button id="close-tabs" onClick={this.onClickCloseDownloadedTabs}>Close Downloaded Tabs</button>
    ) : null;
  }

  render() {
    const content = this.hasImages() ? (
      <div>
        <button id="download" disabled={this.isDownloading()} onClick={this.onClickDownload}>
          Download {pluralize('image', this.imageCount(), true)}
        </button>

        <DownloadOptions
          onSubmit={this.onSubmitDownloadOptions}
        />
        <div className="progress align-center padding" title="Click to see image list" onClick={this.onToggleFileList}>
          <div className="progress-count">
            {this.getCompletedTabs().length} of {this.imageCount()}
          </div>
          <div className="text-smaller">images downloaded</div>
        </div>
        {this.renderFileList()}
        {this.renderCloseButton()}
      </div>
    ) : (
      <NoImagesMessage onClickDismiss={this.onClickDismiss} />
    );

    return <div>{content}</div>;
  }
}

export default Extension;