class Shop {
    constructor(game) {
        this.game = game;
        this.skillUpgradeCost = 10;
        this.moneyUpgradeCost = 20;
        this.rocketCost = 10000;
        this.jupiterCost = 200000; // 200,000 for Jupiter
        this.sunCost = 2500000; // 2.5 million for Sun

        // Load saved state
        const savedState = JSON.parse(localStorage.getItem('gameState')) || {};
        const savedUpgrades = savedState.shopUpgrades || {};

        // Initialize states from saved data
        this.skillUpgradeCount = (savedUpgrades.skill && savedUpgrades.skill.level) || 0;
        this.moneyUpgradeCount = (savedUpgrades.multiplier && savedUpgrades.multiplier.level) || 0;
        this.moonUnlocked = savedState.moonUnlocked || false;
        this.jupiterUnlocked = savedState.jupiterUnlocked || false;
        this.sunUnlocked = savedState.sunUnlocked || false;

        // Sync game state with saved state
        this.game.moonUnlocked = this.moonUnlocked;
        this.game.currentWorld = savedState.currentWorld || 'earth';

        // Calculate upgrade costs based on current levels
        if (this.skillUpgradeCount > 0) {
            for (let i = 0; i < this.skillUpgradeCount; i++) {
                this.skillUpgradeCost = Math.floor(this.skillUpgradeCost * 1.1);
            }
        }

        if (this.moneyUpgradeCount > 0) {
            for (let i = 0; i < this.moneyUpgradeCount; i++) {
                this.moneyUpgradeCost = Math.floor(this.moneyUpgradeCost * 3);
            }
        }

        // Set max upgrades based on current world
        if (this.sunUnlocked) {
            this.maxUpgrades = 100;
        } else if (this.jupiterUnlocked) {
            this.maxUpgrades = 50;
        } else if (this.moonUnlocked) {
            this.maxUpgrades = 30;
        } else {
            this.maxUpgrades = 15;
        }

        // Add codes system
        this.validCodes = {
            'SMAXJAX': {
                reward: 10000,
                used: false
            }
        };

        // Add code redemption listener
        const redeemButton = document.getElementById('redeemCode');
        const codeInput = document.getElementById('codeInput');

        redeemButton.addEventListener('click', () => {
            const code = codeInput.value.toUpperCase();
            this.redeemCode(code);
            codeInput.value = ''; // Clear input after attempt
        });

        // Load used codes from storage
        if (savedState.usedCodes) {
            Object.keys(savedState.usedCodes).forEach(code => {
                if (this.validCodes[code]) {
                    this.validCodes[code].used = savedState.usedCodes[code];
                }
            });
        }

        this.setupListeners();

        // Initialize UI state
        this.updateButtonStates();
        document.getElementById('world').textContent = `World: ${this.game.currentWorld.charAt(0).toUpperCase() + this.game.currentWorld.slice(1)}`;
    }

    setupListeners() {
        document.getElementById('skillUpgrade').addEventListener('click', () => this.upgradeSkill());
        document.getElementById('moneyUpgrade').addEventListener('click', () => this.upgradeMoneyMultiplier());
        document.getElementById('moonRocket').addEventListener('click', () => {
            // If already unlocked, just travel there
            if (this.game.currentWorld === 'earth' && this.moonUnlocked) {
                this.game.currentWorld = 'moon';
                document.getElementById('world').textContent = 'World: Moon';
                this.updateButtonStates();
                this.saveShopState();
            } else if (this.game.currentWorld === 'moon' && this.jupiterUnlocked) {
                this.game.currentWorld = 'jupiter';
                document.getElementById('world').textContent = 'World: Jupiter';
                this.updateButtonStates();
                this.saveShopState();
            } else if (this.game.currentWorld === 'jupiter' && this.sunUnlocked) {
                this.game.currentWorld = 'sun';
                document.getElementById('world').textContent = 'World: Sun';
                this.updateButtonStates();
                this.saveShopState();
                this.game.setupSunWorld();
            } else if (this.game.currentWorld === 'jupiter') {
                this.buySun();
            } else if (this.game.currentWorld === 'moon') {
                this.buyJupiter();
            } else {
                this.buyRocket();
            }
        });
    }

    buySun() {
        if (this.game.money >= this.sunCost && !this.sunUnlocked) {
            this.game.money -= this.sunCost;
            this.sunUnlocked = true;
            this.game.sunUnlocked = true;
            this.game.currentWorld = 'sun';
            this.maxUpgrades = 100;
            document.getElementById('world').textContent = 'World: Sun';
            this.updateButtonStates();
            this.updateMoney();
            this.saveShopState();

            // Reset trees so they don't appear until boss is defeated
            this.game.trees = [];
            this.game.setupSunWorld();
        }
    }

    buyJupiter() {
        if (this.game.money >= this.jupiterCost && !this.jupiterUnlocked) {
            this.game.money -= this.jupiterCost;
            this.jupiterUnlocked = true;
            this.game.currentWorld = 'jupiter';
            this.maxUpgrades = 50;
            document.getElementById('world').textContent = 'World: Jupiter';
            this.updateButtonStates();
            this.updateMoney();
            this.saveShopState();
        }
    }

    buyRocket() {
        if (this.game.money >= this.rocketCost && !this.moonUnlocked) {
            this.game.money -= this.rocketCost;
            this.moonUnlocked = true;
            this.game.moonUnlocked = true;
            this.game.currentWorld = 'moon';
            this.maxUpgrades = 30;
            document.getElementById('world').textContent = 'World: Moon';
            this.updateButtonStates();
            this.updateMoney();
            this.saveShopState();
        }
    }

    upgradeSkill() {
        if (this.game.money >= this.skillUpgradeCost && this.skillUpgradeCount < this.maxUpgrades) {
            this.game.money -= this.skillUpgradeCost;
            this.game.skillLevel++;
            this.skillUpgradeCount++;
            this.skillUpgradeCost = Math.floor(this.skillUpgradeCost * 1.5);
            this.updateButtonStates();
            this.updateMoney();
            document.getElementById('moneyPerSecondAmount').textContent = this.game.skillLevel;
            this.saveShopState();
        }
    }

    upgradeMoneyMultiplier() {
        if (this.game.money >= this.moneyUpgradeCost && this.moneyUpgradeCount < this.maxUpgrades) {
            this.game.money -= this.moneyUpgradeCost;
            this.game.moneyMultiplier *= 2.0;
            this.moneyUpgradeCount++;
            this.moneyUpgradeCost = Math.floor(this.moneyUpgradeCost * 1.5);
            this.updateButtonStates();
            this.updateMoney();
            this.saveShopState();
        }
    }

    saveShopState() {
        // Add used codes to the saved state
        const usedCodes = {};
        Object.keys(this.validCodes).forEach(code => {
            usedCodes[code] = this.validCodes[code].used;
        });

        const updatedState = {
            money: this.game.money,
            skillLevel: this.game.skillLevel,
            moneyMultiplier: this.game.moneyMultiplier,
            moonUnlocked: this.moonUnlocked,
            jupiterUnlocked: this.jupiterUnlocked,
            sunUnlocked: this.sunUnlocked,
            currentWorld: this.game.currentWorld,
            boss: this.game.boss,
            shopUpgrades: {
                skill: { purchased: true, level: this.skillUpgradeCount },
                multiplier: { purchased: true, level: this.moneyUpgradeCount },
                moon: { purchased: this.moonUnlocked },
                jupiter: { purchased: this.jupiterUnlocked },
                sun: { purchased: this.sunUnlocked }
            },
            usedCodes: usedCodes
        };

        localStorage.setItem('gameState', JSON.stringify(updatedState));
        console.log("Shop state saved:", updatedState);
    }

    redeemCode(code) {
        if (this.validCodes[code] && !this.validCodes[code].used) {
            this.game.money += this.validCodes[code].reward;
            this.validCodes[code].used = true;
            this.updateMoney();
            this.saveShopState();
            alert(`Success! You got $${this.validCodes[code].reward}!`);
        } else if (this.validCodes[code] && this.validCodes[code].used) {
            alert('This code has already been used!');
        } else {
            alert('Invalid code!');
        }
    }

    updateButtonStates() {
        const skillBtn = document.getElementById('skillUpgrade');
        const moneyBtn = document.getElementById('moneyUpgrade');
        const rocketBtn = document.getElementById('moonRocket');

        // Update skill and money upgrade buttons
        skillBtn.textContent = this.skillUpgradeCount >= this.maxUpgrades ?
            'Max Skill Level Reached!' :
            `Upgrade Skill ($${this.skillUpgradeCost})`;
        skillBtn.disabled = this.skillUpgradeCount >= this.maxUpgrades;

        moneyBtn.textContent = this.moneyUpgradeCount >= this.maxUpgrades ?
            'Max Money Level Reached!' :
            `Upgrade Money Multiplier ($${this.moneyUpgradeCost})`;
        moneyBtn.disabled = this.moneyUpgradeCount >= this.maxUpgrades;

        // Update rocket/travel button based on current world and unlocked status
        if (this.game.currentWorld === 'earth') {
            if (this.moonUnlocked) {
                rocketBtn.textContent = 'Travel to Moon';
            } else {
                rocketBtn.textContent = `Buy Rocket to Moon ($${this.rocketCost})`;
            }
            rocketBtn.disabled = false;
        } else if (this.game.currentWorld === 'moon') {
            if (this.jupiterUnlocked) {
                rocketBtn.textContent = 'Travel to Jupiter';
            } else {
                rocketBtn.textContent = `Buy Ticket to Jupiter ($${this.jupiterCost})`;
            }
            rocketBtn.disabled = false;
        } else if (this.game.currentWorld === 'jupiter') {
            if (this.sunUnlocked) {
                rocketBtn.textContent = 'Travel to Sun';
            } else {
                rocketBtn.textContent = `Buy Ticket to Sun ($${this.sunCost})`;
            }
            rocketBtn.disabled = false;
        } else if (this.game.currentWorld === 'sun') {
            rocketBtn.textContent = 'Already on Sun';
            rocketBtn.disabled = true;
        }

        // Update the world display
        if (this.game && this.game.currentWorld) {
            const worldName = this.game.currentWorld.charAt(0).toUpperCase() + this.game.currentWorld.slice(1);
            document.getElementById('world').textContent = `World: ${worldName}`;
        }
    }

    updateMoney() {
        document.getElementById('moneyAmount').textContent = Math.floor(this.game.money);
    }
}
