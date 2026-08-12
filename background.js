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
      chrome.tabs.sendMessage(tabId, { message: 'urtextApply' }, () => {});
    } else {
      chrome.scripting.insertCSS({ target: { tabId: tabId, allFrames: true }, files: ['css/inject.css'] });
      chrome.scripting.insertCSS({ target: { tabId: tabId, allFrames: true }, files: ['css/fonts.css'] });
    }
  });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({
    active: true,
    font: 'jameel-noori-nastaleeq',
    fontScale: 100,
    lineScale: 100,
    sizesLinked: true
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'complete') injectFiles(tabId);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  injectFiles(activeInfo.tabId);
});
