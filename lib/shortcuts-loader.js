'use strict';
const fs = require('fs');
const util = require('util');
const path = require('path');
const logger = require('sonos-discovery/lib/helpers/logger');
const tryLoadJson = require('./helpers/try-load-json');
const settings = require('../settings');

const SHORTCUTS_PATH = settings.shortcutsDir;
const shortcuts = {};

function readFilesFromDir(collection, shortcutPath) {
  let files;
  try {
    files = fs.readdirSync(shortcutPath);
  } catch (e) {
    logger.warn(`Could not find dir ${shortcutPath}, are you sure it exists?`);
    logger.warn(e.message);
    return;
  }

  files.map((name) => {
    let fullPath = path.join(shortcutPath, name);
    return {
      name,
      fullPath,
      stat: fs.statSync(fullPath)
    };
  }).filter((file) => {
    return !file.stat.isDirectory() && !file.name.startsWith('.') && file.name.endsWith('.json');
  }).forEach((file) => {
    const presetName = file.name.replace(/\.json/i, '');
    const preset = tryLoadJson(file.fullPath);
    if (Object.keys(preset).length === 0) {
      logger.warn(`could not parse shortcut file ${file.name}, please make sure syntax conforms with JSON5.`);
      return;
    }

    collection[presetName] = preset;
  });

}

function initShortcuts() {
  Object.keys(shortcuts).forEach(shortcutName => {
    delete shortcuts[shortcutName];
  });
  readFilesFromDir(shortcuts, SHORTCUTS_PATH);
  logger.info('Shortcuts loaded:', util.inspect(shortcuts, { depth: null }));
}

initShortcuts();
let watchTimeout;
try {
  fs.watch(SHORTCUTS_PATH, { persistent: false }, () => {
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(initShortcuts, 200);
  });
} catch (e) {
  logger.warn(`Could not start watching dir ${SHORTCUTS_PATH}, will not auto reload any presets. Make sure the dir exists`);
  logger.warn(e.message);
}

module.exports = shortcuts;
