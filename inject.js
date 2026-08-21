(function () {
  if (window.hasRun) return true;
  window.hasRun = true;

  var containerTags = ['DIV', 'SPAN', 'P', 'B', 'I', 'U', 'STRONG', 'LI', 'EM', 'TD', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  // Arabic-script Unicode blocks -- covers Urdu plus the wider Perso-Arabic range
  // (base letters, presentation forms, extensions, diacritics, Arabic-Indic digits).
  var ARABIC_RUN_SOURCE = '[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]';
  var ARABIC_SCRIPT_TEST = new RegExp(ARABIC_RUN_SOURCE);

  function hasUrduScript(str) {
    return ARABIC_SCRIPT_TEST.test(str);
  }

  function getContainer(node) {
    var parent = node.parentElement;
    if (parent == undefined || !containerTags.includes(parent.tagName)) parent = node;
    return parent;
  }

  function applyScaling(el, data) {
    if (!data.fontScale) return;
    el.setAttribute('data-urtext-fontscale', data.fontScale);
    el.setAttribute('data-urtext-linescale', data.lineScale);
    var xStyle = (el.getAttribute('style') || '').replace(/;urt;.+;urt;/, '');

    // Percentages must always be computed from the element's true, unscaled
    // size -- not from getComputedStyle(), which would reflect whatever was
    // last applied and cause each adjustment to compound off the last one.
    var baseSize = el.getAttribute('data-urtext-basefontsize');
    var baseHeight = el.getAttribute('data-urtext-baselineheight');
    if (baseSize === null) {
      baseSize = parseFloat(window.getComputedStyle(el).fontSize);
      baseHeight = parseFloat(window.getComputedStyle(el).lineHeight);
      el.setAttribute('data-urtext-basefontsize', baseSize);
      el.setAttribute('data-urtext-baselineheight', baseHeight);
    } else {
      baseSize = parseFloat(baseSize);
      baseHeight = parseFloat(baseHeight);
    }

    var nSize = Math.round(data.fontScale / 100 * baseSize);
    var nHeight = Math.round(data.lineScale / 100 * baseHeight);

    el.setAttribute('style', xStyle + ';urt;font-size:' + nSize + 'px;line-height:' + nHeight + 'px;urt;');
  }

  // Wraps only the contiguous Urdu/Arabic-script runs inside a text node in a
  // styled span, leaving other-language text as plain sibling text nodes --
  // this is what keeps English text sharing a tag from getting the Urdu font.
  function wrapRuns(textNode, data) {
    var text = textNode.textContent;
    var matches = text.match(new RegExp(ARABIC_RUN_SOURCE + '+', 'g'));
    if (!matches) return;

    // getContainer expects an element (it falls back to returning its argument
    // unchanged) -- pass the text node's parent, not the text node itself, or
    // the fallback path hands back a Text node with no .classList and throws.
    getContainer(textNode.parentElement).classList.add('urtext-parent');

    var frag = document.createDocumentFragment();
    var spans = [];
    var lastIndex = 0;
    var re = new RegExp(ARABIC_RUN_SOURCE + '+', 'g');
    var m;
    while ((m = re.exec(text))) {
      if (m.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
      var span = document.createElement('span');
      span.className = 'urtext-self urtext-font-' + data.font;
      span.textContent = m[0];
      frag.appendChild(span);
      spans.push(span);
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));

    if (!textNode.parentNode) return;
    textNode.parentNode.replaceChild(frag, textNode);
    // Scaling reads getComputedStyle(), which only reflects the real page
    // cascade once these spans are actually attached -- do this after insertion.
    spans.forEach(function (span) { applyScaling(span, data); });
  }

  function applyToField(field, data) {
    getContainer(field).classList.add('urtext-parent');
    field.classList.add('urtext-self');
    field.classList.add('urtext-font-' + data.font);
    applyScaling(field, data);
  }

  function clearSubtree(root) {
    if (!root) return;
    var candidates = [];
    // A shadow root is a DocumentFragment, not an Element -- .matches() doesn't
    // exist on it, but .querySelectorAll() does, so it can still contribute
    // descendant candidates even though it can never match itself.
    if (root.nodeType === Node.ELEMENT_NODE && root.matches('.urtext-parent, .urtext-self')) {
      candidates.push(root);
    }
    if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      root.querySelectorAll('.urtext-parent, .urtext-self').forEach(function (el) { candidates.push(el); });
    }
    candidates.forEach(function (el) {
      el.classList.remove('urtext-parent');
      if (!el.classList.contains('urtext-self')) return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.className.split(' ').forEach(function (c) { if (c.indexOf('urtext-') === 0) el.classList.remove(c); });
        var xStyle = el.getAttribute('style') || '';
        el.setAttribute('style', xStyle.replace(/;urt;.+;urt;/, ''));
        el.removeAttribute('data-urtext-fontscale');
        el.removeAttribute('data-urtext-linescale');
        el.removeAttribute('data-urtext-basefontsize');
        el.removeAttribute('data-urtext-baselineheight');
      } else {
        var parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        }
      }
    });
  }

  function recursiveApply(node, data) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (hasUrduScript(node.textContent)) wrapRuns(node, data);
      return;
    }
    if (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
      if (node.type !== 'hidden') {
        hasUrduScript(node.value) ? applyToField(node, data) : clearSubtree(node);
      }
      return;
    }
    // A shadow root's nodeType is DOCUMENT_FRAGMENT_NODE, not DOCUMENT_NODE --
    // treat it the same as a root so traversal descends into shadow trees too.
    var isDocumentRoot = node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
    var isPlainElement = node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('urtext-self');
    if (isDocumentRoot || isPlainElement) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) { recursiveApply(child, data); });
    }
  }

  function sameFont(el, font) {
    return el.classList.contains('urtext-font-' + font);
  }

  function sameScaling(el, data) {
    var fontScale = parseInt(el.getAttribute('data-urtext-fontscale') || 0, 10);
    var lineScale = parseInt(el.getAttribute('data-urtext-linescale') || 0, 10);
    return fontScale === data.fontScale && lineScale === data.lineScale;
  }

  function switchFontAll(root, font) {
    root.querySelectorAll("[class*='urtext-font-']").forEach(function (el) {
      Array.prototype.slice.call(el.classList).forEach(function (c) {
        if (c.indexOf('urtext-font-') === 0) el.classList.remove(c);
      });
      el.classList.add('urtext-font-' + font);
    });
  }

  function switchScalingAll(root, data) {
    root.querySelectorAll("[class*='urtext-font-']").forEach(function (el) { applyScaling(el, data); });
  }

  function fontApply(root, data) {
    var existing = root.nodeType === Node.ELEMENT_NODE && root.matches("[class*='urtext-font-']")
      ? root
      : root.querySelector("[class*='urtext-font-']");
    if (existing) {
      if (!sameFont(existing, data.font)) switchFontAll(root, data.font);
      if (!sameScaling(existing, data)) switchScalingAll(root, data);
    } else {
      recursiveApply(root, data);
    }
  }

  function actionApply(node) {
    // 1. On re-installation this script may go orphan; checking runtime avoids a fatal error.
    // 2. Skip nodes that can't meaningfully carry Urdu text or can't be queried into.
    if (chrome.runtime == undefined || chrome.runtime.id == undefined ||
      ['IMG', 'IFRAME', 'SCRIPT', 'LINK', 'STYLE'].indexOf(node.nodeName) > -1 ||
      typeof node.querySelectorAll === 'undefined') return;
    if (node.nodeName === '#document') node = document.body;

    chrome.storage.local.get(['active', 'font', 'fontScale', 'lineScale'], function (data) {
      data.active ? fontApply(node, data) : clearSubtree(node);
    });
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'urtextApply') {
      actionApply(document);
      knownShadowRoots.forEach(function (root) { actionApply(root); });
      sendResponse({ success: true });
    }
  });

  // Sites built with web components (YouTube, and most modern SPAs) render
  // real content inside shadow roots, which a light-DOM-only observer/
  // traversal never sees. Track every OPEN shadow root we find so we can
  // apply/clear text in them too, and watch each one for its own mutations
  // (mutations inside a shadow root do not bubble to an outside observer).
  // Closed shadow roots are inherently inaccessible to any script -- there's
  // no workaround for those.
  var knownShadowRoots = [];

  function observeRoot(root) {
    var obs = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          var added = mutation.addedNodes[i];
          actionApply(added);
          discoverShadowRoots(added);
        }
      });
    });
    obs.observe(root, { childList: true, subtree: true });
  }

  function registerShadowRoot(root) {
    knownShadowRoots.push(root);
    observeRoot(root);
    actionApply(root);
    discoverShadowRoots(root);
  }

  function discoverShadowRoots(node) {
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.shadowRoot && knownShadowRoots.indexOf(node.shadowRoot) === -1) {
      registerShadowRoot(node.shadowRoot);
    }
    node.querySelectorAll('*').forEach(function (el) {
      if (el.shadowRoot && knownShadowRoots.indexOf(el.shadowRoot) === -1) registerShadowRoot(el.shadowRoot);
    });
  }

  observeRoot(document.documentElement);
  discoverShadowRoots(document.documentElement);

  document.querySelectorAll('input,textarea').forEach(function (input) {
    input.addEventListener('input', function (event) { actionApply(event.target); });
  });

  actionApply(document.body);

})();
