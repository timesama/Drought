/*
    In this class:

    General graphics:
        Loads all the Assets : all the png's that exist with right key words
        Creates the background - takes the key word from Level Manager

        Animation - leave it for now, doesn't matter

        Buttons - design
        Boom and Score texts
        Rectangle for the last pipe

    Listener: OnTimerEnd
        Draws water
        Creates banner
        Creates button

*/

import { scaleFactor,LEFT_UP_CORNER, FIRST_PIPE_X, FIRST_PIPE_Y, ONE_STEP, LEFT_DOWN_CORNER, CENTER,
    RED, BLACK, BLUE, TRANSPARENT, GREEN, WHITE, BLUEish, GREENish, YELLOW,
    HORIZ_CELLS_COUNT,  VERT_CELLS_COUNT,
    convertCellXYToPixelXY, ENEMY,
    RIGHT_DOWN_CORNER, RIGHT_UP_CORNER} from '././Constants.js';

const frameWidth = 32
const frameHeight = 32

export default class Graphics {
    constructor(scene) {
        this.scene = scene;

        this.installator = null
        this.isMoving = false

        this.pipes = Array.from({ length: HORIZ_CELLS_COUNT }, () => new Array(VERT_CELLS_COUNT).fill(0));
        this.pipeQueue = [];
        this.pipeQueue2 = [];
        this.FontSize = Math.max(50 * scaleFactor);

        this.pipePointer1 = 0;
        this.pipePointer2 = 1;
    }

    loadAssets()
    {
        // background and patterns
        this.scene.load.image('background1', 'assets/Background1.png');
        this.scene.load.image('background2', 'assets/Background2.png');
        this.scene.load.image('background3', 'assets/Background3.png');
        this.scene.load.image('background4', 'assets/Background4.png');
        this.scene.load.image('background5', 'assets/Background5.png');
        this.scene.load.image('background6', 'assets/Background6.png');
        this.scene.load.image('pattern', 'assets/Pattern.png')
        this.scene.load.image('bp_slot', 'assets/Backpack_slot.png');
        this.scene.load.image('queue_slot', 'assets/Queue_slot.png');
        this.scene.load.image('logo', 'assets/Logo.png');

        //Pause, sound
        this.scene.load.image('pause', 'assets/Question.png');
        this.scene.load.image('book', 'assets/Book.png');
        this.scene.load.image('arrow', 'assets/Arrow.png');
        this.scene.load.image('music', 'assets/Music.png');

        //Controls
        this.scene.load.image('KeyDo', 'assets/KeyDo.png');
        this.scene.load.image('KeyL', 'assets/KeyL.png');
        this.scene.load.image('KeyR', 'assets/KeyR.png');
        this.scene.load.image('KeyU', 'assets/KeyUp.png');
        this.scene.load.image('KeyEnter', 'assets/KeyEnter.png');
        this.scene.load.image('KeySpace', 'assets/KeySpace.png');
        this.scene.load.image('KeyD', 'assets/KeyD.png');
        this.scene.load.image('KeyS', 'assets/KeyS.png');
        this.scene.load.image('KeyA', 'assets/KeyA.png');
        this.scene.load.image('KeyW', 'assets/KeyW.png');
        this.scene.load.image('KeyEnd', 'assets/KeyEnd.png');
        this.scene.load.image('KeyPlace', 'assets/KeyPlace.png');
        this.scene.load.image('KeyThrow', 'assets/KeyThrow.png');
        this.scene.load.image('Mouse', 'assets/Mouse.png');

        // pipes
        this.scene.load.image('cross', 'assets/Pipe_cross.png');
        this.scene.load.image('curv', 'assets/Pipe_deg.png');
        this.scene.load.image('line', 'assets/Pipe.png');
        this.scene.load.image('triple', 'assets/Pipe_triple.png');
        this.scene.load.image('tile1', 'assets/Tile_City.png');
        this.scene.load.image('tile2', 'assets/Tile_Marble.png');
        this.scene.load.image('tile3', 'assets/Tile_Ground.png');
        this.scene.load.image('tile4', 'assets/Tile_Sand.png');
        this.scene.load.image('tile5', 'assets/Tile_Grass.png');
        this.scene.load.image('tile6', 'assets/Tile_Sky.png');
        this.scene.load.image('source', 'assets/Source.png');
        this.scene.load.image('sink', 'assets/Sink_1lvl.png');
        this.scene.load.image('shlulit', 'assets/Shlulit.png');
        this.scene.load.image('block', 'assets/Block.png');

        //items
        this.scene.load.image('tool_clock', 'assets/Item_sand_clock.png');
        this.scene.load.image('tool_screw', 'assets/Item_screw.png');
        this.scene.load.image('tool_shield', 'assets/Item_shield.png')

        //Enemy part
        this.scene.load.image('enemy', 'assets/Enemy.png');
        this.scene.load.image('enemy_place', 'assets/Enemy_sewers.png')
        this.scene.load.image('enemy_shield', 'assets/Enemy_shield.png')
    }

    createBackground() {
        const { width, height } = this.scene.scale
        const middle_width = ONE_STEP*5 + FIRST_PIPE_X

        this.scene.add
        .tileSprite(100, 100, width*2, height*2, 'pattern')
        .setScrollFactor(0.1, 0.1);

        const currentLevel = this.scene.levelManager.getLevel()

        const currentLevelData = this.scene.levelManager.levelData[currentLevel-1]
        const currentLevelEnemy = currentLevelData.enemy

        this.currentBackground?.destroy()
    
        this.currentBackground = this.scene.add
            .image(middle_width, LEFT_UP_CORNER.y-60*scaleFactor, currentLevelData.background)
            .setScrollFactor(1, 0)
            .setScale(scaleFactor)

        this.createGrid(currentLevelData, WHITE)

        if (currentLevelEnemy){
        this.door = this.scene.add.image(ENEMY.x, ENEMY.y, 'enemy_shield')
            .setScrollFactor(1, 0)
            .setDepth(90)
            .setScale(scaleFactor)
        }
    }

    createGrid(currentLevelData, color){
        for (let x = 0; x < HORIZ_CELLS_COUNT; x++)
            for (let y = 0; y < VERT_CELLS_COUNT; y++)
                this.createPipe(x, y, currentLevelData.tiletype, 0).setTint(color);

            for (let x = 0; x < HORIZ_CELLS_COUNT; x++) {
                const colLabel = this.scene.add.text(
                    FIRST_PIPE_X + x*ONE_STEP,
                    FIRST_PIPE_Y - ONE_STEP/1.5,
                    (x + 1).toString(),
                    {
                        font: `${this.FontSize*0.5}px PixelFont`,
                        fill: '#ffffff'
                    }
                );
                colLabel.setOrigin(0.5);
            }

            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let y = 0; y < VERT_CELLS_COUNT; y++) {
                const rowLabel = this.scene.add.text(
                    FIRST_PIPE_X + (HORIZ_CELLS_COUNT-1) * ONE_STEP + ONE_STEP*0.7 ,
                    FIRST_PIPE_Y + y * ONE_STEP,
                    letters[y],
                    {
                        font: `${this.FontSize*0.5}px PixelFont`,
                        fill: '#ffffff'
                    }
                );
                rowLabel.setOrigin(0.5);
            }
    }

    createQSlots(player){

        const yOffset = player === 'player1' ? LEFT_DOWN_CORNER.y : LEFT_DOWN_CORNER.y + 100*scaleFactor;
        const color = player === 'player1' ? BLUEish : GREENish;
        for (let i = 0; i < 3; i++) {
            const offScreenX = LEFT_DOWN_CORNER.x + (i * ONE_STEP);
            this.scene.add.image(offScreenX, yOffset, 'queue_slot')
            .setScale(0.45*scaleFactor)
            .setDepth(10)
            .setTint(color)
        }

        const offScreenX = LEFT_DOWN_CORNER.x + (3 * ONE_STEP);
        this.scene.add.image(offScreenX, yOffset, 'queue_slot')
        .setScale(0.45*scaleFactor)
        .setDepth(10)
        .setTint(WHITE)

        const role = this.scene.registry.get('role')
        const curplayer = role === 'master' ? 'player1' : 'player2'
        const curcolor = curplayer === 'player1' ? BLUEish : GREENish;
        if (this.scene.multiPlayerState && curplayer === player){
            this.scene.add.image(LEFT_DOWN_CORNER.x + (4 * ONE_STEP), yOffset,'arrow')
            .setDepth(100)
            .setScale(0.4*scaleFactor)
            .setAngle(180)
            .setTint(curcolor)
        }
    }

    createBPSlots() {
        const  y = LEFT_DOWN_CORNER.y
        const purchasedItems = this.scene.registry.get('purchasedItems') || {};

        for (let i = 0; i<3; i++){
            const varvar = this.scene.children.getByName(`bp_slot_${i}`)

            varvar?.destroy()
        }

        const tools = [
            { key: 'tool_clock' },
            { key: 'tool_screw'},
            { key: 'tool_shield'},
        ];

        tools.forEach((tool, index) => {

            let color = 0xffffff
            const amount = purchasedItems[tool.key]

            const offScreenX = RIGHT_DOWN_CORNER.x - 3*ONE_STEP + index * ONE_STEP

            const slot = this.scene.add.image(0, 0, 'bp_slot')
            .setScale(0.45*scaleFactor)
            .setDepth(14)
            .setOrigin(0.5)
            .setTint(color);

            const item = this.scene.add.image(0, 0, tool.key)
            .setScale(0.3*scaleFactor)
            .setDepth(15)
            .setOrigin(0.5)
            .setTint(color);

            const bg = this.scene.add.graphics();
            bg.fillStyle(BLACK, 0.3);
            bg.fillRoundedRect(0-60*scaleFactor/2, 0-40*scaleFactor/2, 60*scaleFactor, 40*scaleFactor, 6*scaleFactor);


            const textAmount = this.scene.add.text(0, 0, `x${amount}`, {
                font:  `${Math.round(this.FontSize)}px PixelFont`,
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5).setDepth(16).setName(`bp_slot_text_${index}`)


            // combine slot fig + tool fig + amount
            this.scene.add.container(offScreenX, y, [slot, item, bg, textAmount])
                .setSize(36, 36) // TODO
                .setInteractive()
                .setName(`bp_slot_${index}`)
                .setDepth(15)


            this.scene.add.text(offScreenX, y + 60*scaleFactor, `${index+1}`, {
                font:  `${Math.round(this.FontSize)}px PixelFont`,
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5)
            .setDepth(16)
        });
    }

    highlightBPCell(number) {
        number = number - 1;
        const slotContainer = this.scene.children.getByName(`bp_slot_${number}`);

        if (!slotContainer) {
            console.warn(`Slot with index ${number} not found.`);
            return;
        }

        // Apply tint to all images in the container
        slotContainer.list.forEach(child => {
            if (child.type === 'Image') {
                child.setDepth(20)
                child.setTint(GREEN)

                this.scene.tweens.add({
                    targets: child,
                    duration: 200,
                    ease: 'Power2',
                    onDuration: () => {
                    },
                    onComplete: () => {
                        child.clearTint();
                        this.createBPSlots()
                    }
                });
            }
        });
    }

    createButton(x, y, width, height, text, onClickCallback) {
        const buttonWidth = width;
        const buttonHeight = height;
        const buttonX = x;
        const buttonY = y;

        const buttonContainer = this.scene.add.container(buttonX, buttonY);

        const button = this.scene.add.graphics();
        button.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5*scaleFactor); // Rounded button
        button.lineStyle(5, WHITE); // White border
        button.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5*scaleFactor); // White border around button

        // Make the button interactive
        const buttonText = this.scene.add.text(buttonX+buttonWidth/2, buttonY+buttonHeight/2, text, {
            font:  `${Math.round(this.FontSize)}px PixelFont`,
            fill: '#ffffff',
            align: 'center'
        });
        buttonText.setOrigin(0.5, 0.5);

        const hitArea = new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight);
                    button.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        button.on('pointerdown', onClickCallback)
        buttonContainer.add(button);
        buttonContainer.add(buttonText);

        buttonContainer.setSize(buttonWidth, buttonHeight);

        buttonContainer.setDepth(98);

    return buttonContainer;
    }

    drawWaterPathDuring() {
        if (this.scene.path === undefined || this.scene.path === null) return;

        if (!this.scene.pathGraphicsArray) {
            this.scene.pathGraphicsArray = [];
        }

        let color 
        if (this.scene.stateInfiniteLoop){
            color = RED
        } else {
            color = YELLOW
        }

        const drawSinglePath = (pathArray) => {
            const pathGraphics = this.scene.add.graphics();

            pathGraphics.lineStyle(2, color).setDepth(2);

            let currentIndex = 0;
            const totalPoints = pathArray.length;

            if (totalPoints > 0) {
                const [startX, startY] = pathArray[0];
                let screenX = FIRST_PIPE_X + (startX * ONE_STEP);
                let screenY = FIRST_PIPE_Y + (startY * ONE_STEP);

                pathGraphics.beginPath();
                pathGraphics.moveTo(screenX, screenY);


                while (currentIndex < totalPoints-1) {
                    const [nextX, nextY] = pathArray[currentIndex];
                    let nextScreenX = FIRST_PIPE_X + (nextX * ONE_STEP);
                    let nextScreenY = FIRST_PIPE_Y + (nextY * ONE_STEP);

                    pathGraphics.lineTo(nextScreenX, nextScreenY);
                    currentIndex++;
                }

                pathGraphics.strokePath();
            }

            this.scene.pathGraphicsArray.push(pathGraphics);
        };

        this.scene.pathGraphicsArray.forEach(graphic => {
            graphic.clear();
            graphic.destroy();
        });
        this.scene.pathGraphicsArray = [];

        let delayOffset = 0;
        for (const sourceKey in this.scene.path) {
            if (Object.hasOwn(this.scene.path, sourceKey)) {
                let pathArray = this.scene.path[sourceKey];
                // console.log('Will i draw the green line till the end', this.scene.pathConnected)

                if (this.scene.pathConnected) {
                    const currentLevel = this.scene.levelManager.getLevel();
                    const currentLevelData = this.scene.levelManager.levelData[currentLevel - 1];
                    const { sinkCoords } = currentLevelData;
                    pathArray.push([sinkCoords.x, sinkCoords.y]);
                    color = GREEN
                }

                drawSinglePath(pathArray);
                delayOffset += pathArray.length * 50;
            }
        }
    }

    drawWaterPath() {
        if (!this.scene.path) return;
    
        const drawSinglePath = (pathArray, lineColor, onComplete) => {
            let currentIndex = 0;
    
            const drawStep = () => {
                if (currentIndex >= pathArray.length) {
                    if (!this.scene.lvlWon) {
                        const [endX, endY] = pathArray[pathArray.length - 1];
                        this.drawShlulit(endX, endY, lineColor);
                    }
                    if (onComplete) onComplete();
                    return;
                }
    
                const [startX, startY] = pathArray[currentIndex];
                const screenX = FIRST_PIPE_X + (startX * ONE_STEP);
                const screenY = FIRST_PIPE_Y + (startY * ONE_STEP);
    
                if (currentIndex === 0) {
                    this.scene.graphics.lineStyle(14, lineColor).setDepth(4);
                    this.scene.graphics.beginPath();
                    this.scene.graphics.moveTo(screenX, screenY);
                } else {
                    this.scene.graphics.lineTo(screenX, screenY);
                }
    
                currentIndex++;
                this.scene.graphics.strokePath();
                this.scene.time.delayedCall(50, drawStep, [], this);
            };
    
            drawStep();
        };
    
        const pathKeys = Object.keys(this.scene.path);
    
        const drawNextPath = (index) => {
            if (index >= pathKeys.length) return;
    
            const sourceKey = pathKeys[index];
            const isHotSource = this.scene.Temperature.sourceCoordinates[sourceKey][2];
            let pathArray = this.scene.path[sourceKey];
    
            if (this.scene.lvlWon) {
                const currentLevel = this.scene.levelManager.getLevel();
                const currentLevelData = this.scene.levelManager.levelData[currentLevel - 1];
                const { sinkCoords } = currentLevelData;
    
                pathArray = [...pathArray, [sinkCoords.x, sinkCoords.y]];
            }
    
            const lineColor = isHotSource ? RED : BLUE;
    
            drawSinglePath(pathArray, lineColor, () => drawNextPath(index + 1));
        };
    
        drawNextPath(0);
    }
    
    drawShlulit(x,y, color){
        const [px, py] = convertCellXYToPixelXY(x,y) 
        const shlulit = this.scene.add.image(px, py, 'shlulit')
        .setScale(0)
        .setTint(color)
        .setDepth(80)

        this.scene.tweens.add({
            targets: shlulit,
            scale: 6*scaleFactor,
            ease: 'Back.out',
            duration: 400,
        });
    }

    drawScore(score)
    {
        this.scene.score_plate?.destroy()

        this.scene.score_plate = this.scene.add.text(
            ENEMY.x,
            FIRST_PIPE_Y + 2*ONE_STEP,
            'Score:\n' + score,
            { font:  `${Math.round(this.FontSize)}px PixelFont`, fill: '#ffffff', align: "center" }
        ).setOrigin(0.5);
    }

    drawBoom(booms) {
        const currentLevel = this.scene.levelManager.getLevel();
        const currentLevelEnemy = this.scene.levelManager.levelData[currentLevel - 1].enemy;
    
        // Clear existing text and timer if they exist
        if (this.scene.boom_plate) {
            this.scene.boom_plate.destroy();
            this.scene.boomBlinkTimer?.remove(); // Stop blinking if it was active
        }
    
        if (currentLevelEnemy) {
            const color = (booms === 9) ? '#ff0000' : '#ffffff';
    
            this.scene.boom_plate = this.scene.add.text(
                ENEMY.x,
                ENEMY.y - 1.5 * ONE_STEP,
                booms + '/10',
                {
                    font: `${Math.round(this.FontSize)}px PixelFont`,
                    fill: color,
                    align: "center"
                }
            ).setOrigin(0.5);
    
            // Start blinking if booms == 9
            if (booms === 9) {
                let isRed = true;
                this.scene.boomBlinkTimer = this.scene.time.addEvent({
                    delay: 300, // ms
                    loop: true,
                    callback: () => {
                        if (this.scene.boom_plate) {
                            this.scene.boom_plate.setFill(isRed ? '#ffffff' : '#ff0000');
                            isRed = !isRed;
                        }
                    }
                });
            }
        }
    }

    drawPercentage()
    {
        this.scene.percentage_plate?.destroy()
        const currentLevel = this.scene.levelManager.getLevel()
        const currentLevelData = this.scene.levelManager.levelData[currentLevel-1]
        this.scene.percentage_plate = this.scene.add.text(
            ENEMY.x,
            FIRST_PIPE_Y + 3*ONE_STEP,
            'Target:\n'+ currentLevelData.percentage_hot+'% hot',
            { font:  `${Math.round(this.FontSize)}px PixelFont`, fill: '#ffffff', align: "center" }
        ).setOrigin(0.5);
    }

    drawPercentageNow(percentage)
    {
        // console.log('current percentage', percentage)
        this.scene.percentage_plateNow?.destroy()
        let color

        const currentLevel = this.scene.levelManager.getLevel()
        const currentLevelData = this.scene.levelManager.levelData[currentLevel-1]

        if (percentage === currentLevelData.percentage_hot){
            // console.log('True percentage')
            color = '#50C878'
        } else {color = '#EE4B2B'}

        this.scene.percentage_plateNow = this.scene.add.text(
            ENEMY.x,
            FIRST_PIPE_Y + 4*ONE_STEP,
            'Current\n'+ percentage+'% hot',
            { font:  `${Math.round(this.FontSize)}px PixelFont`, fill: color, align: "center" }
        ).setOrigin(0.5);
    }

    // Create Objects: Pipes, Sink and Source, Tiles
    getRandomInt(max) {
        const int = Math.floor(Math.random() * max)
        return int
    }

    getRandomPipe = (currentLevel) => {
        let pipeType = "";
        let pipeAngle = 0;
        const pipeOptions = this.scene.levelManager.levelData[currentLevel-1].pipesAvailable

        const randomPipeIndex = this.getRandomInt(pipeOptions.length);
        pipeType = pipeOptions[randomPipeIndex];

        if (pipeType === "curv" || pipeType === "triple") {
            pipeAngle = this.getRandomInt(4) * 90; // 0, 90, 180, 270
        } else if (pipeType === "cross" || pipeType === "line") {
            pipeAngle = this.getRandomInt(2) * 90; // 0, 90
        }
        return [pipeType, pipeAngle];
    };

    createPipe(x, y, type, angle, color = null, depth = null) {
        const [pixelX, pixelY] = convertCellXYToPixelXY(x, y);
        const pipe = this.scene.add.image(pixelX, pixelY, type).setScale(scaleFactor).setAngle(angle);

        if (color) {
            pipe.setTint(color);
        }

        if (depth) {
            pipe.setDepth(depth);
        }

        return pipe;
    }

    generatePipePool(count = 564) {
        const currentLevel = this.scene.level;
        
        for (let i = 0; i < count; i++) {
            const [pipeType, pipeAngle] = this.getRandomPipe(currentLevel);
            this.scene.generatedPipes.push({ type: pipeType, angle: pipeAngle });
        }

        // console.log(this.scene.generatedPipes)

        return this.scene.generatedPipes
    }

    createPipeQueue(player) {
        const pipesToCreate = 4;
        const yOffset = player === 'player1' ? LEFT_DOWN_CORNER.y : LEFT_DOWN_CORNER.y + 100 * scaleFactor;
    
        for (let i = 0; i < pipesToCreate; i++) {
            const pipeData = this.scene.generatedPipes.shift(); // take the first pipe from the pool
            if (!pipeData) break; // safety check if pool is empty
    
            const { type: pipeType, angle: pipeAngle } = pipeData;
            const offScreenX = LEFT_DOWN_CORNER.x + (i * ONE_STEP);
            const pipeSprite = this.scene.add.image(offScreenX, yOffset, pipeType)
                .setScale(0.6 * scaleFactor)
                .setAngle(pipeAngle)
                .setDepth(50);
    
            const pipeInfo = { sprite: pipeSprite, type: pipeType, angle: pipeAngle };
    
            if (player === 'player1') {
                this.pipeQueue.push(pipeInfo);
            } else {
                this.pipeQueue2.push(pipeInfo);
            }
        }
    
        this.scene.registry.set(`${player}PipeQueue`, player === 'player1' ? this.pipeQueue : this.pipeQueue2);
    }

    updatePipeQueue(player) {
        const playerQueueKey = player === 'player1' ? 'player1PipeQueue' : 'player2PipeQueue';
        const pipeQueue = player === 'player1' ? this.pipeQueue : this.pipeQueue2;

        // console.log('using', pipeQueue, `for ${player}`)
        const offsetY = player === 'player1' ? 0 : 100*scaleFactor;

        const removedPipe = pipeQueue.pop();
        removedPipe.sprite.destroy();

        let pointer;
        if (player === 'player1') {
            pointer = this.pipePointer1;
            this.pipePointer1 += 2;
        } else {
            pointer = this.pipePointer2;
            this.pipePointer2 += 2;
        }

        const nextPipeData = this.scene.generatedPipes[pointer];

        const newPipe = this.scene.add.image(LEFT_DOWN_CORNER.x, LEFT_DOWN_CORNER.y + offsetY, nextPipeData.type)
            .setScale(0.6 * scaleFactor)
            .setAngle(nextPipeData.angle).setDepth(50);

        // console.log(`the new pipe in queue is`, nextPipeData.type, `for ${player}`)

        pipeQueue.unshift({ sprite: newPipe, type: nextPipeData.type, angle: nextPipeData.angle });

        pipeQueue.forEach((pipeObj, index) => {
            const targetX = LEFT_DOWN_CORNER.x + (index * ONE_STEP);
            this.scene.tweens.add({
                targets: pipeObj.sprite,
                x: targetX,
                duration: 100,
                ease: 'Power2',
            });
        });

        this.scene.registry.set(playerQueueKey, pipeQueue);
    }

    createSourceAndSink() {
        const level = this.scene.levelManager.level - 1;
        const levelData = this.scene.levelManager.levelData[level];
    
        const {
            sourceCoords = [],
            sinkCoords,
            sourceAngle = 0,
            sinkAngle = 0,
            sinktype = 'sink',
        } = levelData;
    
        // source
        if (Array.isArray(sourceCoords)) {
            sourceCoords.forEach((coords) => {
                const sourcePipe = this.createPipe(
                    coords.x,
                    coords.y,
                    'source',
                    coords.angle ?? sourceAngle
                );
                sourcePipe.setDepth(90);
            });
        } else {
            console.warn('No valid sourceCoords found for level:', level + 1);
        }
    
        // sink
        if (sinkCoords) {
            const sinkPipe = this.createPipe(
                sinkCoords.x,
                sinkCoords.y,
                sinktype,
                sinkAngle
            );
            sinkPipe.setDepth(90);
        } else {
            console.warn('No sinkCoords defined for level:', level + 1);
        }
    }
    
    createBlocks() {
        const level = this.scene.levelManager.level - 1;
        const levelData = this.scene.levelManager.levelData[level];
    
        const blockCoords = levelData.blockCoords ?? [];
    
        if (!Array.isArray(blockCoords)) {
            console.warn('blockCoords is missing or not an array');
            return;
        }
    
        blockCoords.forEach((coords) => {
            const block = this.createPipe(
                coords.x,
                coords.y,
                'block',
                coords.angle ?? 0
            );
            block.setDepth(90);
        });
    }

    drawResultsBanner(resultText, action){
        const isPath = this.scene.pathConnected
        const isTemp = this.scene.temperatureRight
        const weight = 500*scaleFactor
        const height = 400*scaleFactor
        const radius = 10*scaleFactor
        const x = weight / 2
        const y = height / 2

        this.banner = this.scene.add.container(CENTER.x-x, CENTER.y-y)

        // background
        const bannerBackground = this.scene.add.graphics()
        bannerBackground.fillStyle(BLACK, 0.5)
        bannerBackground.fillRoundedRect(0, 0, weight, height, radius)

        // text
        const text = this.scene.add.text(x, y*0.3, resultText, {
            font: `${Math.round(this.FontSize)}px PixelFont`,
            fill: '#ffffff',
            align: 'center'
        })
        text.setOrigin(0.5, 0.5)

        this.banner.add(bannerBackground)
        this.banner.add(text)

        // reason
        const colorPipe = isPath === true ? '#50C878' : '#EE4B2B'
        const textPipe = this.scene.add.text(x*0.25, y*0.5, 'Path', {
            font: `${Math.round(this.FontSize)}px PixelFont`,
            fill: colorPipe,
            align: 'center'
        })
        text.setOrigin(0.5, 0.5)

        this.banner.add(textPipe)

        const colorTemperature = isTemp === true ? '#50C878' : '#EE4B2B'
        const textTemperature = this.scene.add.text(x, y*0.5, 'Temperature', {
            font: `${Math.round(this.FontSize)}px PixelFont`,
            fill: colorTemperature,
            align: 'center'
        })
        text.setOrigin(0.5, 0.5)

        this.banner.add(textTemperature)

        this.banner.setScale(0)
        this.scene.tweens.add({
            targets: this.banner,
            scale: 1,
            duration: 1000,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // console.log('creating button')
                this.buttonOK = this.createButton(x/2-100*scaleFactor/2, y/2, 200*scaleFactor, 50*scaleFactor, 'OK', action)
                this.banner.add(this.buttonOK)  
            }
        })
        this.banner.setDepth(98)
    }

    /* Animation part */
    loadSprites(){
        this.scene.load.spritesheet('installator_walks', 'assets/spritesheet/Installator_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('installator2_walks', 'assets/spritesheet/Installator2_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('woman_walks', 'assets/spritesheet/Woman_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('granny_walks', 'assets/spritesheet/Granny_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('installator_idle', 'assets/spritesheet/Installator_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('installator2_idle', 'assets/spritesheet/Installator2_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('woman_idle', 'assets/spritesheet/Woman_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('granny_idle', 'assets/spritesheet/Granny_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('installator_hide', 'assets/spritesheet/Installator_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('installator2_hide', 'assets/spritesheet/Installator2_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('woman_hide', 'assets/spritesheet/Woman_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('granny_hide', 'assets/spritesheet/Granny_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('boy_idle', 'assets/spritesheet/Boy_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('boy_walks', 'assets/spritesheet/Boy_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('boy_hide', 'assets/spritesheet/Boy_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('man_idle', 'assets/spritesheet/Man_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('man_walks', 'assets/spritesheet/Man_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('man_hide', 'assets/spritesheet/Man_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('seller_idle', 'assets/spritesheet/Seller_idle.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('seller_walks', 'assets/spritesheet/Seller_walk.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('seller_hide', 'assets/spritesheet/Seller_hide.png', {
            frameWidth,
            frameHeight
        });
        this.scene.load.spritesheet('boom_explosion', 'assets/spritesheet/Boom.png', {
            frameWidth,
            frameHeight
        });
        //Enemy
        this.scene.load.spritesheet('enemy_death', 'assets/spritesheet/Enemy_death.png', {
            frameWidth,
            frameHeight
        });

    }

    loadAnimations() {
        const animations = [
            {
                key: 'walk',
                spriteSheets: ['installator_walks', 'installator2_walks', 'woman_walks', 'granny_walks', 'boy_walks', 'man_walks', 'seller_walks'],
                start: 0,
                end: 4,
                frameRate: 10,
                repeat: -1
            },
            {
                key: 'idle',
                spriteSheets: ['installator_idle', 'installator2_idle', 'woman_idle', 'granny_idle', 'boy_idle', 'man_idle', 'seller_idle'],
                start: 0,
                end: 1,
                frameRate: 4,
                repeat: -1
            },
            {
                key: 'hide',
                spriteSheets: ['installator_hide', 'installator2_hide', 'woman_hide', 'granny_hide', 'boy_hide', 'man_hide', 'seller_hide'],
                start: 0,
                end: 5,
                frameRate: 10,
                repeat: 0
            },
        ];

        animations.forEach(({ key, spriteSheets, start, end, frameRate, repeat }) => {
            spriteSheets.forEach(spriteSheet => {
                this.scene.anims.create({
                    key: `${key}_${spriteSheet}`,
                    frames: this.scene.anims.generateFrameNumbers(spriteSheet, { start, end }),
                    frameRate,
                    repeat
                });
            });
        });

        this.explosion()
        this.enemyDeath()
    }

    startAnimationCycle(){
        if (this.sprites){
            this.sprites.forEach(sprite => {
                sprite.setVisible(false);
            });
        }
        const characters = [
            { walkKey: 'installator_walks', idleKey: 'installator_idle' },
            { walkKey: 'installator2_walks', idleKey: 'installator2_idle' },
            { walkKey: 'woman_walks', idleKey: 'woman_idle' },
            { walkKey: 'granny_walks', idleKey: 'granny_idle' },
            { walkKey: 'boy_walks', idleKey: 'boy_idle' },
            { walkKey: 'man_walks', idleKey: 'man_idle' },
            { walkKey: 'seller_walks', idleKey: 'seller_idle' }
        ];

        const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const startY = LEFT_UP_CORNER.y-20*scaleFactor;
        this.sprites = characters.map(({ walkKey, idleKey }) => {
            const randomStartX = randomInRange(FIRST_PIPE_X+100*scaleFactor, FIRST_PIPE_X+200*scaleFactor)
            const sprite = this.scene.add.sprite(randomStartX, startY, walkKey).setScale(4*scaleFactor).setDepth(10)
            this.pplWalking(sprite, walkKey, idleKey)
            return sprite
    })
        this.currentBackground.setTint(WHITE)
    }

    pplWalking(sprite, walkKey, idleKey) {
            const randomFromArray = (array) => array[Math.floor(Math.random() * array.length)];
            const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const durations = [4000, 4500, 5000, 5500, 6000];

            const animationKey = `walk_${walkKey}`

            if (this.scene.anims.exists(animationKey)) {
                sprite.play(animationKey);
            } else {
                console.warn(`Animation "${animationKey}" does not exist.`);
            }

            const random_duration = randomFromArray(durations)
            const random_repetition = randomInRange(0, 5)
            this.scene.tweens.add({
                targets: sprite,
                x: RIGHT_UP_CORNER.x-200*scaleFactor,
                duration: random_duration,
                ease: 'Linear',
                repeat: random_repetition,
                yoyo: true,
                onYoyo: () => {
                    sprite.flipX = true;
                },
                onRepeat: () => {
                    sprite.flipX = false;
                },
                onComplete: () => {
                    sprite.flipX = false;
                    this.pplIdle(sprite, walkKey, idleKey);
                }
            });
    }

    pplIdle(sprite, walkKey, idleKey) {
        const randomFromArray = (array) => array[Math.floor(Math.random() * array.length)];
        const durations = [2000, 3000, 4000, 5000, 6000, 7000]
        const random_duration = randomFromArray(durations)
        const animationKey = `idle_${idleKey}`;

        if (this.scene.anims.exists(animationKey)) {
            sprite.play(animationKey);
        } else {
            console.warn(`Animation "${animationKey}" does not exist.`);
        }

        this.scene.tweens.add({
            targets: sprite,
            x: sprite.x,
            duration: random_duration,
            ease: 'Linear',
            repeat: 2,
            onComplete: () => {
                this.pplWalking(sprite, walkKey, idleKey);
            }
        });
    }

    pplHiding(){
        if (this.sprites){
            this.sprites.forEach(sprite => {
                sprite.setVisible(false); // hide
            });
        }

        const characters = [
            { hideKey: 'installator_hide'},
            { hideKey: 'installator2_hide'},
            { hideKey: 'woman_hide'},
            { hideKey: 'granny_hide'},
            { hideKey: 'boy_hide'},
            { hideKey: 'man_hide'},
            { hideKey: 'seller_hide'}

        ];

        const y = LEFT_UP_CORNER.y-20*scaleFactor
        let x = FIRST_PIPE_X+100*scaleFactor

        this.sprites = characters.map(({hideKey}) => {
            const sprite = this.scene.add.sprite(x, y, hideKey).setScale(4*scaleFactor).setDepth(10)
            x += 120*scaleFactor
            const animationKey = `hide_${hideKey}`;

            if (this.scene.anims.exists(animationKey)) {
                sprite.play(animationKey);
            } else {
                console.warn(`Animation "${animationKey}" does not exist.`);
            }

            this.scene.tweens.add({
            targets: sprite,
            x: sprite.x,
            duration: 1000,
            ease: 'Linear',
            repeat: 0,
            // onComplete: () => {
            //     console.log('Ppl fell')
            // }
        });
        return sprite
    })

        this.currentBackground.setTint(RED)
    }

    explosion(){
        this.scene.anims.create({
            key: 'explosion',
            frames: this.scene.anims.generateFrameNumbers('boom_explosion', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: 0
        });
    }

    enemyDeath(){
        this.scene.anims.create({
            key: 'death',
            frames: this.scene.anims.generateFrameNumbers('enemy_death', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: 0
        });
    }

    tutorial(bannerX, bannerY, width, height){
        const step = 50 * scaleFactor
        const x = bannerX - width/3
        const y = bannerY*1.1

        const keyU = this.scene.add.image(x, y,'KeyU').setDepth(99).setScale(3*scaleFactor)
        const keyDo = this.scene.add.image(x, y + step,'KeyDo').setDepth(99).setScale(3*scaleFactor)
        const keyL = this.scene.add.image(x-step, y + step,'KeyL').setDepth(99).setScale(3*scaleFactor)
        const keyR = this.scene.add.image(x+step, y + step,'KeyR').setDepth(99).setScale(3*scaleFactor)

        this.textMove = this.scene.add.text(
            x + 3*step,
            y + step/2,
            'Move',
            {
                font: `${Math.round(this.FontSize)}px PixelFont`,
                fill: "#000000",
                align: "center"
            }
        ).setOrigin(0.5).setDepth(99)

        const keySpace = this.scene.add.image(x, y + 3*step,'KeySpace').setDepth(99).setScale(3*scaleFactor)

        this.textPlace = this.scene.add.text(
            x + 3*step,
            y+ 3*step,
            'Place\nor\nThrow',
            {
                font: `${Math.round(this.FontSize)}px PixelFont`,
                fill: "#000000",
                align: "center"
            }
        ).setOrigin(0.5).setDepth(99)

        const Mouse = this.scene.add.image(x+6*step, y + step/2,'Mouse').setDepth(99).setScale(4*scaleFactor)

        this.textTemperature = this.scene.add.text(
            x + 9*step,
            y + step/2,
            'Change\ntemperature\nClick on\nsource',
            {
                font: `${Math.round(this.FontSize)/1.5}px PixelFont`,
                fill: "#000000",
                align: "center"
            }
        ).setOrigin(0.5).setDepth(99)

        const KeyEnter = this.scene.add.image(x+6*step, y + 3*step,'KeyEnter').setDepth(99).setScale(3*scaleFactor)

        this.textFinish = this.scene.add.text(
            x + 9*step,
            y+ 3*step,
            'End level',
            {
                font: `${Math.round(this.FontSize)}px PixelFont`,
                fill: "#000000",
                align: "center"
            }
        ).setOrigin(0.5).setDepth(99)
    }
}