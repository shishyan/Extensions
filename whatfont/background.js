/**
 * WhatFont — Background Service Worker
 * Stores active typography inspection & font pairing preferences
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ whatFontReady: true });
});
