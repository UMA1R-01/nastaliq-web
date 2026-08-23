'use strict';

var MIN_SCALE = 50;
var MAX_SCALE = 150;

function clamp(value) {
  if (isNaN(value)) return 100;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function notifyActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { message: 'urtextApply' }, function () {});
  });
}

function setFontSizeField(value) {
  document.getElementById('fs-number').value = value + '%';
}

function setLineHeightField(value) {
  document.getElementById('lh-number').value = value + '%';
}

function readFontSizeField() {
  return clamp(parseInt(document.getElementById('fs-number').value, 10));
}

function readLineHeightField() {
  return clamp(parseInt(document.getElementById('lh-number').value, 10));
}

function isLinked() {
  return document.getElementById('linkSizes').checked;
}

function applySizes(fontScale, lineScale) {
  setFontSizeField(fontScale);
  setLineHeightField(lineScale);
  chrome.storage.local.set({ fontScale: fontScale, lineScale: lineScale });
  notifyActiveTab();
}

function changeFontSize(step) {
  var value = clamp(readFontSizeField() + step);
  applySizes(value, isLinked() ? value : readLineHeightField());
}

function changeLineHeight(step) {
  var value = clamp(readLineHeightField() + step);
  applySizes(isLinked() ? value : readFontSizeField(), value);
}

function onFontSizeTyped() {
  var value = readFontSizeField();
  applySizes(value, isLinked() ? value : readLineHeightField());
}

function onLineHeightTyped() {
  var value = readLineHeightField();
  applySizes(isLinked() ? value : readFontSizeField(), value);
}

function blurOnEnter(event) {
  if (event.key === 'Enter') event.target.blur();
}

document.querySelectorAll('input[name="fontSelect"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    var font = document.querySelector('input[name="fontSelect"]:checked').value;
    chrome.storage.local.set({ font: font });
    notifyActiveTab();
  });
});

document.getElementById('switchActive').addEventListener('change', function (event) {
  document.getElementById('switchActiveLabel').textContent = event.target.checked ? 'Enabled' : 'Disabled';
  chrome.storage.local.set({ active: event.target.checked });
  notifyActiveTab();
});

document.getElementById('linkSizes').addEventListener('change', function (event) {
  var linked = event.target.checked;
  chrome.storage.local.set({ sizesLinked: linked });
  if (linked) applySizes(readFontSizeField(), readFontSizeField());
});

document.getElementById('fs-increase').addEventListener('click', function () { changeFontSize(5); });
document.getElementById('fs-decrease').addEventListener('click', function () { changeFontSize(-5); });
document.getElementById('lh-increase').addEventListener('click', function () { changeLineHeight(5); });
document.getElementById('lh-decrease').addEventListener('click', function () { changeLineHeight(-5); });

document.getElementById('fs-number').addEventListener('change', onFontSizeTyped);
document.getElementById('lh-number').addEventListener('change', onLineHeightTyped);
document.getElementById('fs-number').addEventListener('keydown', blurOnEnter);
document.getElementById('lh-number').addEventListener('keydown', blurOnEnter);

window.addEventListener('load', function () {
  chrome.storage.local.get(['active', 'font', 'fontScale', 'lineScale', 'sizesLinked'], function (data) {
    document.getElementById('switchActive').checked = data.active;
    document.getElementById('switchActiveLabel').textContent = data.active ? 'Enabled' : 'Disabled';
    document.getElementsByName('fontSelect').forEach(function (radio) {
      radio.checked = (radio.value === data.font);
    });
    setFontSizeField(data.fontScale);
    setLineHeightField(data.lineScale);
    document.getElementById('linkSizes').checked = data.sizesLinked !== false;
  });
});
