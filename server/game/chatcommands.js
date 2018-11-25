const _ = require('underscore');
const GameActions = require('./GameActions');

class ChatCommands {
    constructor(game) {
        this.game = game;
        this.commands = {
            '/draw': this.draw,
            '/discard': this.discard,
            '/cancel-prompt': this.cancelPrompt,
            '/token': this.setToken,
            '/forge': this.forge,
            '/unforge': this.unforge,
            '/active-house': this.activeHouse,
            '/stop-clocks': this.stopClocks,
            '/start-clocks': this.startClocks,
            '/modify-clock': this.modifyClock,
            '/disconnectme': this.disconnectMe,
            '/manual': this.manual
        };
        this.tokens = [
            'amber',
            'damage',
            'power',
            'stun'
        ];
        this.houses = [
            'brobnar',
            'dis',
            'logos',
            'mars',
            'sanctum',
            'shadows',
            'untamed',
            'none'
        ];
    }

    executeCommand(player, command, args) {
        if(!player || !this.commands[command]) {
            return false;
        }

        return this.commands[command].call(this, player, args) !== false;
    }

    forge(player) {
        this.game.addMessage('{0} uses the /forge command to forge a key', player);
        player.keys += 1;
    }

    unforge(player) {
        if(player.keys === 0) {
            return;
        }
        this.game.addMessage('{0} uses the /unforge command to unforge a key', player);
        player.keys -= 1;
    }

    activeHouse(player, args) {
        let house = args[1];
        if(!house) {
            return;
        } else if(!player.activeHouse) {
            this.game.addMessage('{0} attempted to change their active house with /active-house, but they cannot have an active house currently', player, house);
        } else if(!this.houses.includes(house.toLowerCase())) {
            this.game.addMessage('{0} attempted to change their active house with /active-house, but {1} is not a valid house', player, house);
        } else {
            this.game.addMessage('{0} manually changed their active house to {1}', player, house);
            player.activeHouse = house.toLowerCase();
        }
    }

    startClocks(player) {
        this.game.addMessage('{0} restarts the timers', player);
        _.each(this.game.getPlayers(), player => player.clock.restart());
    }

    stopClocks(player) {
        this.game.addMessage('{0} stops the timers', player);
        _.each(this.game.getPlayers(), player => player.clock.pause());
    }

    modifyClock(player, args) {
        let num = this.getNumberOrDefault(args[1], 60);
        this.game.addMessage('{0} adds {1} seconds to their clock', player, num);
        player.clock.modify(num);
    }

    draw(player, args) {
        var num = this.getNumberOrDefault(args[1], 1);

        this.game.addMessage('{0} uses the /draw command to draw {1} cards to their hand', player, num);

        player.drawCardsToHand(num);
    }

    discard(player, args) {
        var num = this.getNumberOrDefault(args[1], 1);

        this.game.addMessage('{0} uses the /discard command to discard {1} card{2} at random', player, num, num > 1 ? 's' : '');

        GameActions.discardAtRandom({ amount: num }).resolve(player, this.game.getFrameworkContext());
    }

    cancelPrompt(player) {
        this.game.addMessage('{0} uses the /cancel-prompt to skip the current step.', player);
        this.game.pipeline.cancelStep();
        this.game.cancelPromptUsed = true;
    }

    setToken(player, args) {
        var token = args[1];
        var num = this.getNumberOrDefault(args[2], 1);

        if(!this.isValidToken(token)) {
            return false;
        }

        this.game.promptForSelect(player, {
            activePromptTitle: 'Select a card',
            waitingPromptTitle: 'Waiting for opponent to set token',
            cardCondition: card => (card.location === 'play area') && card.controller === player,
            onSelect: (p, card) => {
                var numTokens = card.tokens[token] || 0;

                card.addToken(token, num - numTokens);
                this.game.addMessage('{0} uses the /token command to set the {1} token count of {2} to {3}', p, token, card, num - numTokens);

                return true;
            }
        });
    }

    reveal(player) {
        this.game.promptForSelect(player, {
            activePromptTitle: 'Select a card',
            cardCondition: card => card.facedown && card.controller === player,
            onSelect: (player, card) => {
                card.facedown = false;
                this.game.addMessage('{0} reveals {1}', player, card);
                return true;
            }
        });
    }

    disconnectMe(player) {
        player.socket.disconnect();
    }

    manual(player) {
        if(this.game.manualMode) {
            this.game.manualMode = false;
            this.game.addAlert('danger', '{0} switches manual mode off', player);
        } else {
            this.game.manualMode = true;
            this.game.addAlert('danger', '{0} switches manual mode on', player);
        }
    }

    getNumberOrDefault(string, defaultNumber) {
        var num = parseInt(string);

        if(isNaN(num)) {
            num = defaultNumber;
        }

        if(num < 0) {
            num = defaultNumber;
        }

        return num;
    }

    isValidToken(token) {
        if(!token) {
            return false;
        }

        var lowerToken = token.toLowerCase();

        return _.contains(this.tokens, lowerToken);
    }
}

module.exports = ChatCommands;