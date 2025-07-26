import Phaser from '../lib/phaser.js'
import { Timer } from '../modules/timer.js'
import * as Constants from '../modules/Constants.js'
import { LogicConnection } from '../modules/PipeConnectionLogic.js'
import LevelManager from '../modules/LevelManager.js'
import Graphics from '../modules/Graphics.js'
import Temperature from '../modules/Temperature.js'

export default class Game extends Phaser.Scene
{
    screw
    pipes
    path
    block = false
    score
    boom

    constructor()
    {
        super('Game')
        this.Graphics = null
        this.LogicConnection = null

        this.players = {
            player1: {
                curPipe: null,
                curPipeCellX: null,
                curPipeCellY: null,
                pipeQueue: [],
            },
            player2: {
                curPipe: null,
                curPipeCellX: null,
                curPipeCellY: null,
                pipeQueue: [],
            },
        };

        this.resultText = "" // result text init
        this.banner = null   // banner init

        this.levelManager = new LevelManager(this)
        this.Graphics = new Graphics(this)
        this.LogicConnection = new LogicConnection(this)
    }

    preload()
    {
        
        if (!this.registry.has('purchasedItems')) {
            this.registry.set('purchasedItems', {
                tool_clock: 0,
                tool_screw: 0,
                tool_shield: 0
            });
        }

        if (this.registry.get('resetLevel')){
            this.levelManager.resetLevels()
        }
        this.level = this.levelManager.getLevel()
        this.registry.set('resetLevel', false)
        
        this.Graphics.loadAssets()
        this.Graphics.loadSprites()
        this.lvlWon = false
    }

    create()
    {   
        this.debug = false
        // console.log('start of create')
        this.game.events.emit('game-started')
        this.socket = window.socket;
        this.socket.emit('enterGame')

        if (!this.socket) {
            console.error('Socket is not initialized!');
            return;
        }
        
        // Listeners
        this.clearListeners()
        this.addListeners()
        //States
        this.state_tool = 'None'
        this.rect = null
        this.multiPlayerState = this.registry.get('multiplayer'); // Takes from menu
        this.block = false;
        this.resetSpecialKeyPressed()
        this.stateMobile = false
        this.registry.set('stateMobile', this.stateMobile)
        this.enemyState = false
        this.pathConnected = false
        this.temperatureRight = false
        this.stateInfiniteLoop = false

        //Constants init
        this.width = Constants.screenWidth;
        this.FontSize = Math.max(50 * Constants.scaleFactor); // Prevents text from being too small
        this.path = [] // Path is zero
        this.pathMatrix = []
        this.pipes = Array.from({ length: Constants.HORIZ_CELLS_COUNT }, () => new Array(Constants.VERT_CELLS_COUNT).fill(0)) // Pipes matrix with images and stuff

        // console.log(`this level is: ${this.level}`)

        this.boom_counts = 0 // The counts of booms
        this.score = this.registry.get('Score')
        if (!this.score){ // If there are NO scores, create score 0
            this.score = 0
        }
        this.generatedPipes = []
        this.specialKeyPressed = {}

        // Functions
        this.createGraphics()
        this.pauseButton()
        this.calculateSourceSink()
        this.addLevelText()
    

        // Initialize and draw temperature
        this.Temperature = new Temperature(this)
        this.Temperature.draw_circle_initial()

        // Set and get registry
        this.registry.set('Graphics', this.Graphics)
        this.registry.set('pipes', this.pipes)

        // Creating tutorial Grid
        if (this.level == 1 || this.level == 2){
            this.createtutorialGrid(this.level)
        }

        // Launching solo or multiplayer
        if (this.multiPlayerState){
            this.initGameMultiPlayerMode()
        } else {
            this.initGameSoloMode()
        }

        // this.Graphics.tutorial()

        // console.log('end of create')
    }

    createtutorialGrid(level){

        let tutorialPipes

        if (level == 1){
            tutorialPipes = [
                { x: 5, y: 1, type: "curv", angle: 180 },
                { x: 4, y: 1, type: "cross", angle: 90 },
                { x: 3, y: 1, type: "cross", angle: 0 },
                { x: 2, y: 1, type: "curv", angle: 270 },
                { x: 2, y: 0, type: "curv", angle: 0 },
                { x: 3, y: 0, type: "line", angle: 0 },
                { x: 4, y: 0, type: "curv", angle: 90 },
                { x: 4, y: 2, type: "curv", angle: 270 },
            ]      

        } else {
            tutorialPipes = [
                { x: 9, y: 0, type: "curv", angle: 0 },
                { x: 9, y: 1, type: "curv", angle: 180 },
                { x: 8, y: 1, type: "cross", angle: 0 },
                { x: 7, y: 1, type: "triple", angle: 180 },
                { x: 7, y: 0, type: "curv", angle: 0 },
                { x: 8, y: 0, type: "curv", angle: 90 },
                { x: 8, y: 2, type: "curv", angle: 180 },
                { x: 7, y: 2, type: "cross", angle: 0 },
                { x: 6, y: 2, type: "line", angle: 0 },
                { x: 5, y: 2, type: "triple", angle: 0 },
                { x: 5, y: 3, type: "line", angle: 90 },
            ]
        }

        for (const { x, y, type, angle } of tutorialPipes) {
            const pipe = this.Graphics.createPipe(x, y, type, angle, null, 70);
            this.pipes[x][y] = pipe;
            this.registry.set('pipes', this.pipes);
            this.LogicConnection.updatePipeMatrix(x, y, pipe.texture.key, pipe.angle);
        
            this.path = this.LogicConnection.traverse();
            this.Graphics.drawWaterPathDuring();
        }      
    }

    initGameSoloMode(){
        this.block = false
        this.Graphics.startAnimationCycle()
        this.bindKeyBoardKeysSolo()
        this.addTimerText()
        const type = this.Graphics.getRandomPipe(this.level)

        // Initial pipes
        this.curPipeCellX1 = 1         // The initial coordinates are zeros 
        this.curPipeCellY1 = 1        // The initial coordinates are zeros
        this.curPipe1 = this.Graphics.createPipe(this.curPipeCellX1, this.curPipeCellY1, type[0], type[1], Constants.BLUEish, 90)

        //Create background for the pipe
        const [pixelX, pixelY] = Constants.convertCellXYToPixelXY(1, 1);
        this.background = this.add.image(pixelX, pixelY, this.levelManager.levelData[this.level-1].tiletype).setDepth(71).setScale(Constants.scaleFactor).setOrigin(0.5).setAlpha(0.6)
            .setTint(Constants.BLUEish);

        this.generatedPipes = this.Graphics.generatePipePool()
        this.Graphics.createPipeQueue('player1')
        this.Graphics.createQSlots('player1')
        this.Graphics.drawPercentage()
        this.questionButton()

        // Draw current percentage
        const percentageCurrent = this.Temperature.returnCurrentPercentage()
        this.Graphics.drawPercentageNow(percentageCurrent)

        window.rng = new Phaser.Math.RandomDataGenerator([Date.now().toString()]);

        this.blockPlayerSpawn = {
            player1: false
        }
        // console.log('state of block', this.blockPlayerSpawn.player1)
    }

    bindKeyBoardKeysSolo() {
        const controls = { up: 'W', down: 'S', left: 'A', right: 'D', place: 'SPACE' };
    
        const move = dir => () => this.curPipeMove('player1', { type: "direction", direction: dir });
    
        this.input.keyboard.on(`keyup-${controls.up}`, move('up'), this);
        this.input.keyboard.on(`keyup-${controls.down}`, move('down'), this);
        this.input.keyboard.on(`keyup-${controls.left}`, move('left'), this);
        this.input.keyboard.on(`keyup-${controls.right}`, move('right'), this);
        this.input.keyboard.on(`keyup-${controls.place}`, () => this.curPipeSpawn('player1'), this);

        const keyBindings = [
            ['keyup-ENTER', this.onTimerEnd],
            ['keydown-ONE', () => this.useTool(1)],
            ['keydown-TWO', () => this.useTool(2, 'player1')],
            ['keydown-THREE', () => this.useTool(3)],
            ...(this.debug ? [
                ['keydown-FOUR', this.startEnemy],
                ['keydown-FIVE', this.startSeller],
                ['keydown-SIX', this.endGame],
                ['keydown-SEVEN', this.showResultBanner],
            ] : [])
        ];
        
    
        keyBindings.forEach(([key, handler]) => {
            this.input.keyboard.on(key, handler, this);
        });
    }    

    initGameMultiPlayerMode(){
        const role = this.registry.get('role')
        console.log(`role: ${role}`)

        this.socket.off('startRoom')
        this.socket.once('startRoom', (initialData) => { //TODO: ONCE?
            console.log('start room')
            //Get seed:
            window.rng = new Phaser.Math.RandomDataGenerator([initialData.seed]);
            console.log(initialData.seed)
            this.block = false

            this.bindKeyBoardKeysMultiplayer(role)
            this.Graphics.startAnimationCycle()
            this.addTimerText()

            //Initial Pipes
            this.curPipeCellX1 = 1
            this.curPipeCellY1 = 1
            this.curPipeCellX2 = 9
            this.curPipeCellY2 = 1

            let type = initialData.pipeType
            // Create first pipe
            this.curPipe1 = this.Graphics.createPipe(this.curPipeCellX1, this.curPipeCellY1, type[0], type[1], Constants.BLUEish, 90)
            this.curPipe2 = this.Graphics.createPipe(this.curPipeCellX2, this.curPipeCellY2, type[0], type[1], Constants.GREENish, 90)

            //Create background for the pipe
            const [pixelX, pixelY] = Constants.convertCellXYToPixelXY(this.curPipeCellX1, this.curPipeCellY1);
            this.background = this.add.image(pixelX, pixelY, this.levelManager.levelData[this.level-1].tiletype)
                .setDepth(71)
                .setScale(Constants.scaleFactor)
                .setOrigin(0.5)
                .setAlpha(0.9)
                .setTint(Constants.BLUEish);

            const [pixelX2, pixelY2] = Constants.convertCellXYToPixelXY(this.curPipeCellX2, this.curPipeCellY2);
            this.background2 = this.add.image(pixelX2, pixelY2, this.levelManager.levelData[this.level-1].tiletype)
                .setDepth(71)
                .setScale(Constants.scaleFactor)
                .setOrigin(0.5)
                .setAlpha(0.9)
                .setTint(Constants.GREENish);

            this.generatedPipes = initialData.pipeQueueGenerated
            // console.log('This is the queue of pipes', this.generatedPipes) // DEBUG
            this.Graphics.createPipeQueue('player1')
            this.Graphics.createPipeQueue('player2')
            this.Graphics.createQSlots('player1')
            this.Graphics.createQSlots('player2')

            this.Graphics.drawPercentage()

            // // Draw current percentage
            const percentageCurrent = this.Temperature.returnCurrentPercentage()
            this.Graphics.drawPercentageNow(percentageCurrent)

            this.blockPlayerSpawn = {
                player1: false,
                player2: false
            };

            if (role == 'slave'){
                this.socket.off("syncTimer")
                this.socket.on("syncTimer", ({ remainingTime }) => {
                    this.timer.forceSetTime(remainingTime);
                });
            }
        })

        if (role == 'master'){        
            // create first pipe
            const type = this.Graphics.getRandomPipe(this.level)
            this.generatedPipes = this.Graphics.generatePipePool()

            const currentLevelData = this.levelManager.levelData[this.level - 1]
            const percentage_to_win = currentLevelData.percentage_hot

            const seed = Date.now().toString();
            window.rng = new Phaser.Math.RandomDataGenerator([seed]);

            this.socket.emit('initRoom', {seed: seed, pipeType: type, pipeQueueGenerated: this.generatedPipes, hotWaterPercentage: percentage_to_win})
            //send this emit only when slave came to this very function
        }
        else if (role == 'slave') {
            this.socket.emit('slaveReady')
        }
        else {
            console.log('CRITICAL ERROR')
        }
    }

    bindKeyBoardKeysMultiplayer (role) {
        let player = null
        if (role == 'master'){
            player = 'player1'
        } else {
            player = 'player2'
        }

        const controls = { up: 'W', down: 'S', left: 'A', right: 'D', place: 'SPACE' };
        
        this.input.keyboard.on(`keyup-${controls.up}`, () => this.handlePlayerMove(player, 'up'), this);
        this.input.keyboard.on(`keyup-${controls.down}`, () => this.handlePlayerMove(player, 'down'), this);
        this.input.keyboard.on(`keyup-${controls.left}`, () => this.handlePlayerMove(player, 'left'), this);
        this.input.keyboard.on(`keyup-${controls.right}`, () => this.handlePlayerMove(player, 'right'), this);
        this.input.keyboard.on(`keyup-${controls.place}`, () => this.handlePlayerPlace(player), this);
    
        const specialKeys = [
            'ENTER',
            'ONE',
            'TWO',
            'THREE',
            ...(this.debug ? ['FOUR', 'FIVE', 'SIX', 'SEVEN'] : [])
        ];


        specialKeys.forEach(key => {
            this.input.keyboard.on(`keyup-${key}`, () => this.handleSpecialKeyPress(key, true, player), this);
        });

    }
  
    mobileKeys() {
        console.log('Mobile keys setup');
    
        const size = 16 * 10 + 10;
        const step = size * Constants.scaleFactor;
    
        this.width = Constants.screenWidth;
        this.height = Constants.screenHeight;
    
        const x = Constants.RIGHT_UP_CORNER.x + step * 1.5;
        const y = Constants.FIRST_PIPE_Y ;
    
        const keyU = this.add.image(x, Constants.FIRST_PIPE_Y- step, 'KeyU')
            .setDepth(99)
            .setScale(10 * Constants.scaleFactor)
            .setInteractive();
        const keyDo = this.add.image(x, y, 'KeyDo')
            .setDepth(99)
            .setScale(10 * Constants.scaleFactor)
            .setInteractive();
        const keyL = this.add.image(x - step, y, 'KeyL')
            .setDepth(99)
            .setScale(10 * Constants.scaleFactor)
            .setInteractive();
        const keyR = this.add.image(x + step, y, 'KeyR')
            .setDepth(99)
            .setScale(10 * Constants.scaleFactor)
            .setInteractive();
        const keySpace = this.add.image(x, y + Constants.ONE_STEP * 3, 'KeyPlace')
            .setDepth(99).setScale(10 * Constants.scaleFactor).setInteractive();
        const keyEnter = this.add.image(x, y + Constants.ONE_STEP * 6, 'KeyEnd')
            .setDepth(99).setScale(10 * Constants.scaleFactor).setInteractive();


        const keyOne = this.add.image(Constants.RIGHT_DOWN_CORNER.x - 3*Constants.ONE_STEP + 0 * Constants.ONE_STEP, Constants.LEFT_DOWN_CORNER.y, 'KeyU')
            .setDepth(99)
            .setScale(3.6 * Constants.scaleFactor)
            .setAlpha(0.1)
            .setInteractive();
        const keyTwo = this.add.image(Constants.RIGHT_DOWN_CORNER.x - 3*Constants.ONE_STEP + 1 * Constants.ONE_STEP, Constants.LEFT_DOWN_CORNER.y, 'KeyU')
            .setDepth(99)
            .setScale(3.6 * Constants.scaleFactor)
            .setAlpha(0.1)
            .setInteractive();
        const keyThree = this.add.image(Constants.RIGHT_DOWN_CORNER.x - 3*Constants.ONE_STEP + 2 * Constants.ONE_STEP, Constants.LEFT_DOWN_CORNER.y, 'KeyU')
            .setDepth(99)
            .setScale(3.6 * Constants.scaleFactor)
            .setAlpha(0.1)
            .setInteractive();
        
        if (this.multiPlayerState){
            const role = this.registry.get('role')
            let player = null
            if (role == 'master'){
                player = 'player1'
            } else {
                player = 'player2'
            }

            keyU.on('pointerdown', () => this.handlePlayerMove(player, 'up'));
            keyDo.on('pointerdown', () => this.handlePlayerMove(player, 'down'));
            keyL.on('pointerdown', () => this.handlePlayerMove(player, 'left'));
            keyR.on('pointerdown', () => this.handlePlayerMove(player, 'right'));
            keySpace.on('pointerdown', () => this.handlePlayerPlace(player));
            keyEnter.on('pointerdown', () => this.handleSpecialKeyPress('ENTER', true, player));

            keyOne.on('pointerdown', () => this.handleSpecialKeyPress('ONE'));
            keyTwo.on('pointerdown', () => this.handleSpecialKeyPress('TWO',  player));
            keyThree.on('pointerdown', () => this.handleSpecialKeyPress('THREE'));

        } else{
            keyU.on('pointerdown', () => this.curPipeMove('player1', { type: "direction", direction: 'up' }));
            keyDo.on('pointerdown', () => this.curPipeMove('player1', { type: "direction", direction: 'down' }));
            keyL.on('pointerdown', () => this.curPipeMove('player1', { type: "direction", direction: 'left' }));
            keyR.on('pointerdown', () => this.curPipeMove('player1', { type: "direction", direction: 'right' }));
            keySpace.on('pointerdown', () => this.curPipeSpawn('player1'));
            keyEnter.on('pointerdown', () => this.onTimerEnd());

            keyOne.on('pointerdown', () => this.useTool(1));
            keyTwo.on('pointerdown', () => this.useTool(2,  'player1'));
            keyThree.on('pointerdown', () => this.useTool(3));
        }

    }
     
    handlePlayerMove(player, direction) {
        this.curPipeMove(player, { type: "direction", direction });
    }

    handlePlayerPlace(player) {
        this.curPipeSpawn(player)
    }
    
    handleSpecialKeyPress(key, local, player) {
        if (this.specialKeyPressed[key]) return;
    
        // console.log(`Special key pressed: ${key}`);
        this.specialKeyPressed[key] = true;
        
        if(local)
            this.socket?.emit('specialKeyPress', { key });
    
        switch (key) {
            case 'ENTER': this.onTimerEnd(); break;
            case 'ONE': this.useTool(1); break;
            case 'TWO': this.useTool(2, player); break;
            case 'THREE': this.useTool(3); break;
            case 'FIVE': this.startSeller(); break;
            case 'FOUR': this.startEnemy(); break;
            case 'SIX': this.endGame(); break;
            case 'SEVEN': this.showResultBanner(); break;
            default: break;
        }

        setTimeout(() => { this.specialKeyPressed[key] = false; }, 100);
    }
    
    resetSpecialKeyPressed() {
        this.specialKeyPressed = {};
        const specialKeys = ['ENTER', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];
        specialKeys.forEach(key => this.specialKeyPressed[key] = false);
    }

    addListeners(){
        this.clearListeners()
        // console.log('Adding listeners')

        this.events.on('backToMenu', () => {
            this.levelManager.level = 1
        })

        this.events.on('spawnPipe', (type) => {
            if (type === 'place') {
                // this.addScore(10)
                // console.log('Place')
            } else if (type === 'boom') {
                const currentLevelDataEnemy = this.levelManager.levelData[this.level - 1].enemy
                if (currentLevelDataEnemy){
                    this.addBoom(1)
                }
            }
        })

        this.events.on('circleClicked', () => {
            // Draw current percentage
            this.time.delayedCall(50, () =>{
                // console.log('Calculating percentage')
                const percentageCurrent = this.Temperature.returnCurrentPercentage()
                this.Graphics.drawPercentageNow(percentageCurrent)
            })
            
        })

        this.events.on('enemySceneStopped', this.restartGameAfterEnemy, this)

        this.game.events.off('resumeTimer')
        this.game.events.on('resumeTimer', () =>{
            this.timer.resume()
        })

        this.socket.off('playerMove')
        this.socket.on('playerMove', (data) => {
            this.curPipeMove(data.player, { type: "XY", x: data.x, y: data.y });
        });
    
        // this.socket.off('pipePlaceSent')
        // this.socket.on('pipePlaceSent', (data) => {
        //     this.curPipeSpawn(data.player);
        // });

        this.socket.off('pipePlaceSent')
        this.socket.on('pipePlaceSent',  (data) => {
            // this.curPipeSpawnReceived(data)
            this.curPipeSpawnReceived(data)
            // console.log(`${data.player} placing ${data.textureKey}, angle: ${data.angle} to x: ${data.x}, y: received from server ${data.y}`)
        })
        
        this.socket.off('specialKeyPress')
        this.socket.on('specialKeyPress', (data) => {
            this.handleSpecialKeyPress(data.key, false);
        });

        this.socket.off('changeTemperature')
        this.socket.on('changeTemperature', (data) => {
            this.Temperature.drawCircle(data.x, data.y, data.hot);
            this.Temperature.change_temperature(data)
            const percentageCurrent = this.Temperature.returnCurrentPercentage()
            this.Graphics.drawPercentageNow(percentageCurrent)

        });

        this.socket.off('bothReadyFinishLevel')
        this.socket.on('bothReadyFinishLevel', () => {
            if (this.Graphics.banner && this.Graphics.buttonOK){
                this.Graphics.banner.setScale(0)
                this.Graphics.buttonOK.destroy()
                this.endLevel()
            }
            
            this.textSkipReady?.destroy()
            
        })

        this.socket.off('userDisconnected')
        this.socket.on('userDisconnected', () => {
            this.clearListeners()
            this.scene.start('Menu')
            this.scene.stop('Game')
        })

        this.socket.off('deviceTypeMobile')
        this.socket.on('deviceTypeMobile', () => {
            this.stateMobile = true
            // console.log('Mobile mode on')
            this.mobileKeys()
            this.registry.set('stateMobile', this.stateMobile)
        })

        this.socket.off('enemySceneStarted')
        this.socket.on('enemySceneStarted', () => {
            // console.log('received from server, starting enemy')
            this.startEnemy()
        })

        this.socket.off('forceLaunchScene')
        this.socket.on('forceLaunchScene', (sceneName) => {
            console.log(`Forced to launch scene: ${sceneName}`);
        });

        const role = this.registry.get('role')
        this.input.on('pointerdown', (pointer) => {
            if (this.multiPlayerState) {
                const offsetX = pointer.worldX - Constants.LEFT_UP_CORNER.x;
                const offsetY = pointer.worldY - Constants.LEFT_UP_CORNER.y;
        
                const normalizedX = offsetX / Constants.scaleFactor;
                const normalizedY = offsetY / Constants.scaleFactor;
        
                window.socket.emit('playerClick', { x: normalizedX, y: normalizedY });
        
                const color = role === 'master' ? Constants.BLUEish : Constants.GREENish;
                this.drawClickCircle(pointer.worldX, pointer.worldY, color);
            }
        });

        this.socket.off('playerClick')
        this.socket.on('playerClick', (data) => {
            const worldX = Constants.LEFT_UP_CORNER.x + data.x * Constants.scaleFactor;
            const worldY = Constants.LEFT_UP_CORNER.y + data.y * Constants.scaleFactor;
        
            const color = role === 'slave' ? Constants.BLUEish : Constants.GREENish;
            this.drawClickCircle(worldX, worldY, color);
        });   
    }

    drawClickCircle(x, y, color) {
        const circle = this.add.circle(x, y, 20*Constants.scaleFactor, color, 0.4)
            .setDepth(100)
            .setStrokeStyle(2*Constants.scaleFactor, color);
    
        this.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => circle.destroy()
        });
    }

    clearListeners(){
        // console.log('Clearing listeners')
        this.events.off('spawnPipe')
        this.events.off('enemySceneStopped')
        this.events.off('sellerSceneStopped')
        this.events.off('endLevel')
        this.events.off('circleClicked');
        this.game.events.off('resumeTimer')

        this.socket.off('playerMove')
        this.socket.off('pipePlaceSent')
        this.socket.off('specialKeyPress')
        this.socket.off('changeTemperature')
        this.socket.off('bothReadyFinishLevel')
        this.socket.off('userDisconnected')
        this.socket.off('deviceTypeMobile')
        this.socket.off('enemySceneStarted')
        this.socket.off("syncTimer")
        this.socket.off("opponentPlace")
        this.socket.off('playerClick')
        this.input.off('pointerdown')
    }

    createGraphics(){
        this.Graphics = new Graphics(this)
        this.Graphics.createBackground()
        this.Graphics.createBPSlots()

        this.Graphics.loadAnimations()
        this.Graphics.createSourceAndSink()
        this.Graphics.createBlocks()

        this.Graphics.drawScore(this.score)
        this.Graphics.drawBoom(this.boom_counts)
        
        this.graphics = this.add.graphics({ lineStyle: { width: 4* Constants.scaleFactor, color: 0x0000FF } }) ///??? i dunno but I need that ♿
    }

    calculateSourceSink(){
        this.sourceCoordinates = []
        this.blockCoordinates = []
        const currentLevelData = this.levelManager.levelData[this.level - 1]
        currentLevelData.sourceCoords.forEach((source) => {
            this.sourceCoordinates.push(source)
        })
        currentLevelData.blockCoords.forEach((block) => {
            this.blockCoordinates.push(block)
        })
        this.sinkCoordinates = currentLevelData.sinkCoords
        this.LogicConnection.findSource()
    }

    addLevelText(){
        this.add.text(
            Constants.ENEMY.x,
            Constants.FIRST_PIPE_Y,
            'Level:\n' + this.level,
            { font: `${Math.round(this.FontSize)}px PixelFont`, fill: "#ffffff", align: "center" }
        ).setOrigin(0.5)
    }

    addTimerText(){
        const levelTime = this.levelManager.levelData[this.level - 1].time
            this.timer = new Timer(
                this, // scene
                Constants.ENEMY.x, //x - change to coordinates
                Constants.FIRST_PIPE_Y+ Constants.ONE_STEP, //y
                levelTime, //start time sec
                this.onTimerEnd.bind(this)  //callbackOnEnd
                )
    }

    showResultBanner() {

        this.timer?.destroy()
        this.game.events.emit('resultsSound', (this.lvlWon))

        const weight = 500*Constants.scaleFactor
        const height = 400*Constants.scaleFactor

        const action =  () => {
            this.game.events.emit('buttonClicks')
            if (this.multiPlayerState) {
                this.textSkipReady?.destroy()
                this.textSkipReady = this.add.text(weight/2, (height/2)*1.8, '1/2', {

                    font: `${Math.round(this.FontSize)}px PixelFont`,
                    fill: '#ffffff',
                    align: 'center'
                });
                this.Graphics.banner.add(this.textSkipReady)
                this.textSkipReady.setOrigin(0.5).setDepth(99)
                this.socket.emit('btnPressed', 'FinishLevel');
                    
            } else {
                this.Graphics.buttonOK.destroy()
                this.Graphics.banner.setScale(0)
                this.endLevel()
            }
        }

        this.Graphics.drawResultsBanner(this.resultText, action)
    }

    calculateScores() {
        return new Promise((resolve) => {
            const usedCoordsGlobal = new Set();
            const usedCoordsPerPath = [];
    
            const scorePipe = (x, y, amount, color) => {
                const pipe = this.pipes[x]?.[y];
                if (!pipe) return;
    
                const [px, py] = Constants.convertCellXYToPixelXY(x, y);
                this.addScore(amount);
    
                const scoreText = this.add.text(px, py, `${amount}`, {
                    font: `${Math.round(this.FontSize)}px PixelFont`,
                    fill: color,
                    stroke: '#000',
                    strokeThickness: 4
                }).setDepth(99).setOrigin(0.5).setDepth(96)
    
                this.tweens.add({
                    targets: scoreText,
                    y: py - 40,
                    alpha: 0,
                    duration: 3000,
                    ease: 'Power2',
                    onComplete: () => {
                        scoreText.destroy();
                    }
                });
            };
    
            Object.values(this.path).forEach(pathArray => {
                if (Array.isArray(pathArray)) pathArray.pop();
            });
    
            Object.values(this.path).forEach(pathArray => {
                const perPathCount = new Map();
                pathArray.forEach(([x, y]) => {
                    const key = `${x},${y}`;
                    usedCoordsGlobal.add(key);
                    perPathCount.set(key, (perPathCount.get(key) || 0) + 1);
                });
                usedCoordsPerPath.push(perPathCount);
            });
    
            for (let x = 0; x < this.pipes.length; x++) {
                for (let y = 0; y < this.pipes[x].length; y++) {
                    const pipe = this.pipes[x][y];
                    if (!pipe) continue;
    
                    const key = `${x},${y}`;
                    if (!usedCoordsGlobal.has(key)) {
                        const [boomx, boomy] = Constants.convertCellXYToPixelXY(x, y);
                        const boom = this.add.sprite(boomx, boomy, 'boom_explosion')
                            .setDepth(95)
                            .setScale(3.5 * Constants.scaleFactor)
                            .play('explosion');
    
                        this.game.events.emit('spawnPipeAudio', 'boom');
    
                        boom.on('animationcomplete', () => {
                            boom.destroy();
                            pipe.destroy();
                            scorePipe(x, y, -10, '#ff0000')
                        });
                    }
                }
            }
    
            if (this.lvlWon) {
                for (const pathMap of usedCoordsPerPath) {
                    for (const [key, count] of pathMap.entries()) {
                        const [x, y] = key.split(',').map(Number);
                        if (count >= 2) {
                            scorePipe(x, y, 20, '#00ff00')
                        } else if (count === 1) {
                            scorePipe(x, y, 10, '#00ff00')
                        }
                    }
                }
            }
    
            resolve();
        });
    }
    
    
    endLevel(){
        // console.log('end level')
        
        if (this.lvlWon) { 
            if (this.level > 5) {
                this.endGame()
                return
            }
            // console.log(`the level is ${this.level}`)
            this.startSeller()
            this.levelManager.increaseLevel()
            this.clearscene()
            

        } else {
            this.addScore(-50)
            this.registry.set('Score', this.score)
            this.startSeller()
            this.clearscene()
        }
    }

    calcNextXY(oldX, oldY, movement)
    {
        let newX = oldX
        let newY = oldY

        if (movement.type == "direction")
        {
            // console.log(movement.type)
            switch (movement.direction)
            {
                case 'left':
                    newX = Math.max(0, oldX - 1);
                    break;
                case 'right':
                    newX = Math.min(Constants.HORIZ_CELLS_COUNT - 1, oldX + 1);
                    break;
                case 'up':
                    newY = Math.max(0, oldY - 1);
                    break;
                case 'down':
                    newY = Math.min(Constants.VERT_CELLS_COUNT - 1, oldY + 1);
                    break;
            }
        }
        else if(movement.type == "XY")
        {
            newX = movement.x
            newY = movement.y
        }

        return [ newX, newY ]
    }

    curPipeMove(player, movement) {
        if (this.enemyState) return
        if (this.block && movement.type == "direction" /* check if it's local player */ && this.state_tool === 'None') { 
            // console.log('Called spawn, returning');
            return;
        }
        if (this.blockPlayerSpawn[player]){
            return
        }

        let pipe
        let x 
        let y
        let background

        if (this.state_tool == 'None')
        {
            pipe = player === 'player1' ? this.curPipe1 : this.curPipe2;
            x = player === 'player1' ? this.curPipeCellX1 : this.curPipeCellX2;
            y = player === 'player1' ? this.curPipeCellY1 : this.curPipeCellY2;
            background = this.levelManager.levelData[this.level-1].tiletype
        }
        else
        {
            pipe = this.screw
            x = this.curPipeCellX1
            y = this.curPipeCellY1
        }

        const [newX, newY] = this.calcNextXY(x, y, movement)
        // console.log(`newX: ${newX}, newY: ${newY}`)

        if (player === 'player1' && this.state_tool == 'None')
        {
            this.curPipeCellX1 = newX;
            this.curPipeCellY1 = newY;
            this.background?.destroy()
        }
        else if (player === 'player2' && this.state_tool == 'None')
        {
            this.curPipeCellX2 = newX;
            this.curPipeCellY2 = newY;
            this.background2?.destroy()
        }
        else
        {
            this.curPipeCellX1 = newX;
            this.curPipeCellY1 = newY;
            this.background2?.destroy()
            this.background?.destroy()
        }

        const [pixelX, pixelY] = Constants.convertCellXYToPixelXY(newX, newY);
        
        if (this.state_tool == 'None'){
            if (player == 'player1'){
                this.background = this.add.image(pixelX, pixelY, background).setDepth(71).setScale(Constants.scaleFactor).setOrigin(0.5).setAlpha(0.6)
                .setTint(Constants.BLUEish)
            } else {
                this.background2 = this.add.image(pixelX, pixelY, background).setDepth(71).setScale(Constants.scaleFactor).setOrigin(0.5).setAlpha(0.6)
                .setTint(Constants.GREENish)
            }
        }
        pipe.setPosition(pixelX, pixelY);
        pipe.setTint(player === 'player1' ? Constants.BLUEish : Constants.GREENish);
        pipe.setDepth(90);

        if (this.multiPlayerState && movement.type == "direction" /* check if it's local player */)
            this.socket?.emit('playerMove', { player, x: newX, y: newY})

        if (this.checkemptycell(newX, newY)) {
            pipe.setTint(Constants.RED).setDepth(100)
            if (player == 'player1') {
                this.background.setTint(Constants.RED).setDepth(99).setAlpha(0.8)
            } else {
                this.background2.setTint(Constants.RED).setDepth(99).setAlpha(0.8)
            }
        }
    }

    checkemptycell(newX, newY){
        let cellbusy = false
        this.sourceCoordinates.forEach((coord) => {
            if (newX === coord.x && newY === coord.y){
                cellbusy = true
            }
        })

        this.blockCoordinates.forEach((block) => {
            if (newX === block.x && newY === block.y){
                cellbusy = true
            }
        })

        if (this.sinkCoordinates.x === newX && this.sinkCoordinates.y === newY){
            cellbusy = true
        }
        return cellbusy
    }

    curPipeSpawnReceived(data) {
        const player = data.player
        const pipeToPlace = data.textureKey
        const angle = data.angle
        const curPipeCellX = data.x
        const curPipeCellY = data.y
        const color = player === 'player1' ? Constants.BLUEish : Constants.GREENish

        
        if (pipeToPlace === 'tool_screw') {
            // console.log('In the screw')
            // const pipe = this.screw
            this.screwPlace(player, curPipeCellX, curPipeCellY)
        } 
        else {
            const role = this.registry.get('role')
            if ((player == 'player1' && role == 'master') ||  (player == 'player2' && role == 'slave')){
                // this.console.log('from the same player') // This never happends
            } 
            else if ((player == 'player1' && role == 'slave')) {
                // console.log('from master, but I am a slave')
                this.curPipe1.destroy()
                
            }
            else if ((player == 'player2' && role == 'master')){
                // console.log('from slave, but I am master')
                this.curPipe2.destroy()
            }
            const pipe = this.Graphics.createPipe(curPipeCellX, curPipeCellY, pipeToPlace, angle, color, 90);
            const queue = player === 'player1' ? this.Graphics.pipeQueue : this.Graphics.pipeQueue2
            const nextPipe = queue[this.Graphics.pipeQueue.length - 1];
            pipe.setDepth(70);

            if (this.pipes[curPipeCellX][curPipeCellY] !== 0) {
                this.boomPlace(player, curPipeCellX, curPipeCellY)
            } 
            else {
                this.events.emit('spawnPipe', 'place');
                this.game.events.emit('spawnPipeAudio', 'place');
            }

            this.pipes[curPipeCellX][curPipeCellY] = pipe;
            this.registry.set('pipes', this.pipes);
            this.LogicConnection.updatePipeMatrix(curPipeCellX, curPipeCellY, pipe.texture.key, pipe.angle);
            this.path = this.LogicConnection.traverse();
            
            pipe.clearTint();
            if (player === 'player1') {
                this.curPipe1 = this.Graphics.createPipe(curPipeCellX, curPipeCellY, nextPipe.type, nextPipe.angle, Constants.BLUEish, 90);
            } else {
                this.curPipe2 = this.Graphics.createPipe(curPipeCellX, curPipeCellY, nextPipe.type, nextPipe.angle, Constants.GREENish, 90);
            }

            this.Graphics.drawWaterPathDuring(); // Draw water path
            this.Graphics.updatePipeQueue(player);
        }

        if (this.stateInfiniteLoop){
            // console.log('state loop accepted from the game scene')
            this.Graphics.drawWaterPathDuring(); 
        }
    }

    screwPlace(player, curPipeCellX, curPipeCellY){
        this.game.events.emit('spawnPipeAudio', 'place')
        this.tweens.add({
            targets: this.screw,
            angle: '+=180',
            duration: 500,
            ease: 'Cubic',
            onComplete: () => {
                this.screw.destroy();
                if (this.pipes[curPipeCellX][curPipeCellY]) {
                    this.pipes[curPipeCellX][curPipeCellY].destroy();
                    this.registry.set('pipes', this.pipes); 
                }

                this.pipes[curPipeCellX][curPipeCellY] = 0;
                this.registry.set('pipes', this.pipes);
                
                this.LogicConnection.updatePipeMatrix(curPipeCellX, curPipeCellY, 'nothing', 0);
                this.path = this.LogicConnection.traverse();
                this.state_tool = 'None';

                this.moveCurPipeUP(player); // Move the pipe up for the player
                this.time.delayedCall(700, () => {
                    this.blockPlayerSpawn[player] = false
                    this.block = false
                })
            }
        });
    }

    boomPlace(player, curPipeCellX, curPipeCellY){
        this.blockPlayerSpawn[player] = true
        if (this.pipes[curPipeCellX][curPipeCellY]?.destroy) {
            this.pipes[curPipeCellX][curPipeCellY].destroy()
            this.registry.set('pipes', this.pipes); // Update pipes data
        }

        const [boomx, boomy] = Constants.convertCellXYToPixelXY(curPipeCellX, curPipeCellY)
        const boom = this.add.sprite(boomx, boomy, 'boom_explosion').setDepth(95).setScale(3.5 * Constants.scaleFactor)
        boom.play('explosion');
        this.game.events.emit('spawnPipeAudio', 'boom')

        boom.on('animationcomplete', () => {
            boom.destroy()
            this.events.emit('spawnPipe', 'boom')
            this.blockPlayerSpawn[player] = false
            this.block = false
        })
    }
        
    curPipeSpawn(player, pipe = null,  curPipeCellX = null, curPipeCellY = null, data = null) {
        if (this.enemyState) return
        if (this.block && this.state_tool === 'None') return;
        if (this.blockPlayerSpawn[player] ) {
            // console.log('the spawn is blocked by boom')
            return
        }

        if (this.state_tool == 'None'){
            pipe = player === 'player1' ? this.curPipe1 : this.curPipe2;
            curPipeCellX = player === 'player1' ? this.curPipeCellX1 : this.curPipeCellX2;
            curPipeCellY = player === 'player1' ? this.curPipeCellY1 : this.curPipeCellY2;
        }
        else{
            pipe = this.screw
            curPipeCellX = this.curPipeCellX1
            curPipeCellY = this.curPipeCellY1
        }

        if (this.checkemptycell(curPipeCellX, curPipeCellY)) {
            return;
        }

        // Debug placing pipes
        this.socket.emit('playerPlace', {
            player,
            textureKey: pipe.texture.key,
            angle: pipe.angle,
            x: curPipeCellX,
            y: curPipeCellY
          })


        if (this.state_tool === 'screw') {
            this.screwPlace(player, curPipeCellX, curPipeCellY)
        } 
        else {
            const queue = player === 'player1' ? this.Graphics.pipeQueue : this.Graphics.pipeQueue2
            const nextPipe = queue[this.Graphics.pipeQueue.length - 1];
            // console.log(`the next pipe in hand is`, nextPipe.type, `for ${player}`)
            pipe.setDepth(70);

            if (this.pipes[curPipeCellX][curPipeCellY] !== 0) {
                this.boomPlace(player, curPipeCellX, curPipeCellY) 
            } 
            else {
                // console.log(`${player} placed pipe`, pipe.texture.key, `at x:${curPipeCellX} y: ${curPipeCellY}`)
                this.events.emit('spawnPipe', 'place');
                this.game.events.emit('spawnPipeAudio', 'place');
            }

            this.pipes[curPipeCellX][curPipeCellY] = pipe;
            this.registry.set('pipes', this.pipes); // Update pipes data
            this.LogicConnection.updatePipeMatrix(curPipeCellX, curPipeCellY, pipe.texture.key, pipe.angle);
            this.path = this.LogicConnection.traverse();
            
            pipe.clearTint();
            if (player === 'player1') {
                this.curPipe1 = this.Graphics.createPipe(curPipeCellX, curPipeCellY, nextPipe.type, nextPipe.angle, Constants.BLUEish, 90);
            } else {
                this.curPipe2 = this.Graphics.createPipe(curPipeCellX, curPipeCellY, nextPipe.type, nextPipe.angle, Constants.GREENish, 90);
            }

            this.Graphics.drawWaterPathDuring(); // Draw water path
            this.Graphics.updatePipeQueue(player);
        }

        if (this.stateInfiniteLoop){
            // console.log('state loop accepted from the game scene')
            this.Graphics.drawWaterPathDuring(); 
        }
    }

    async onTimerEnd() {
        if (this.enemyState) return
        console.log('TimerEnds')
        if (this.block) return
        this.block = true
        this.lvlWon = false
        // console.log('TimerEnds2')
        this.events.emit('endLevel', this.path)
        await this.calculateScores()
        
        if (this.lvlWon) {
            this.resultText = "Level completed"
        }
        else{
            this.resultText = "Failed, try again"
        }

        this.Graphics.drawWaterPath()
        // console.log('creating banner')
        this.showResultBanner()
    }

    clearscene(){
        this.LogicConnection.initialize_matrix_pipetypes()
        if (this.path) {this.path.length = 0}
        this.block= false
    }

    addScore(value){
        this.score = this.score + value

        if (this.score <= 0 ){
            this.score = 0
        }
        this.Graphics.drawScore(this.score)
        this.registry.set('Score', this.score)
    }

    addBoom(value){
        this.boom_counts = this.boom_counts + value

        if (this.boom_counts>9){
            this.boom_counts = 0
            
            if (this.multiPlayerState){
                const role = this.registry.get('role')
                if (role == 'master'){
                    // setTimeout(() => {
                    this.socket.emit('startEnemyScene')
                    // }, 200);
                } else {
                    console.warn('slave tried to start an enemy scene!')
                }
            } else {
                this.startEnemy()
            }
            
        }
        this.Graphics.drawBoom(this.boom_counts)
    }

    useTool(toolNumber, player) {
        if (this.block) return;
        if (this.enemyState) return;
        const purchasedItems = this.registry.get('purchasedItems') || {};
        const toolKeys = ['tool_clock', 'tool_screw', 'tool_shield'];
        if (toolNumber < 1 || toolNumber > 3) {
            console.warn('Tool out of the scope');
            return;
        }
        const toolKey = toolKeys[toolNumber - 1];
        if (!purchasedItems[toolKey] || purchasedItems[toolKey] <= 0) {
            console.warn(`No ${toolKey} available or insufficient quantity.`);
            this.game.events.emit('missedHit')
            return;
        }
            purchasedItems[toolKey] -= 1;
        this.registry.set('purchasedItems', purchasedItems);
        this.game.events.emit('useItem')

        switch (toolNumber) {
            case 1:
                this.timer.addTime(30);
                this.Graphics.highlightBPCell(1);
                break;

            case 2:
                this.state_tool = 'screw';
                this.block = true;

                const [pixelX, pixelY] = Constants.convertCellXYToPixelXY(this.curPipeCellX1, this.curPipeCellY1);

                const type = 'tool_screw';
                // console.log('player space is blocked', this.blockPlayerSpawn[player] )
                this.moveCurPipeDown();

                this.screw = this.add.image(pixelX, pixelY, type).setScale(0.4*Constants.scaleFactor).setDepth(91);
                this.Graphics.highlightBPCell(2);
                break;

            case 3:
                this.boom_counts = 0;
                this.Graphics.drawBoom(this.boom_counts);
                this.Graphics.highlightBPCell(3);
                break;
        }
    }

    moveCurPipeDown() {
        if (this.multiPlayerState){
            this.tweens.add({
                targets: this.curPipe1,
                x: Constants.LEFT_DOWN_CORNER.x + Constants.ONE_STEP*5,
                y: Constants.LEFT_DOWN_CORNER.y,
                scale: 0.6*Constants.scaleFactor,
                duration: 1000,
                ease: 'Cubic',
            });
            this.curPipe1.setTint(Constants.WHITE)

            this.tweens.add({
                targets: this.curPipe2,
                x: Constants.LEFT_DOWN_CORNER.x + Constants.ONE_STEP*6,
                y: Constants.LEFT_DOWN_CORNER.y,
                scale: 0.6*Constants.scaleFactor,
                duration: 1000,
                ease: 'Cubic',
            });
            this.curPipe2.setTint(Constants.WHITE)
        }
        else
        {
            this.tweens.add({
            targets: this.curPipe1,
            x: Constants.LEFT_DOWN_CORNER.x + Constants.ONE_STEP*5,
            y: Constants.LEFT_DOWN_CORNER.y,
            scale: 0.6*Constants.scaleFactor,
            duration: 1000,
            ease: 'Cubic',
        });
        this.curPipe1.setTint(Constants.WHITE)
        }
        this.background?.destroy()
        this.background2?.destroy()
    }

    moveCurPipeUP() {
        if (this.multiPlayerState){
            const [x,y] = Constants.convertCellXYToPixelXY(this.curPipeCellX1,this.curPipeCellY1)
            this.tweens.add({
                targets: this.curPipe1,
                x: x,
                y: y,
                scale: 1*Constants.scaleFactor,
                duration: 1000,
                ease: 'Cubic',
                onComplete:() => {
                    this.curPipe1.setTint(Constants.BLUEish)
                    this.path = this.LogicConnection.traverse()
                    this.Graphics.drawWaterPathDuring()

                    this.background?.destroy()
                    this.background = this.add.image(x, y, this.levelManager.levelData[this.level-1].tiletype)
                    .setDepth(71)
                    .setScale(Constants.scaleFactor)
                    .setOrigin(0.5)
                    .setAlpha(0.6)
                    .setTint(Constants.BLUEish)
                }
            });

            const [x2,y2] = Constants.convertCellXYToPixelXY(this.curPipeCellX2,this.curPipeCellY2)
            this.tweens.add({
                targets: this.curPipe2,
                x: x2,
                y: y2,
                scale: 1*Constants.scaleFactor,
                duration: 1000,
                ease: 'Cubic',
                onComplete:() => {
                    this.curPipe2.setTint(Constants.GREENish)
                    this.path = this.LogicConnection.traverse()
                    this.Graphics.drawWaterPathDuring()

                    this.background2?.destroy()
                    this.background2 = this.add.image(x2, y2, this.levelManager.levelData[this.level-1].tiletype)
                        .setDepth(71)
                        .setScale(Constants.scaleFactor)
                        .setOrigin(0.5)
                        .setAlpha(0.6)
                        .setTint(Constants.GREENish)
                }
            });
        }
        else {
            const [x,y] = Constants.convertCellXYToPixelXY(this.curPipeCellX1,this.curPipeCellY1)
            this.tweens.add({
                targets: this.curPipe1,
                x: x,
                y: y,
                scale: 1*Constants.scaleFactor,
                duration: 1000,
                ease: 'Cubic',
                onComplete:() => {
                    this.curPipe1.setTint(Constants.BLUEish)
                    this.background?.destroy()
                    this.background = this.add.image(x, y, this.levelManager.levelData[this.level-1].tiletype)
                    .setDepth(71)
                    .setScale(Constants.scaleFactor)
                    .setOrigin(0.5)
                    .setAlpha(0.6)
                    .setTint(Constants.BLUEish)
                    this.path = this.LogicConnection.traverse()
                    this.Graphics.drawWaterPathDuring()
                }
            });
        }
    }

    startEnemy(){
        this.block = true
        this.enemyState = true
        this.boom_counts = 0
        this.Graphics.drawBoom(this.boom_counts);
        this.background?.destroy()
        this.background2?.destroy()

        this.pathGraphicsArray.forEach(graphic => {
            graphic.clear()
            graphic.destroy()
        });
        this.scene.launch('Enemy')
        this.timer.stop()
        this.graphics.clear()
        this.moveCurPipeDown()
        this.Graphics.pplHiding()
        
    }

    restartGameAfterEnemy(){
        this.time.delayedCall(1000, () => {
            this.block = false
            this.enemyState = false
        })

        this.Graphics.startAnimationCycle()
        this.pipes = this.registry.get('pipes')
        this.moveCurPipeUP()
        this.timer.resume()
        this.Graphics.drawWaterPathDuring()
        this.boom_counts = 0
        this.Graphics.drawBoom(this.boom_counts)
    }

    startSeller(){
        this.registry.set('level', this.level)
        this.scene.stop('Game')
        // console.log('stopped Game, launched Seller')
        this.scene.start('Seller')
    }

    resumeGameafterSeller(){
        this.Graphics.createBPSlots()
        this.score = this.registry.get('Score')
        this.Graphics.drawScore(this.score)
        this.scene.start('Game')
    }

    pauseButton(){
        const pause_button = this.add.image(40,40,'pause').setDepth(99).setInteractive({cursor: 'pointer'}).setScale(2*Constants.scaleFactor)
        pause_button.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.scene.launch('Pause', { param: 'Game' })
            if (!this.multiPlayerState){
                this.scene.pause('Game')
                // console.log('stopping timer')
                this.timer.stop()
            }
        })
    }

    questionButton(){
        const question_button = this.add.image(100, 40,'book')
        .setDepth(99)
        .setInteractive({cursor: 'pointer'})
        .setScale(4*Constants.scaleFactor)
        question_button.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.timer.stop()
            this.scene.launch('Tutorial', { param: true }) 
            if (!this.multiPlayerState)
            {this.scene.pause('Game')}
        })
    }

    endGame(){
        this.clearListeners()
        this.scene.stop('Game')
        this.scene.start('EndGameScene')
    }
}

/* TODO:
1. Game scene:
    draw a stopper to the triple, when one end is unused

change shield to bag with money

esc - pause
*/
