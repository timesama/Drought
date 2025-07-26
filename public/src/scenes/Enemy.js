import Phaser from '../lib/phaser.js'
import * as Constants from '../modules/Constants.js'
import { LogicConnection } from '../modules/PipeConnectionLogic.js'

// Each time the scene is loaded, if the pipe matrix didn't change- the sequence of chosen pipes doesn't change as well...

export default class Enemy extends Phaser.Scene
{
    constructor()
    {
        super('Enemy')
        this.LogicConnection = new LogicConnection(this)
    }
    preload() {
        const frameWidth = 32
        const frameHeight = 32
        this.load.spritesheet('enemy_fire', 'assets/spritesheet/Enemy_fire.png', {
            frameWidth,
            frameHeight
        });

        this.load.spritesheet('missile_fly', 'assets/spritesheet/Missile.png', {
            frameWidth: 16,
            frameHeight: 32
        });

        this.load.spritesheet('boom_explosion', 'assets/spritesheet/Boom.png', {
            frameWidth,
            frameHeight
        });

        this.load.spritesheet('door', 'assets/spritesheet/Enemy_shield.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        // this.LogicConnection.findSource()
        this.load.image('KeyThrow', 'assets/KeyThrow.png');
        this.LogicConnection.matrix_pipetypes = this.registry.get('matrix_pipetypes'); // LogicConnectionSingleton.js???
        // console.log('unz')

        this.game.events.emit('enemy-activated')
    }

    create()
    {   
        this.role = this.registry.get('role'); // 'master' or 'slave'
        window.socket.emit(`${this.role}LaunchSceneEnemy`);

        // States
        this.stateWait = false
        this.shouldWaitForMissile = true
        this.sceneBlock = false
        this.isMissileInAir = false
        this.state_shielded = true
        this.multiPlayerState = this.registry.get('multiplayer'); // Takes from menu
        this.stateHit = false
        this.player = null

        this.Graphics = this.registry.get('Graphics')

        this.x_enemy = Constants.ENEMY.x
        this.y_enemy = Constants.ENEMY.y

        this.createHideOut()

        this.loadAnimations()

        this.door = this.add.image(this.x_enemy, this.y_enemy, 'enemy_shield')
            .setScale(Constants.scaleFactor)
            .setScrollFactor(1, 0)
            .setDepth(90);

        this.stateMobile = this.registry.get('stateMobile')
        if (this.stateMobile){
            const size = 16 * 10 + 10;
            const step = size * Constants.scaleFactor;
            const x = Constants.RIGHT_UP_CORNER.x + step * 1.5;
            const y = Constants.FIRST_PIPE_Y;
            this.keySpace = this.add.image(x, y + Constants.ONE_STEP * 3, 'KeyThrow')
                .setDepth(99)
                .setScale(10 * Constants.scaleFactor)
                .setInteractive();
        }

        this.input.keyboard.off(`keyup-ENTER`)

        if (this.multiPlayerState){
            if (this.role == 'master'){
                this.player = 'player1'
                this.scheduleRandom() // only for player1: single player or master in multiplayer
            } else {
                this.player = 'player2'
            }

            this.keySpace?.on('pointerdown', () => this.handlePlayerThrow(this.player));
            this.input.keyboard.on(`keyup-SPACE`, () => this.handlePlayerThrow(this.player), this);
                        
            window.socket.off('playerThrow')
            window.socket.off('closeEnemyScene')

            window.socket.on('playerThrow', (data) => {
                this.throwPipe(data.player);
            });

            window.socket.off('openShield')
            window.socket.on('openShield', () => { 
                this.openShieldAnimation() 
            })

            window.socket.off('fireInTheHole')
            window.socket.on('fireInTheHole', (data)=>{
                // console.log('received command to destroy', data)
                const [x, y] = Constants.convertCellXYToPixelXY(data.x, data.y)
                this.drawRectangle(x, y)
                this.launchMissile(data.x, data.y);
            })
            
            window.socket.on('closeEnemyScene', () => {
                // console.log('received from server to close the scene')
                this.endScene()
            });

        } else {
            this.player = 'player1'
            this.scheduleRandom()
            this.throwPipePlayer1 = () => this.throwPipe('player1');
            this.keySpace?.on('pointerdown',  this.throwPipePlayer1, this);
            this.input.keyboard.on('keyup-SPACE', this.throwPipePlayer1, this);
        }

        window.socket.off('userDisconnected')
        window.socket.on('userDisconnected', () => {
            window.socket.off('playerThrow')
            this.scene.start('Menu')
            this.scene.stop('Enemy')
            this.scene.stop('Game')
        })

        window.socket.off('pauseEnemy')
        window.socket.on('pauseEnemy', (data) =>{
            // console.log('(un)pause')
            const hidden = data.status
            const partner = data.role
            let name = null
            if (partner == 'master'){
                name = 'Player 1'
            } else {
                name = 'Player 2'
            }

            this.afkText?.destroy()

            if (hidden){
                this.afkText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
                    `${name} is afk`, 
                    {
                        fontSize: `${64 * Constants.scaleFactor}px`,
                        fill: '#ff0000',
                        fontFamily: 'PixelFont',
                        stroke: '#000',
                        strokeThickness: 8 * Constants.scaleFactor,
                    })
                .setOrigin(0.5)
                .setDepth(1000);
    
                this.scene.pause('Enemy')
            } else{
                this.scene.resume('Enemy')
            } 
        })

        this.setupTabVisibilityListener();
    }

    handlePlayerThrow(player) {
        window.socket?.emit('playerThrow', { player });
        // this.throwPipe(player);
    }

    createHideOut(){
        this.enemy = this.add.image(this.x_enemy-20*Constants.scaleFactor, this.y_enemy+10*Constants.scaleFactor, 'enemy')
            .setScrollFactor(1, 0)
            .setDepth(50)
            .setScale(6*Constants.scaleFactor)
        this.add.image(this.x_enemy, this.y_enemy, 'enemy_place')
            .setScrollFactor(1, 0)
            .setDepth(10)
            .setScale(Constants.scaleFactor)
    }

    /* Animation part */
    loadAnimations() {
        this.anims.create({
            key: 'enemyShoot',
            frames: this.anims.generateFrameNumbers('enemy_fire', { start: 0, end: 9 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'missileFly',
            frames: this.anims.generateFrameNumbers('missile_fly', { start: 0, end: 2 }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('boom_explosion', { start: 0, end: 6 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'door_open',
            frames: this.anims.generateFrameNumbers('door', { start: 0, end: 8 }),
            frameRate: 18,
            repeat: 0,
            ease: 'Cubic'
        });

        this.anims.create({
            key: 'door_close',
            frames: this.anims.generateFrameNumbers('door', { start: 8, end: 0 }),
            frameRate: 18,
            repeat: 0,
            ease: 'Cubic'
        });
    }

    closeShieldAnimation() {
        this.door?.destroy()
        this.state_shielded = false

        this.door = this.add.sprite(this.x_enemy, this.y_enemy, 'door').setDepth(90).setScale(12*Constants.scaleFactor)
        this.door.play('door_close')
        this.door.on('animationcomplete', () => {
            this.state_shielded = true
            // console.log('Door closed');
        })
    }

    openShieldAnimation() {
        this.door?.destroy()
        this.state_shielded = false

        this.door = this.add.sprite(this.x_enemy, this.y_enemy, 'door').setDepth(90).setScale(12*Constants.scaleFactor)
        this.door.play('door_open')
        this.door.on('animationcomplete', () => {
            if (this.player == 'player1' && !this.stateHit){
                this.choosePipe()
            }
        })
    }    

    choosePipe() {
        const pipes = this.registry.get('pipes');
    
        if (!pipes || !pipes.length) {
            console.log('No pipes available.');
            return;
        }
    
        const rows = pipes.length;
        const cols = pipes[0].length;
        const validCoords = [];
    
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const pipe = pipes[row][col];
                if (pipe && typeof pipe === 'object') {
                    validCoords.push({ x: row, y: col });
                }
            }
        }
    
        if (validCoords.length === 0) {
            console.log('No valid pipes found.');
            this.endScene();
            window.socket?.emit('closeEnemy');
            return;
        }
    
        const index = window.rng.between(0, validCoords.length - 1);
        const coord = validCoords[index];
        const [px, py] = Constants.convertCellXYToPixelXY(coord.x, coord.y);
    
        this.drawRectangle(px, py);
    
        if (!this.stateHit) {
            this.enemy?.destroy()

            this.fireSprite = this.add.sprite(this.x_enemy-20*Constants.scaleFactor, this.y_enemy+10*Constants.scaleFactor, 'enemy_fire').setDepth(50).setScale(6*Constants.scaleFactor)
            this.fireSprite.play('enemyShoot')
            this.fireSprite.on('animationcomplete', () => {
            if (this.stateHit) {
                this.fireSprite.destroy();
                console.log('destroyed firesprite because it was hit before creating, G-d help us all')
                }
            this.launchMissile(coord.x, coord.y);
            window.socket.emit('launchRocket', coord);
            })
        }
    }

    drawRectangle(x,y)
    {
        this.rectangle?.destroy();
        const width = Constants.ONE_STEP
        const fillColor = Constants.TRANSPARENT
        this.rectangle = this.add.rectangle(x, y, width, width, fillColor, 0).setDepth(92)
        this.rectangle.setStrokeStyle(4, Constants.RED)
    }

    launchMissile(x, y) {
        return new Promise((resolve) => {
            this.isMissileInAir = true;
            const [endX, endY] = Constants.convertCellXYToPixelXY(x, y);

            const missle = this.add.sprite(this.x_enemy-20*Constants.scaleFactor, this.y_enemy, 'missile_fly').setScale(4*Constants.scaleFactor).setDepth(94);
            missle.play('missileFly')
            // console.log('Fire Animation finished');
            this.tweens.add({
                targets: missle,
                x: endX,
                y: endY,
                scale: 3*Constants.scaleFactor,
                duration: 3000,
                rotation: Phaser.Math.DegToRad(90),
                ease: 'Sinusoidal',
                onComplete: () => {
                    // console.log('state of the hit is ', this.stateHit)
                    // console.log(`[launchMissile] COMPLETE - player role: ${this.role}, time: ${Date.now()}`);

                    this.closeShieldAnimation()
                    const boom = this.add.sprite(endX, endY, 'boom_explosion').setDepth(95).setScale(3*Constants.scaleFactor)
                    boom.play('explosion')
                    this.game.events.emit('spawnPipeAudio', 'boom');
                    // console.log('Destroying missile:', missle);
                    missle.destroy();
                    this.destroyPipe(x, y);
                    boom.on('animationcomplete', () => {
                        boom.destroy()
                        // console.log('Missile hit the target!');
                        this.stateWait = false;
                        this.isMissileInAir = false;
                        resolve();
                    })
                }
            });
        });
    }

    destroyPipe(x, y) {
        const pipes = this.registry.get('pipes', this.pipes);
        if (pipes[x] && pipes[x][y]) {
            const pipe = pipes[x][y];

            if (pipe instanceof Phaser.GameObjects.Image) {
                pipe.destroy();
                pipes[x][y] = 0
                this.registry.set('pipes', pipes);
                this.LogicConnection.updatePipeMatrix(x,y,"nothing",0)
                this.rectangle?.destroy()
            } else {
                console.log(`The object at coordinates (${x}, ${y}) cannot be destroyed.`);
            }
        } else {
            console.log(`Pipe at coordinates (${x}, ${y}) does not exist.`);
        }
    }

    endScene(){
        // console.log(`[endScene] Triggered - player role: ${this.role}, isMissileInAir: ${this.isMissileInAir}, time: ${Date.now()}`);
        // console.log('close Enemy scene')
        this.game.events.emit('enemy-disactivated')
        window.socket.off('playerThrow')
        window.socket.off('closeEnemyScene')
        this.input.keyboard.off('keyup-SPACE', this.throwPipePlayer1, this); 
        this.input.keyboard.off('keyup-SPACE', this.throwPipePlayer2, this);//
        this.resetState()

        this.scene.get('Game').events.emit('enemySceneStopped');
        this.scene.stop('Enemy')
    }

    resetState() {   
        // console.log('resetting states')
        this.stateWait = false;
        this.shouldWaitForMissile = true;
        this.sceneBlock = false;
        this.isMissileInAir = false;
        this.state_shielded = true;
        this.multiPlayerState = this.registry.get('multiplayer');
        this.stateHit = false;
        if (this._visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
            this._visibilityChangeHandler = null
        }
    }
    
    isAllZeros(matrix) {
        for (let row of matrix) {
            if (row.some(value => value !== 0)) {
                return false;
            }
        }
        return true;
    }

    scheduleRandom() {
        if (this.stateWait == true){
            // console.log('Waiting')
            return
        }
        const pipes = this.registry.get('pipes', this.pipes)
        if (this.isAllZeros(pipes)){
            this.endScene()
        }else{

        const randomInterval = window.rng.between(5000, 10000); //!!!
        this.time.delayedCall(randomInterval, () => {
            this.scheduleRandom();
            this.openShieldAnimation()
            window.socket.emit('sendOpenShield')
        });
        }
    }

    throwPipe(player) {
        if (this.sceneBlock){
            return
        }
        this.sceneBlock = true

        const pipeQueue = this.registry.get(`${player}PipeQueue`);
        const pipeFromQueue = pipeQueue[3]

        // Is there a normal way to transfer objects between scenes? lol
        const pipeThrow = this.add.image(pipeFromQueue.sprite.x, pipeFromQueue.sprite.y, pipeFromQueue.type)
            .setScale(Constants.scaleFactor)
            .setAngle(pipeFromQueue.angle)
            .setDepth(94)
            .setTint(Constants.RED)

        if (pipeFromQueue.sprite && pipeFromQueue.sprite.scene) {
            pipeFromQueue.sprite.destroy();
        }

        this.tweens.add({
            targets: pipeThrow,
            x: Constants.CENTER.x,
            y: Constants.CENTER.y,
            duration: 4000,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: pipeThrow,
                    x: this.x_enemy,
                    y: this.y_enemy,
                    duration: 2500,
                    rotation: Phaser.Math.DegToRad(360*5),
                    ease: 'Linear',
                    onComplete: () => {
                        this.checkHit()
                        this.tweens.add({
                            targets: pipeThrow,
                            x: this.x_enemy,
                            y: this.y_enemy,
                            duration: 500,
                            scale: 0,
                            rotation: Phaser.Math.DegToRad(360*1),
                            ease: 'Linear',
                            onComplete: () => {
                                pipeThrow.destroy()
                            }
                        })
                    }
                });
            }
        });
        this.Graphics.updatePipeQueue(player);
    }

    async checkHit() {
        // console.log(`[checkHit] START - player role: ${this.role}, shielded: ${this.state_shielded}, time: ${Date.now()}`);

        if (this.state_shielded) {
            this.game.events.emit('missedHit');
            this.sceneBlock = false
            this.stateHit = false
            // console.log("Didn't Hit");
        } else {
            // console.log('Hit');
            this.sceneBlock = true
            this.stateHit = true

            let boom = this.add.sprite(this.x_enemy, this.y_enemy, 'boom_explosion')
                .setDepth(95)
                .setScale(8 * Constants.scaleFactor);

            boom.play('explosion');
            this.game.events.emit('spawnPipeAudio', 'boom');

            let enemyDeath;

            boom.on('animationcomplete', () => {
                boom.destroy()
                this.enemy?.destroy()
                this.fireSprite?.destroy()

                // console.log('Fire sprite is ', this.fireSprite) // strange behavior

                enemyDeath = this.add.sprite(this.x_enemy, this.y_enemy, 'enemy_death')
                    .setDepth(50)
                    .setScale(6 * Constants.scaleFactor);
                enemyDeath.play('death');

                enemyDeath.on('animationcomplete', async () => {
                    enemyDeath.destroy();

                    while (this.isMissileInAir) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    if (this.multiPlayerState){
                        window.socket?.emit('closeEnemy');
                        // console.log('emitting close after hitting the enemy')
                        this.endScene();
                    } else {
                        this.endScene();
                    }
                    
                });
            });
        }
    }

    setupTabVisibilityListener() {
        if (this._visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
        }
        const hiddenProp = getHiddenProperty();
    
        if (!hiddenProp) return;
    
        this._visibilityChangeHandler = () => {
            const isHidden = document[hiddenProp];
    
            window.socket?.emit('tabVisibilityChange', {
                hidden: isHidden,
                role: this.role,
                timestamp: Date.now()
            });
            
            console.log(`[TabVisibility] ${this.role} - hidden: ${isHidden}`);
        }

        document.addEventListener('visibilitychange', this._visibilityChangeHandler);
    
        function getHiddenProperty() {
            if ('hidden' in document) return 'hidden';
            if ('webkitHidden' in document) return 'webkitHidden';
            if ('mozHidden' in document) return 'mozHidden';
            if ('msHidden' in document) return 'msHidden';
            return null;
        }
    }
}