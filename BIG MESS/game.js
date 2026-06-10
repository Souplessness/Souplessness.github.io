const Phaser = window.Phaser;

const gameState = {
    // General Variables
    worldSizeX: 2500,
    worldSizeY: 2500,
    gridSpaceSize: 50,
    player: null,

    // Debug Variables
    gridDebug: true,
    inventoryDebug: true,
    craftingDebug: true,

    // Toggle Variables
    isInventoryOpen: false,
    isCraftingOpen: false,

    EKeyDown: false,
    CKeyDown: false,

    // Player Stats
    stats: {
        speed: 180,
        inventorySize: 12
    },

    // Inventory
    playerInventory: {
        cursorSlot: null,
        slots: [],
        content: {}
    },

    intermediary: {
        item: 'none',
        amount: 0
    },

    remainder: 0,
    extraRemainder: {},

    // Crafting
    recipes: {
        stone_brick: {cost: {stone: 2}, result: {stone_brick: 1}},
        stone: {cost: {stone_brick: 1}, result: {stone: 2}},
    },

    selectedRecipe: null,
    isCraftable: false,
    craftingSlots: [],

    // Keys
    keys: {},

    // Structures
    structures: {
        miner: {cost: {iron: 10}, speed: 1}
    },

    // Layer Heights
    layers: {
        floor: 1,
        structure: 50,
        player: 99,
        ui: 100,
        ui2: 101 
    }
};

const config = {
    type: Phaser.AUTO,
    parent: 'gameDisplay',
    width: 1500,
    height: 1000,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH // Centers the game in the gameDisplay div
    },

    physics: {
        default: 'arcade', // Physics are required to use velocity
        arcade: {
            gravity: { y: 0 }, // There's no gravity in a top-down game
            debug: false // Shows hitboxes and stuff
        }
    },

    dom: {
        createContainer: true,
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    },

    backgroundColor: 0x000000
};

const game = new Phaser.Game(config);

class GridSpace {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.color = 0xffffff;
        this.xCoord = x / gameState.gridSpaceSize;
        this.yCoord = y / -gameState.gridSpaceSize;

        this.rect = null;
        this.graphics = null;
    }

    draw() {
        // Grid Spaces
        this.rect = this.scene.add.rectangle(this.x, this.y, gameState.gridSpaceSize, gameState.gridSpaceSize, this.color);
        setDepth(this.rect, 'floor');
        this.rect.setInteractive();
        this.rect.on('pointerdown', () => {
            if (gameState.gridDebug) {
                console.log(`GRID DEBUG | ${this.xCoord}, ${this.yCoord}`);
            }
        });
        // Borders
        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(1, 0xcfcfcf);
        this.graphics.strokeRect(this.x - gameState.gridSpaceSize / 2, this.y - gameState.gridSpaceSize / 2, gameState.gridSpaceSize, gameState.gridSpaceSize);
        setDepth(this.graphics, 'floor');
    }
}

class UISlot {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
    }

    setVisible(torf) {
        if (this.rect) {
            this.rect.setVisible(torf);
        }
        if (this.graphics) {
            this.graphics.setVisible(torf);
        }
        if (this.sprite) {
            this.sprite.setVisible(torf);
        }
        if (this.text) {
            this.text.setVisible(torf);
        }
    }
}

class InventorySlot extends UISlot {
    constructor(scene, x, y, slot) {
        super(scene, x, y);
        this.rect = null;
        this.graphics = null;
        this.sprite = null;
        this.text = null;
        this.slot = slot;
        this.item = 'none';
        this.amount = 0;
        this.isFull = false;
    }

    draw() {
        this.rect = this.scene.add.rectangle(this.x, this.y, 50, 50, 0x8c8c8c);
        this.rect.setScrollFactor(0);
        this.rect.setInteractive();
        setDepth(this.rect, 'ui');
        this.rect.on('pointerover', () => {
            this.rect.setFillStyle(0xaaaaaa);
        });
        this.rect.on('pointerout', () => {
            this.rect.setFillStyle(0x8c8c8c);
        });
        this.rect.on('pointerdown', () => {
            if (gameState.inventoryDebug) {
                console.log(`INVENTORY DEBUG | Slot ${this.slot} selected`);
            }
            if (this.item == gameState.playerInventory.cursorSlot.item) {
                if (this.amount + gameState.playerInventory.cursorSlot.amount > 1000) {
                    if (gameState.inventoryDebug) {
                        console.log(`INVENTORY DEBUG | Slot ${this.slot} full, kept ${(this.amount + gameState.playerInventory.cursorSlot.amount) % 1000} in Cursor`);
                    }
                    gameState.playerInventory.cursorSlot.amount = (this.amount + gameState.playerInventory.cursorSlot.amount) % 1000;
                    this.amount = 1000;
                } else {
                    if (gameState.inventoryDebug) {
                        console.log(`INVENTORY DEBUG | ${this.amount} ${this.item} + ${gameState.playerInventory.cursorSlot.amount} ${gameState.playerInventory.cursorSlot.item} = ${this.amount + gameState.playerInventory.cursorSlot.amount} ${this.item}, combined from Cursor into Slot ${this.slot}`);
                    }
                    this.amount += gameState.playerInventory.cursorSlot.amount;
                    gameState.playerInventory.cursorSlot.amount = 0;
                }
            } else {
                if (gameState.inventoryDebug) {
                    console.log(`INVENTORY DEBUG | Before: Cursor - ${gameState.playerInventory.cursorSlot.amount} ${gameState.playerInventory.cursorSlot.item}, Slot ${this.slot} - ${this.amount} ${this.item}`);
                }
                gameState.intermediary.item = this.item;
                gameState.intermediary.amount = this.amount;
                this.item = gameState.playerInventory.cursorSlot.item;
                this.amount = gameState.playerInventory.cursorSlot.amount;
                gameState.playerInventory.cursorSlot.item = gameState.intermediary.item;
                gameState.playerInventory.cursorSlot.amount = gameState.intermediary.amount;
                gameState.intermediary.item = 'none';
                gameState.intermediary.amount = 0;
                if (gameState.inventoryDebug) {
                    console.log(`After: Cursor - ${gameState.playerInventory.cursorSlot.amount} ${gameState.playerInventory.cursorSlot.item}, Slot ${this.slot} - ${this.amount} ${this.item}`);
                }
            }
        });

        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(1, 0x000000);
        this.graphics.strokeRect(this.x - 25, this.y - 25, 50, 50);
        setDepth(this.graphics, 'ui');
        this.graphics.setScrollFactor(0);

        this.sprite = this.scene.add.sprite(this.x, this.y, this.item.toString());
        setDepth(this.sprite, 'ui');
        this.sprite.setScrollFactor(0);
        this.sprite.setVisible(false);

        this.text = this.scene.add.text(this.x, this.y + 35, '', { fontSize: '20px', fill: '#000000', fontFamily: 'Arsenal' });
        setDepth(this.text, 'ui');
        this.text.setScrollFactor(0);
        this.text.setVisible(false);
        this.text.setOrigin(0.5);
    }
}

class CraftingSlot extends UISlot {
    constructor(scene, x, y, recipe) {
        super(scene, x, y);
        this.rect = null;
        this.graphics = null;
        this.sprite = null;
        this.text = null;
        this.recipe = recipe;
    }

    draw() {
        this.rect = this.scene.add.rectangle(this.x, this.y, 50, 50, 0x8c8c8c);
        this.rect.setScrollFactor(0);
        this.rect.setInteractive();
        setDepth(this.rect, 'ui');
        this.rect.on('pointerover', () => {
            this.rect.setFillStyle(0xaaaaaa);
        });
        this.rect.on('pointerout', () => {
            this.rect.setFillStyle(0x8c8c8c);
        });
        this.rect.on('pointerdown', () => {
            if (gameState.craftingDebug) {
                console.log(`CRAFTING DEBUG | ${this.recipe} recipe selected`);
            }
            gameState.selectedRecipe = this.recipe;
            isCraftable();
        });

        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(1, 0x000000);
        this.graphics.strokeRect(this.x - 25, this.y - 25, 50, 50);
        setDepth(this.graphics, 'ui');
        this.graphics.setScrollFactor(0);
        
        this.sprite = this.scene.add.sprite(this.x, this.y, this.recipe.toString());
        setDepth(this.sprite, 'ui');
        this.sprite.setScrollFactor(0);
    }
}

class Structure {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.sprite = null;
    }

    draw() {
        this.sprite = this.type.toString();
        setDepth(this.sprite, 'structure');
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', () => {
            pickUp('stone', 1);
        });
    }
}

function preload() {
    // Player
    this.load.image('player', 'assets/circleWithTriangle.png');

    // Structures
    this.load.image('miner', 'assets/miner.png');

    // Items
    this.load.image('stone', 'assets/stone.png');
} // End of preload

function create() {
    // Player
    gameState.player = this.physics.add.sprite(0, 0, 'player');
    gameState.player.setDepth(gameState.layers.player);

    // Inventory UI
    gameState.inventoryBackground = this.add.rectangle(0, 0, 500, 600, 0xcfcfcf);
    gameState.inventoryBackground.setStrokeStyle(2, 0x000000);
    gameState.inventoryBackground.setDepth(gameState.layers.ui);
    gameState.inventoryBackground.setScrollFactor(0);
    createInventorySlots(this);
    gameState.inventoryText = this.add.text(0, 0, 'Inventory', { fontSize: '25px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.inventoryText.setDepth(gameState.layers.ui);
    gameState.inventoryText.setScrollFactor(0);
    gameState.inventoryWarning = this.add.text(0, 0, 'Inventory Full!', { fontSize: '20px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.inventoryWarning.setDepth(gameState.layers.ui);
    gameState.inventoryWarning.setScrollFactor(0);
    gameState.cursorSprite = this.add.sprite(0, 0);
    gameState.cursorSprite.setDepth(gameState.layers.ui2);
    gameState.cursorSprite.setVisible(false);
    gameState.cursorItemText = this.add.text(0, 35, '', { fontSize: '20px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.cursorItemText.setDepth(gameState.layers.ui2);
    gameState.cursorItemText.setVisible(false);
    gameState.cursorItemText.setOrigin(0.5);

    // Crafting UI
    gameState.craftingBackground = this.add.rectangle(0, 0, 500, 600, 0xcfcfcf);
    gameState.craftingBackground.setStrokeStyle(2, 0x000000);
    gameState.craftingBackground.setDepth(gameState.layers.ui);
    gameState.craftingBackground.setScrollFactor(0);
    createCraftingSlots(this);
    gameState.craftingText = this.add.text(0, 0, 'Crafting', { fontSize: '25px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.craftingText.setDepth(gameState.layers.ui);
    gameState.craftingText.setScrollFactor(0);
    gameState.craftButton = this.add.rectangle(0, 0, 130, 50, 0xffffff);
    gameState.craftButton.setStrokeStyle(2, 0x000000);
    gameState.craftButton.setDepth(gameState.layers.ui);
    gameState.craftButton.setScrollFactor(0);
    gameState.craftButton.setInteractive();
    gameState.craftButtonText = this.add.text(0, 0, 'Craft', { fontSize: '25px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.craftButtonText.setDepth(gameState.layers.ui);
    gameState.craftButtonText.setScrollFactor(0);

    // Other UI
    gameState.playerPosTextX = this.add.text(20, 20, `x: ${gameState.player.x}`, { fontSize: '25px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.playerPosTextX.setDepth(gameState.layers.ui);
    gameState.playerPosTextX.setScrollFactor(0);
    gameState.playerPosTextY = this.add.text(20, 45, `y: ${gameState.player.y}`, { fontSize: '25px', fill: '#000000', fontFamily: 'Arsenal' });
    gameState.playerPosTextY.setDepth(gameState.layers.ui);
    gameState.playerPosTextY.setScrollFactor(0);

    // Keys
    gameState.keys.W = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W); // Up
    gameState.keys.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A); // Left
    gameState.keys.S = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // Down
    gameState.keys.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D); // Right
    gameState.keys.E = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // Inventory
    gameState.keys.R = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // Rotate
    gameState.keys.C = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C); // Crafting
    gameState.keys.B = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B); // Build Mode
    gameState.keys.M = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Map

    // Camera
    this.cameras.main.startFollow(gameState.player, true, 0.5, 0.5);
    this.cameras.main.setBounds(-gameState.worldSizeX / 2 - 25, -gameState.worldSizeY / 2 - 25, gameState.worldSizeX + 50, gameState.worldSizeY + 50);

    // World Border
    this.physics.world.setBounds(-gameState.worldSizeX / 2 - 25, -gameState.worldSizeY / 2 - 25, gameState.worldSizeX + 50, gameState.worldSizeY + 50);
    gameState.player.setCollideWorldBounds(true);

    // Floor Grid
    createGrid(this);
} // End of create

function update() {
    // Cursor
    gameState.pointer = this.input.activePointer;
    gameState.worldX = this.cameras.main.scrollX + gameState.pointer.x; // x position of cursor relative to camera
    gameState.worldY = this.cameras.main.scrollY + gameState.pointer.y; // y position of cursor relative to camera

    // Player Movement
    let velocityX = 0;
    let velocityY = 0;
    
    if (gameState.keys.W.isDown) {
        velocityY = -gameState.stats.speed;
    } else if (gameState.keys.S.isDown) {
        velocityY = gameState.stats.speed;
    }
    
    if (gameState.keys.A.isDown) {
        velocityX = -gameState.stats.speed;
    } else if (gameState.keys.D.isDown) {
        velocityX = gameState.stats.speed;
    }
    
    if (velocityX !== 0 && velocityY !== 0) {
        velocityX /= Math.sqrt(2);
        velocityY /= Math.sqrt(2);
    }
    
    gameState.player.setVelocity(velocityX, velocityY);

    // Key Toggles
    if (gameState.keys.E.isDown && !gameState.EKeyDown) {
        gameState.EKeyDown = true;
        toggle('isInventoryOpen');
        if (gameState.inventoryDebug) {
            console.log(`INVENTORY DEBUG | Inventory open: ${gameState.isInventoryOpen}`);
        }
    } else if (gameState.keys.E.isUp && gameState.EKeyDown) {
        gameState.EKeyDown = false;
    }
    if (gameState.keys.C.isDown && !gameState.CKeyDown) {
        gameState.CKeyDown = true;
        toggle('isCraftingOpen');
        if (gameState.isCraftingOpen) {
            gameState.isInventoryOpen = true;
        }
        if (gameState.craftingDebug) {
            console.log(`CRAFTING DEBUG | Crafting open: ${gameState.isCraftingOpen}`);
        }
        // console.log(`put a thing that tells you how much of everything you have here later`)
    } else if (gameState.keys.C.isUp && gameState.CKeyDown) {
        gameState.CKeyDown = false;
    }

    // Inventory
    if (gameState.isInventoryOpen) {
        gameState.inventoryBackground.setVisible(true);
        gameState.inventoryBackground.setPosition(400, 400);
        gameState.inventoryText.setVisible(true);
        gameState.inventoryText.setPosition(175, 125);
        if (gameState.remainder > 0) {
            gameState.inventoryWarning.setVisible(true);
            gameState.inventoryWarning.setPosition(300, 125);
        }
        gameState.playerInventory.slots.forEach(slot => {
            slot.setVisible(true);
        });
    } else {
        gameState.inventoryBackground.setVisible(false);
        gameState.inventoryText.setVisible(false);
        gameState.inventoryWarning.setVisible(false);
        gameState.playerInventory.slots.forEach(slot => {
            slot.setVisible(false);
        });
    }

    if (gameState.playerInventory.cursorSlot.item != 'none' && gameState.isInventoryOpen) {
        gameState.cursorSprite.setVisible(true);
        gameState.cursorSprite.x = gameState.worldX;
        gameState.cursorSprite.y = gameState.worldY;
        if (this.textures.exists(gameState.playerInventory.cursorSlot.item.toString())) {
            gameState.cursorSprite.setTexture(gameState.playerInventory.cursorSlot.item.toString());
        } else {
            console.warn(`Texture not found for item: ${gameState.playerInventory.cursorSlot.item}`)
        }
        gameState.cursorItemText.setVisible(true);
        gameState.cursorItemText.setText(`x${gameState.playerInventory.cursorSlot.amount}`);
        gameState.cursorItemText.x = gameState.worldX;
        gameState.cursorItemText.y = gameState.worldY + 35;
    } else {
        gameState.cursorSprite.setVisible(false);
        gameState.cursorItemText.setVisible(false);
    }

    gameState.playerInventory.slots.forEach(slot => { 
        if (!slot.amount && slot.item != 'none') {
            if (gameState.inventoryDebug) {
                console.log(`INVENTORY DEBUG | 0 items in Slot ${slot.slot}, setting item to 'none'`);
            }
            slot.item = 'none';
        }
        
        if (slot.item != 'none' && gameState.isInventoryOpen) {
            slot.sprite.setVisible(true);
            if (this.textures.exists(slot.item.toString())) {
                slot.sprite.setTexture(slot.item.toString());
            } else {
                console.warn(`Texture not found for item: ${slot.item}`); // Thank you copilot
            }
        } else {
            slot.sprite.setVisible(false);
        }

        if (slot.amount >= 1000) {
            slot.isFull = true;
        } else {
            slot.isFull = false;
        }

        if (gameState.isInventoryOpen && slot.amount) {
            slot.text.setVisible(true);
            slot.text.setText(`x${slot.amount}`)
        } else {
            slot.text.setVisible(false);
        }
    });

    // Crafting
    if (gameState.isCraftingOpen) {
        gameState.craftingBackground.setVisible(true);
        gameState.craftingBackground.setPosition(1100, 400);
        gameState.craftingText.setVisible(true);
        gameState.craftingText.setPosition(875, 125);
        gameState.craftButton.setVisible(true);
        gameState.craftButton.setPosition(940, 650);
        gameState.craftButtonText.setVisible(true);
        gameState.craftButtonText.setPosition(915, 640);
        gameState.craftingSlots.forEach(slot => {
            slot.setVisible(true);
        });
    } else {
        gameState.craftingBackground.setVisible(false);
        gameState.craftingText.setVisible(false);
        gameState.craftButton.setVisible(false);
        gameState.craftButtonText.setVisible(false);
        gameState.craftingSlots.forEach(slot => {
            slot.setVisible(false);
        });
    }

    gameState.craftingSlots.forEach(slot => {
        if (gameState.selectedRecipe == slot.recipe) {
            slot.graphics.clear();
            slot.graphics.lineStyle(2, 0xffffff);
            slot.graphics.strokeRect(slot.x - 25, slot.y - 25, 50, 50);
        } else {
            slot.graphics.clear();
            slot.graphics.lineStyle(1, 0x000000);
            slot.graphics.strokeRect(slot.x - 25, slot.y - 25, 50, 50);
        }
    });

    if (gameState.isCraftable) {
        if (gameState.craftButton.fillColor == 0x757575) {
            gameState.craftButton.setFillStyle(0x6eeb60);
        }
        gameState.craftButton.on('pointerover', () => {
            gameState.craftButton.setFillStyle(0x44b038);
        });
        gameState.craftButton.on('pointerout', () => {
            gameState.craftButton.setFillStyle(0x6eeb60);
        });
        gameState.craftButton.on('pointerdown', () => {
            if (gameState.craftingDebug) {
                craft();
            }
        });
    } else {
        gameState.craftButton.setFillStyle(0x757575);
    }

    // Player Rotation
    const angle = Phaser.Math.Angle.Between(gameState.player.x, gameState.player.y, gameState.worldX, gameState.worldY);
    gameState.player.rotation = angle + 1.5708; // (1.5708 is 90 degrees in radians, needed for offset)

    // Player position text
    gameState.playerPosTextX.setText(`x: ${Math.floor(gameState.player.x)}`);
    gameState.playerPosTextY.setText(`y: ${Math.floor(gameState.player.y)}`);
} // End of update

// Sets the depth of an object, layers are in gameState object
function setDepth(obj, layer) {
    obj.depth = gameState.layers[layer];
}

// Toggles variables
function toggle(variable) {
    gameState[variable] = !gameState[variable];
}

// Creates the grid at the start of the game
function createGrid(scene) {
    new GridSpace(scene, 0, 0).draw();
    // (x, y)
    for (let x = gameState.gridSpaceSize; x <= gameState.worldSizeX / 2; x += gameState.gridSpaceSize) {
        for (let y = -gameState.gridSpaceSize; y >= -gameState.worldSizeY / 2; y += -gameState.gridSpaceSize) {
            new GridSpace(scene, x, y).draw();
        }
    }
    // (x, -y)
    for (let x = gameState.gridSpaceSize; x <= gameState.worldSizeX / 2; x += gameState.gridSpaceSize) {
        for (let y = gameState.gridSpaceSize; y <= gameState.worldSizeY / 2; y += gameState.gridSpaceSize) {
            new GridSpace(scene, x, y).draw();
        }
    }
    // (-x, y)
    for (let x = -gameState.gridSpaceSize; x >= -gameState.worldSizeX / 2; x += -gameState.gridSpaceSize) {
        for (let y = -gameState.gridSpaceSize; y >= -gameState.worldSizeY / 2; y += -gameState.gridSpaceSize) {
            new GridSpace(scene, x, y).draw();
        }
    }
    // (-x, -y)
    for (let x = -gameState.gridSpaceSize; x >= -gameState.worldSizeX / 2; x += -gameState.gridSpaceSize) {
        for (let y = gameState.gridSpaceSize; y <= gameState.worldSizeY / 2; y += gameState.gridSpaceSize) {
            new GridSpace(scene, x, y).draw();
        }
    }
    // Cardianal Directions
    for (let x = gameState.gridSpaceSize; x <= gameState.worldSizeX / 2; x += gameState.gridSpaceSize) {
        new GridSpace(scene, x, 0).draw();
    }
    for (let y = -gameState.gridSpaceSize; y >= -gameState.worldSizeY / 2; y += -gameState.gridSpaceSize) {
        new GridSpace(scene, 0, y).draw();
    }
    for (let x = -gameState.gridSpaceSize; x >= -gameState.worldSizeX / 2; x += -gameState.gridSpaceSize) {
        new GridSpace(scene, x, 0).draw();
    }
    for (let y = gameState.gridSpaceSize; y <= gameState.worldSizeY / 2; y += gameState.gridSpaceSize) {
        new GridSpace(scene, 0, y).draw();
    }
}

// Spawns ore structures at the start of the game
function spawnOres() {
    
}

// Creates inventory slots at the start of the game
function createInventorySlots(scene) {   
    const startX = 200;
    const startY = 200;
    const slotSpacing = 80;
    const slotsPerRow = 6;
    const totalSlots = gameState.stats.inventorySize;
    gameState.playerInventory.cursorSlot = new InventorySlot(scene, 0, 0, 'Cursor');
    if (gameState.inventoryDebug) {
        console.log(`INVENTORY DEBUG | Slot ${gameState.playerInventory.cursorSlot.slot} initialized`);
    }

    for (let i = 0; i < totalSlots; i++) {
        const row = Math.floor(i / slotsPerRow);
        const col = i % slotsPerRow;
        const x = startX + col * slotSpacing;
        const y = startY + row * slotSpacing;

        const invSlot = new InventorySlot(scene, x, y, i);
        invSlot.draw();
        gameState.playerInventory.slots.push(invSlot);
        if (gameState.inventoryDebug) {
            console.log(`INVENTORY DEBUG | Slot ${gameState.playerInventory.slots[i].slot} initialized`);
        }
    }
}

// Creates crafting recipe ui at the start of the game
function createCraftingSlots(scene) {
    const startX = 900;
    const startY = 200;
    const slotSpacing = 80;
    const slotsPerRow = 6;
    const totalSlots = Object.keys(gameState.recipes).length;
    
    for (let i = 0; i < totalSlots; i++) {
        const row = Math.floor(i / slotsPerRow);
        const col = i % slotsPerRow;
        const x = startX + col * slotSpacing;
        const y = startY + row * slotSpacing;

        const craftingSlot = new CraftingSlot(scene, x, y, Object.keys(gameState.recipes)[i]);
        craftingSlot.draw();
        gameState.craftingSlots.push(craftingSlot);
        if (gameState.craftingDebug) {
            console.log(`CRAFTING DEBUG | ${gameState.craftingSlots[i].recipe} recipe initialized`);
        }
    }
}

// Adds items to inventory
function pickUp(item, amount) {
    gameState.remainder = amount;

    gameState.playerInventory.slots.forEach(slot => {
        if (slot.item == item && !slot.isFull) {
            const maxAddable = Math.min(1000 - slot.amount, gameState.remainder);
            slot.amount += maxAddable;
            gameState.remainder -= maxAddable;
            if (gameState.inventoryDebug) {
                console.log(`INVENTORY DEBUG | Added ${maxAddable} ${item} to Slot ${slot.slot}`);
            }
        }
    });

    gameState.playerInventory.slots.forEach(slot => {
        if (gameState.remainder > 0 && slot.item == 'none') {
            const maxAddable = Math.min(1000, gameState.remainder);
            slot.item = item;
            slot.amount = maxAddable;
            gameState.remainder -= maxAddable;
            if (gameState.inventoryDebug) {
                console.log(`INVENTORY DEBUG | Added ${maxAddable} ${item} to Slot ${slot.slot}`);
            }
        }
    });

    if (gameState.remainder > 0) {
        gameState.extraRemainder[item] = gameState.remainder;
        if (gameState.inventoryDebug) {
            console.log(`INVENTORY DEBUG | Inventory full, unable to add ${gameState.remainder} ${item}`);
            console.log('All items unable to be added to inventory:');
            Object.keys(gameState.extraRemainder).forEach(item => {
                console.log(`| ${gameState.extraRemainder[item]} ${item} |`)
            });
        } // NOTE: implement this somehow later
    }
    invList();
    if (gameState.selectedRecipe) {
        isCraftable();
    }
}

// Removes items from inventory
function dropItem(item, amount) {
    let temp = amount;

    gameState.playerInventory.slots.forEach(slot => {
        if (slot.item == item) {
            slot.amount -= temp;
            invList();
            if (temp <= 0) {
                return;
            }
        }
    });
} 

// Scans whole inventory and makes a list of each item in it and their amounts
function invList() {
    gameState.playerInventory.content = {};
    gameState.playerInventory.slots.forEach(slot => {
        if (slot.item !== 'none') {
            listItem = slot.item;
            if (!gameState.playerInventory.content[listItem]) {
                gameState.playerInventory.content[listItem] = 0;
            }
            gameState.playerInventory.content[listItem] += slot.amount;
        }
    });
    if (gameState.inventoryDebug) {
        console.log(`INVENTORY DEBUG | Full inventory list:`);
        console.log(gameState.playerInventory.content);
    }
}

// Checks if the selected recipe can be crafted with contents of inventory by checking the list
function isCraftable() {
    recipe = gameState.recipes[gameState.selectedRecipe];

    if (Object.keys(recipe.cost).every(item => (gameState.playerInventory.content[item] || 0) >= recipe.cost[item])) {
        gameState.isCraftable = true;
    } else {
        gameState.isCraftable = false;
    }
    
    if (gameState.craftingDebug) {
        console.log(`CRAFTING DEBUG | ${gameState.selectedRecipe} is craftable: ${gameState.isCraftable}`);
    }
}

// Crafts the selected recipe, removing the cost items from the player's inventory and adding the result
function craft() {
    recipe = gameState.recipes[gameState.selectedRecipe];

    if (gameState.isCraftable) {
        Object.keys(recipe.cost).every(cost => {
            dropItem(cost, recipe.cost[cost]);
        });
        Object.keys(recipe.result).every(result => {
            pickUp(result, recipe.result[result]);
        });
    }
}