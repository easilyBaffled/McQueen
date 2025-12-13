/**
 * McQueen Chrome Extension - Content Script
 * Scans ESPN.com pages for player names and injects stock market indicators
 */

(function() {
  'use strict';

  // Marker class to avoid processing same element twice
  const PROCESSED_MARKER = 'mcqueen-processed';
  const INDICATOR_CLASS = 'mcqueen-indicator';

  // Get player data from global scope (loaded via playerData.js)
  const getPlayerData = () => window.MCQUEEN_PLAYERS || {};

  /**
   * Build a sorted list of search terms (longest first for better matching)
   */
  function getSearchTerms() {
    const players = getPlayerData();
    return Object.keys(players).sort((a, b) => b.length - a.length);
  }

  /**
   * Create the stock indicator badge element
   */
  function createIndicatorBadge(player) {
    const badge = document.createElement('span');
    badge.className = INDICATOR_CLASS;
    
    const priceSpan = document.createElement('span');
    priceSpan.className = 'mcqueen-price';
    priceSpan.textContent = `$${player.currentPrice.toFixed(2)}`;
    
    const trendSpan = document.createElement('span');
    trendSpan.className = `mcqueen-trend mcqueen-trend-${player.trend}`;
    
    const arrow = player.trend === 'up' ? '▲' : '▼';
    const percentChange = Math.abs(player.changePercent).toFixed(2);
    trendSpan.textContent = `${arrow} ${percentChange}%`;
    
    badge.appendChild(priceSpan);
    badge.appendChild(document.createTextNode(' '));
    badge.appendChild(trendSpan);
    
    return badge;
  }

  /**
   * Check if an element or its ancestors should be skipped
   */
  function shouldSkipElement(element) {
    // Skip if already processed
    if (element.closest(`.${PROCESSED_MARKER}`)) return true;
    if (element.closest(`.${INDICATOR_CLASS}`)) return true;
    
    // Skip form elements, scripts, styles
    const skipTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'NOSCRIPT'];
    if (skipTags.includes(element.tagName)) return true;
    
    // Skip hidden elements
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    
    return false;
  }

  /**
   * Find and process text nodes containing player names
   */
  function processTextNode(textNode) {
    const text = textNode.textContent;
    if (!text || text.trim().length < 3) return;

    const players = getPlayerData();
    const searchTerms = getSearchTerms();
    const lowerText = text.toLowerCase();

    // Find first matching player name
    for (const term of searchTerms) {
      const index = lowerText.indexOf(term);
      if (index === -1) continue;

      // Verify it's a word boundary match (not partial word)
      const beforeChar = index > 0 ? lowerText[index - 1] : ' ';
      const afterChar = index + term.length < lowerText.length ? lowerText[index + term.length] : ' ';
      
      if (!/\s|[,.:;!?()[\]{}'"<>]/.test(beforeChar) && beforeChar !== ' ' && index !== 0) continue;
      if (!/\s|[,.:;!?()[\]{}'"<>]/.test(afterChar) && afterChar !== ' ' && index + term.length !== lowerText.length) continue;

      const player = players[term];
      if (!player) continue;

      // Create wrapper and inject indicator
      const parent = textNode.parentElement;
      if (!parent || shouldSkipElement(parent)) continue;

      // Don't process if parent already has an indicator
      if (parent.querySelector(`.${INDICATOR_CLASS}`)) continue;

      // Mark as processed
      parent.classList.add(PROCESSED_MARKER);

      // Insert indicator after the parent element
      const badge = createIndicatorBadge(player);
      
      // Try to insert after the name, or append to parent
      if (parent.nextSibling) {
        parent.parentNode.insertBefore(badge, parent.nextSibling);
      } else {
        parent.parentNode.appendChild(badge);
      }

      return; // Only add one indicator per text node
    }
  }

  /**
   * Scan the DOM for player names using TreeWalker
   */
  function scanDocument(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.textContent || node.textContent.trim().length < 3) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkipElement(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Process collected nodes
    textNodes.forEach(processTextNode);
  }

  /**
   * Set up MutationObserver to handle dynamic content
   */
  function observeDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Debounce scanning to avoid performance issues
            setTimeout(() => scanDocument(node), 100);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize the extension
   */
  function init() {
    // Wait for player data to be available
    if (!window.MCQUEEN_PLAYERS) {
      console.log('[McQueen] Waiting for player data...');
      setTimeout(init, 100);
      return;
    }

    console.log('[McQueen] Extension initialized with', Object.keys(window.MCQUEEN_PLAYERS).length, 'player terms');
    
    // Initial scan
    scanDocument();
    
    // Watch for dynamic content (ESPN uses client-side routing)
    observeDynamicContent();
    
    // Re-scan on URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[McQueen] URL changed, rescanning...');
        setTimeout(scanDocument, 500);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

