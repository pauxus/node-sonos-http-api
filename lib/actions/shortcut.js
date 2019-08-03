'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const shortcuts = require('../shortcuts-loader');


function shortcutAction(api) {
    return function(player, values) {
        const id = values[0];
        const shortcut = shortcuts[id]

        if (shortcut) {
            const sleep = (milliseconds) => {
                return new Promise(resolve => setTimeout(resolve, milliseconds))
            }
              
            shortcut.commands.forEach(command => {
                var delay = 500;
                if (command.delay)
                    delay = command.delay

                sleep(delay).then(() => {
                    const opt = {};
                    opt.player = player;
                    opt.action = command.action;
                    opt.values = command.values;

                    logger.info(`calling ${opt.action} on ${opt.player.roomName} with ${opt.values}`)
                    api.handleAction(opt)
                })
            });

        } else {
            const simpleShortcuts = Object.keys(shortcuts);
            return Promise.resolve(simpleShortcuts);
        }
    }
}

module.exports = function (api) {
  api.registerAction('shortcut', shortcutAction(api));
};
