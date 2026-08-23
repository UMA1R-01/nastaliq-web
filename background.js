'use strict';

function injectFiles(tabId) {
  // script inserted at document-end, css at default; allFrames handles iframes too
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    files: ['inject.js']
  }, (results) => {
    if (chrome.runtime.lastError || !results || !results.length) return;
    if (results[0].result === true) {
      // script already loaded in this frame, just re-apply in case settings changed
      chrome.tabs.sendMessage(tabId, { message: 'urtextApply' }, () => {
        void chrome.runtime.lastError; // tab may have navigated away between executeScript and here -- nothing to do
      });
    } else {
      chrome.scripting.insertCSS({ target: { tabId: tabId, allFrames: true }, files: ['css/inject.css'] });
      chrome.scripting.insertCSS({ target: { tabId: tabId, allFrames: true }, files: ['css/fonts.css'] });
    }
  });
}

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // Only ever set defaults on a genuine first install -- onInstalled also
    // fires on every update, and unconditionally resetting here previously
    // wiped every user's settings back to defaults each time the extension
    // updated.
    chrome.storage.local.set({
      active: true,
      font: 'jameel-noori-nastaleeq',
      fontScale: 100,
      lineScale: 100,
      sizesLinked: true
    });
  } else if (details.reason === 'update') {
    // One-time migration: earlier versions stored settings in chrome.storage.sync,
    // which syncs across devices/profiles and could silently overwrite local
    // changes as a normal side effect of that reconciliation. Carry any existing
    // sync settings over to local storage (which this version reads from), then
    // stop using sync so that can't happen again.
    chrome.storage.sync.get(['active', 'font', 'fontScale', 'lineScale', 'sizesLinked'], function (old) {
      if (Object.keys(old).length > 0) {
        chrome.storage.local.set(old);
        chrome.storage.sync.clear();
      }
    });
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'complete') injectFiles(tabId);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  injectFiles(activeInfo.tabId);
});
