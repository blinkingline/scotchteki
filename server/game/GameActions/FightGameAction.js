const CardGameAction = require('./CardGameAction');

class FightGameAction extends CardGameAction {
    setup() {
        this.name = 'fight';
        this.targetType = ['creature'];
        this.effectMsg = 'fight with {0}';
    }

    canAffect(card, context) {
        let fightAction = card.abilities.actions.find(action => action.title === 'Fight with this creature');
        let newContext = fightAction.createContext(context.player);
        newContext.ignoreHouse = true;
        if(!fightAction || fightAction.meetsRequirements(newContext, ['stunned'])) {
            return false;
        }
        return super.canAffect(card, context);
    }

    getEvent(card, context) {
        return super.createEvent('unnamedEvent', {card, context}, () => {
            let newContext;
            if(card.stunned) {
                let removeStunAction = card.getActions().find(action => action.title === 'Remove this creature\'s stun');
                newContext = removeStunAction.createContext(context.player);
            } else {
                let fightAction = card.abilities.actions.find(action => action.title === 'Fight with this creature');
                newContext = fightAction.createContext(context.player);
            }
            newContext.canCancel = false;
            context.game.resolveAbility(newContext);
        });
    }
}

module.exports = FightGameAction;
