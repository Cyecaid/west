import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor(name = 'Мирная утка', power = 2) {
        super(name, power);
    }

    quacks() {
        console.log('quacks');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);

        this.modifyTakenDamage = function (value, fromCard, gameContext, continuation) {
            this.view.signalAbility(() => continuation(value - 1));
        };

        this.getDescriptions = function () {
            const baseDescriptions = Card.prototype.getDescriptions.call(this);
            const abilityDescription = "Способность: Уменьшает урон на 1.";
            return [...baseDescriptions, abilityDescription];
        };
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', power = 6) {
        super(name, power);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));

        oppositePlayer.table.forEach((card, index) => {
            taskQueue.push(onDone => {
                if (card) {
                    this.dealDamageToCreature(2, card, gameContext, onDone);
                } else {
                    onDone();
                }
            });
        });

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }


    getDescriptions() {
        const baseDescriptions = Card.prototype.getDescriptions.call(this);

        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            baseDescriptions.push("Чем их больше, тем они сильнее");
        }

        return baseDescriptions;
    }
}

class Rogue extends Creature {
    constructor(name = 'Изгой', power = 2) {
        super(name, power);
    }

    doBeforeAttack(gameContext, continuation) {
        const { oppositePlayer, updateView } = gameContext;
        const targetCard = oppositePlayer.table.find(card => card && card !== this);

        if (targetCard) {
            const targetPrototype = Object.getPrototypeOf(targetCard);

            ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'].forEach(prop => {
                if (targetPrototype.hasOwnProperty(prop)) {
                    this[prop] = targetPrototype[prop];
                    delete targetPrototype[prop];
                }
            });

            oppositePlayer.table.forEach(card => {
                if (card && Object.getPrototypeOf(card) === targetPrototype) {
                    updateView(card);
                }
            });
        }

        continuation();
    }
}

class PseudoDuck extends Dog {
    constructor(name = 'Псевдоутка', power = 3) {
        super(name, power);
    }

    quacks() {
        console.log('quacks');
    }

    swims() {
        console.log('float: both;');
    }
}


// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


const seriffStartDeck = [
    new Duck(),
];
const banditStartDeck = [
    new PseudoDuck(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
