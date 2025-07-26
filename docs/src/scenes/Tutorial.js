import Phaser from '../lib/phaser.js';
import * as Constants from '../modules/Constants.js';
import Graphics from '../modules/Graphics.js'
import LevelManager from '../modules/LevelManager.js'
import Temperature from '../modules/Temperature.js'
import { LogicConnection } from '../modules/PipeConnectionLogic.js'


export default class Tutorial extends Phaser.Scene {
    constructor() {
        super('Tutorial');
        this.Graphics = null
        this.LogicConnection = null
        this.Graphics = new Graphics(this)
        this.levelManager = new LevelManager(this)
        this.LogicConnection = new LogicConnection(this)
        this.level = 6
    }

    preload() {
        this.Graphics.loadAssets()
        this.Graphics.loadSprites()
        this.loadSpriteSheets()
    }

    create(data) {
        this.gameState = data.param
        //States
        //Listeners off\on?
        this.turnOnListeners()

        //Constants init
        this.width = Constants.screenWidth
        this.height = Constants.screenHeight;

        this.widthMenu = this.width - (500*Constants.scaleFactor)
        this.heightMenu = this.height -  (200*Constants.scaleFactor);

        this.dynamicFontSizeSmall = Math.max(60 * Constants.scaleFactor); // Prevents text from being too small

        this.Graphics.loadAnimations()
        this.loadAnimations()
        this.createBackgroundPattern();
        this.createDictionary()

        let page = 0
        this.createField(page)
        this.installatorSprite()
        this.writeExitTutorial()
    }

    turnOnListeners(){
        this.events.off('basicPipesMovement')
        this.events.on('basicPipesMovement', this.basicPipesMovement, this)
        this.events.off('waterPercentage')
        this.events.on('waterPercentage', this.waterPercentage, this)
        this.events.off('pipeQueue')
        this.events.on('pipeQueue', this.pipeQueue, this)
        this.events.off('levelShow')
        this.events.on('levelShow', this.showLevel, this)
        this.events.off('timerShow')
        this.events.on('timerShow', this.timerShow, this)
        this.events.off('scoreShow')
        this.events.on('scoreShow', this.scoreShow, this)
        this.events.off('enemyShow')
        this.events.on('enemyShow', this.enemyShow, this)
        this.events.off('itemShow')
        this.events.on('itemShow', this.itemShow, this)
        this.events.off('finishTutorial')
        this.events.on('finishTutorial', this.finishTutorial, this)
    }

    createDictionary(){
        this.dictionary = [
            {
                text: "I am plumber Moti, I will teach you how to play this game.\nThe goal is to connect the source to the sink with pipes. Very easy.\nMove the pipe by pressing WASD keys. Place the pipe by pressing Space.",
                action: 'basicPipesMovement'
            },
            {
                text: "This is the queue of pipes that will appear next.",
                action: 'pipeQueue'
            },{
                text: "This tells you your current level.",
                action: 'levelShow'
            },
            {
                text: "This is the Timer. When it runs out, the water will flow.\nIf you think you have finished earlier, you can press Enter.",
                action: 'timerShow'
            },
            {
                text: "This is your score.\nWhen you place a pipe, you receive 10.\nWhen you replace a pipe you receive nothing and lose nothing\nIn the end of the level each unused pipe on the field will subtract 10 from the score\nYou can spend your scores to buy items from the shop.",
                action: 'scoreShow'
            },
            {
                text: "This is the percentage of hot water the customer requested.\nLeft click on the source changes it's temperature.\nYou need to adjust the right amount of hot and cold water",
                action: 'waterPercentage'
            },
            {
                text: "When you replace a pipe, the previous pipe will explode, and the boom counter will increase.\nWhen the boom counter reaches 10, the enemy will appear.\nHe will launch rockets onto the pipe system that you have built.\nYou will have to throw a pipe from the pipe queue at him.\nBut beware! Enemy will eventually hide under the shield.\nTime preciesly to catch him.",
                action: 'enemyShow'
            },
            {
                text: "Here are the items that you can buy from seller.\nHover over the item to learn more about it.",
                action: 'itemShow'
            },
            {
                text: "That's all!",
                action: 'finishTutorial'
            }
        ];
    }

    loadAnimations() {
        // this.anims.create({
        //     key: 'Stay',
        //     frames: this.anims.generateFrameNumbers('installator_idle', { start: 0, end: 1 }),
        //     frameRate: 3,
        //     repeat: -1,
        // });

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
            frameRate: 15,
            repeat: 0,
            ease: 'Cubic'
        });

        this.anims.create({
            key: 'door_close',
            frames: this.anims.generateFrameNumbers('door', { start: 8, end: 0 }),
            frameRate: 15,
            repeat: 0,
            ease: 'Cubic'
        });
    }

    loadSpriteSheets(){
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
    }

    createBackgroundPattern() {
        this.add
            .tileSprite(0, 0, this.width * 2, this.height * 2, 'pattern')
            .setOrigin(0, 0)
            .setScrollFactor(0.1, 0.1)
            .setTint(Constants.SUNNY);
    }

    installatorSprite() {
        const centerX = this.width / 10;
        const centerY = this.height / 2;

        this.spriteInstallator = this.add
            .sprite(centerX, centerY, 'installator_idle')
            .setScale(15*Constants.scaleFactor)
            .setDepth(10);

        this.spriteInstallator.play('idle_installator_idle');
    }

    createField(page) {
        this.BannerX = this.width / 5;
        this.BannerY = this.height / 10;

        this.bannerBackground = this.add.graphics();
        this.bannerBackground.fillStyle(Constants.SUNNY, 1);
        this.bannerBackground.fillRoundedRect(this.BannerX, this.BannerY, this.widthMenu, this.heightMenu)

        this.bannerFrame = this.add.graphics();
        this.bannerFrame.lineStyle(10*Constants.scaleFactor, Constants.BROWN, 1);
        this.bannerFrame.strokeRoundedRect(this.BannerX, this.BannerY, this.widthMenu, this.heightMenu)

        this.writeText(page)
        this.events.emit(this.dictionary[page].action)
        console.log(this.dictionary[page].action)

        this.arrowNext = {x: this.BannerX + this.widthMenu - (50*Constants.scaleFactor), y: this.BannerY + this.heightMenu - (50*Constants.scaleFactor)}
        this.arrowBack = {x: this.BannerX + (50*Constants.scaleFactor), y: this.BannerY + this.heightMenu  - (50*Constants.scaleFactor)}

        this.next = this.add.image(this.arrowNext.x, this.arrowNext.y, 'arrow')
            .setScale(0.4*Constants.scaleFactor)
            .setInteractive({ cursor: 'pointer' });

        this.next.on('pointerdown', () => {
            if (this.isanimation){return}
            page +=1
            this.game.events.emit('turnPage')
            if (page == this.dictionary.length-1){this.next.setVisible(false)}
            else {this.next.setVisible(true)}

            if (page == 0){this.back.setVisible(false)}
            else {this.back.setVisible(true)}

            if (page>(this.dictionary.length-1)){
                console.log('The end, folks')
                page -=1
                return
            }
            this.writeText(page)
            this.events.emit(this.dictionary[page].action)
            console.log(this.dictionary[page].action)
        });

        this.back = this.add.image(this.arrowBack.x, this.arrowBack.y, 'arrow')
            .setScale(0.4*Constants.scaleFactor)
            .setInteractive({ cursor: 'pointer' })
            .setAngle(180)

        if (page == 0){this.back.setVisible(false)}

        this.back.on('pointerdown', () => {
            if (this.isanimation){return}
            page -=1
            this.game.events.emit('turnPage')
            if (page == this.dictionary.length-1){this.next.setVisible(false)}
            else {this.next.setVisible(true)}

            if (page == 0){this.back.setVisible(false)}
            else {this.back.setVisible(true)}

            if (page<(0)){
                console.log('The beginning, folks')
                page +=1
                return
            }
            this.writeText(page)
            this.events.emit(this.dictionary[page].action)
            console.log(this.dictionary[page].action)
        });
    }

    deleteField() {
        if (this.bannerBackground) this.bannerBackground.destroy();
        if (this.bannerFrame) this.bannerFrame.destroy();
        if (this.textOnField) this.textOnField.destroy();
        if (this.next) this.next.destroy();
    }

    clearPageContainer() {
        if (this.pageContainer?.destroy) {
            this.pageContainer.destroy();
            this.pageContainer = null;
            console.log('Page container destroyed');
        }
    }

    // First page
    basicPipesMovement(){
        //show pipes
        // itshould be animation i think
        this.clearPageContainer()
        this.showPipes()
        this.tutorialKeys()
    }

    showPipes() {
        this.pageContainer = this.add.container(this.BannerX, this.BannerY);

        const x = this.widthMenu/7
        const y = this.heightMenu*0.7
        const step = this.widthMenu/7

        const items = [
            { x: x, y: y, key: 'source', text: 'Source' },
            { x: x + step, y: y, key: 'sink', text: 'Sink' },
            { x: x + 2*step, y: y, key: 'line', text: 'Pipe\nLine' },
            { x: x + 3*step, y: y, key: 'curv', text: 'Pipe\nCurve' },
            { x: x + 4*step, y: y, key: 'cross', text: 'Pipe\nCross' },
            { x: x + 5*step, y: y, key: 'triple', text: 'Pipe\nTriple' }
        ];

        items.forEach(item => {
            const image = this.add.image(item.x, item.y, item.key)
                .setScale(Constants.scaleFactor)
                .setAngle(0)
                .setDepth(70)

            const text = this.add.text(item.x, item.y + step*0.3, item.text, {
                font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
                fill: '#000000',
                align: 'center'
            }).setOrigin(0.5, 0);

            this.pageContainer.add([image, text]);
        });
    }

    tutorialKeys(){
        const x = this.width/3.5
        const step = 60 * Constants.scaleFactor
        const y = this.heightMenu*0.45 + step

        const keyU = this.add.image(x, this.heightMenu*0.45,'KeyW').setDepth(99).setScale(4*Constants.scaleFactor)
        const keyDo = this.add.image(x, y,'KeyS').setDepth(99).setScale(4*Constants.scaleFactor)
        const keyL = this.add.image(x-step, y,'KeyA').setDepth(99).setScale(4*Constants.scaleFactor)
        const keyR = this.add.image(x+step, y,'KeyD').setDepth(99).setScale(4*Constants.scaleFactor)

        const keySpace = this.add.image(this.width/2.5, y,'KeySpace').setDepth(99).setScale(4*Constants.scaleFactor)
        this.pageContainer.add([keySpace, keyR, keyL, keyDo, keyU]);
    }

    // Second Page
    pipeQueue(){
        this.clearPageContainer()
        this.createQSlots()
    }

    createQSlots(){
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)


        const x = this.widthMenu/5
        const y = this.heightMenu*0.7

        for (let i = 0; i < 4; i++) {
            const offScreenX = x + (i * x);
            const QSlot = this.add.image(offScreenX, y, 'queue_slot').setScale(Constants.scaleFactor).setDepth(10)
            const [type, angle] = this.Graphics.getRandomPipe(1)
            const Pipe = this.add.image(offScreenX, y, type).setScale(Constants.scaleFactor*1.5).setDepth(11).setAngle(angle)

            this.pageContainer.add([QSlot, Pipe])
        }
        const arrow = this.add.image(x + 3*x, y*1.2, 'arrow').setScale(0.4*Constants.scaleFactor).setDepth(11).setAngle(270).setTint(Constants.RED)
        const text = this.add.text(
            x + 3*x,
            y*1.3,
            'Next Pipe',
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: "#000000", align: "center" }
        ).setOrigin(0.5)

        this.pageContainer.add([arrow, text])
    }

    // 3 Page
    showLevel(){
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        const text = this.add.text(
            this.widthMenu/2,
            this.heightMenu/2,
            'Level:\n1',
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: "#000000", align: "center" }
        ).setOrigin(0.5)
        this.pageContainer.add([text])
    }

    // 4 Page
    timerShow(){
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        const timer = this.add.text(
            this.widthMenu/2,
            this.heightMenu/2,
            '01:00',
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: "#000000", align: "center" }
        ).setOrigin(0.5)
        const keyEnter = this.add.image(this.widthMenu/2, this.heightMenu*0.6,'KeyEnter').setDepth(99).setScale(4*Constants.scaleFactor)
        this.pageContainer.add([timer, keyEnter])
    }

    //5 Page
    scoreShow(){
        this.time.removeAllEvents()
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        const text = this.add.text(
            this.widthMenu/2,
            this.heightMenu/1.5,
            'Score:\n100',
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: "#000000", align: "center" }
        ).setOrigin(0.5)
        this.pageContainer.add([text])
    }

    // 6 Page
    waterPercentage(){
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        this.drawPercentage()
        this.drawSourcesCircles()
        this.clearAnimations()
    }

    drawPercentage()
    {
        const plate = this.add.text(
            this.widthMenu/6,
            this.heightMenu*0.65,
            'Hot water\n75 %',
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: '#000000', align: "center" }
        ).setOrigin(0.5).setDepth(70)

        this.pageContainer.add([plate])
    }

    drawSourcesCircles(){
        this.sourceContainer = this.add.container(this.BannerX, this.BannerY)
        let newx = this.widthMenu/2.5

        const circle1 = this.add.circle(newx, this.heightMenu*0.7, 20, Constants.BLUE).setDepth(69).setScale(Constants.scaleFactor*2).setOrigin(0.5)
        const image1 = this.add.image(newx, this.heightMenu*0.7, 'source').setOrigin(0.5)
        .setScale(Constants.scaleFactor*2)
        .setAngle(0)
        .setDepth(71)

        this.pageContainer.add([circle1, image1])

        for(let i=1; i<4; i++){
            newx += this.widthMenu/7
            const circle = this.add.circle(newx, this.heightMenu*0.7, 20, Constants.RED).setDepth(69).setScale(Constants.scaleFactor*2).setOrigin(0.5)
            const image = this.add.image(newx, this.heightMenu*0.7, 'source')
            .setScale(Constants.scaleFactor*2)
            .setAngle(0)
            .setDepth(71)
            .setOrigin(0.5)

            this.pageContainer.add([circle, image])
        }

        const Mouse = this.add.image(this.widthMenu/2, this.heightMenu*0.5,'Mouse').setDepth(99).setScale(4*Constants.scaleFactor)
        this.pageContainer.add([Mouse])
    }

    // 7 Page
    enemyShow(){
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        this.createEnemy()
        const keySpace = this.add.image(this.width/4.5, this.heightMenu*0.8,'KeySpace').setDepth(99).setScale(4*Constants.scaleFactor)
        this.pageContainer.add([keySpace])
    }

    clearAnimations(){
        this.boom_plate?.destroy()
        this.fireSprite?.destroy()
        this.missile?.destroy()
        this.door?.destroy()
        this.door1?.destroy()
    }

    createEnemy() {
        this.clearAnimations()

        this.boom_plate = this.add.text(
            this.widthMenu/2,
            this.heightMenu*0.6,
            `9/10`,
            { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: '#000000', align: "center" }
        ).setOrigin(0.5);
        this.pageContainer.add(this.boom_plate);

        this.fireSprite = this.add.sprite(this.widthMenu/2, this.heightMenu*0.8, 'enemy_fire')
                        .setDepth(50)
                        .setScale(6*Constants.scaleFactor)
        this.pageContainer.add(this.fireSprite);
        
        this.door1 = this.add.sprite(this.widthMenu/2, this.heightMenu*0.8, 'door')
            .setDepth(90)
            .setScale(12*Constants.scaleFactor)
        this.pageContainer.add(this.door1)

        this.door1.setInteractive({cursor: 'pointer'})

        this.door1.on('pointerdown', () => {
            if (this.isanimation) return
            this.isanimation = true
            this.door?.destroy()
            this.back.setVisible(false)
            this.next.setVisible(false)
            this.boom_plate.setText(`10/10`);

            this.door1.play('door_open')
            this.door1.once('animationcomplete', () => {
                this.door?.destroy()
                this.fireSprite.play('enemyShoot');
                this.fireSprite.once('animationcomplete', () => {
                    this.missile = this.add.sprite(this.widthMenu/2, this.heightMenu*0.8, 'missile_fly')
                        .setScale(4*Constants.scaleFactor)
                        .setDepth(94)
                        .play('missileFly');
                    this.pageContainer.add(this.missile);
                    this.tweens.add({
                        targets: this.missile,
                        x: this.widthMenu,
                        y: 0,
                        scale: 0,
                        duration: 3000,
                        rotation: Phaser.Math.DegToRad(90),
                        ease: 'Sinusoidal',
                        onComplete: () => {
                            this.missile.destroy();
                            this.door = this.add.sprite(this.widthMenu/2, this.heightMenu*0.8, 'door')
                                .setDepth(90)
                                .setScale(12*Constants.scaleFactor)
                                .play('door_close');
                            this.door.once('animationcomplete', () => {
                                this.isanimation = false
                                this.back.setVisible(true)
                                this.next.setVisible(true)
                            })
                            this.pageContainer.add(this.door);
                            
                        }
                    });
                });
            })
        });
    }

    // 8 Page
    itemShow(){
        this.time.removeAllEvents()
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
        this.createBPSlotsSeller()
        this.clearAnimations()
    }

    createBPSlotsSeller() {
        const center = this.heightMenu/1.8;
        const sideStep = this.widthMenu/4;

        const tools = [
            { key: 'tool_clock', description: "Sand watch\nAdds 30 sec to Timer\nPress 1 to use"},
            { key: 'tool_screw', description: "Screw tool\nDissasemble the pipe of choice\nPress 2 to use"},
            { key: 'tool_shield', description: "Protector shield\nZero down the boom count\nPress 3 to use"},
        ];

        const descriptionText = this.add.text(this.widthMenu/2+this.BannerX, this.heightMenu, '', {
            font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
            fill: '#000000',
            align: 'center'
        }).setDepth(20).setAlpha(0).setOrigin(0.5, 0.5);

        tools.forEach((tool, index) => {
            const offScreenX = sideStep + index * (sideStep);

            const slot = this.add.image(0, 0, 'bp_slot').setScale(Constants.scaleFactor).setDepth(14).setOrigin(0.5);
            const item = this.add.image(0, 0, tool.key).setScale(0.7*Constants.scaleFactor).setDepth(15).setOrigin(0.5);

            const container = this.add.container(offScreenX, center, [slot, item])
            .setSize(100*Constants.scaleFactor,100*Constants.scaleFactor)
                .setInteractive({ cursor: 'pointer' })
                .setName(`bp_slot_${index}`)
                .setDepth(15);

            container.on('pointerover', () => {
                descriptionText.setText(tool.description).setAlpha(1);
            });
            container.on('pointerout', () => {
                descriptionText.setAlpha(0);
            });

            this.pageContainer.add([container])
        });
    }

    finishTutorial(){
        this.clearPageContainer()
        this.pageContainer = this.add.container(this.BannerX, this.BannerY)
 
        if (this.gameState){
            const textfield2 = this.add.text(
                this.widthMenu/2,
                this.heightMenu/1.8,
                'Back to Game',
                { font: `${Math.round(this.dynamicFontSizeSmall*2)}px PixelFont`, fill: '#000000', align: "center" }
            ).setOrigin(0.5);
            textfield2.setInteractive({cursor: 'pointer'})
            textfield2.on('pointerdown', () => {
                this.game.events.emit('buttonClicks')
                this.game.events.emit('resumeTimer')
                this.onSceneClose()
            })
            this.pageContainer.add([textfield2])
        } else {
            const textfield = this.add.text(
                this.widthMenu/2,
                this.heightMenu/1.8,
                'Back to Menu',
                { font: `${Math.round(this.dynamicFontSizeSmall*2)}px PixelFont`, fill: '#000000', align: "center" }
            ).setOrigin(0.5);
            textfield.setInteractive({cursor: 'pointer'})
            textfield.on('pointerdown', () => {
                this.game.events.emit('buttonClicks')
                this.onSceneClose()
            })
            this.pageContainer.add([textfield])
        }
    }

    writeExitTutorial(){
        const centerX = this.width / 10;
        const centerY = this.height *0.8;
        if (this.gameState){
            const textfield2 = this.add.text(
                centerX,
                centerY,
                'Back to Game',
                { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: '#ffffff', align: "center" }
            ).setOrigin(0.5);
            textfield2.setInteractive({cursor: 'pointer'})
            textfield2.on('pointerdown', () => {
                if (this.isanimation) return;
                this.game.events.emit('buttonClicks')
                this.game.events.emit('resumeTimer')
                this.onSceneClose()
            })

        } else {
            const textfield = this.add.text(
                centerX,
                centerY,
                'Back to Menu',
                { font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`, fill: '#ffffff', align: "center" }
            ).setOrigin(0.5);
            textfield.setInteractive({cursor: 'pointer'})
            textfield.on('pointerdown', () => {
                if (this.isanimation) return;
                this.game.events.emit('buttonClicks')
                this.onSceneClose()
            })

        }
    }

    writeText(page){
        const text = this.dictionary[page].text

        const dynamicFontSize = Math.max(70 * Constants.scaleFactor)


        this.textOnField?.destroy()
        this.textOnField = this.add.text(
            this.BannerX+this.widthMenu/2,
            this.BannerY+this.heightMenu/4,
            text,
            {
                font: `${Math.round(dynamicFontSize)}px PixelFont`,
                fill: '#000000',
                align: "center",
                wordWrap: { width: this.widthMenu*0.9 }
            }
        ).setOrigin(0.5)

    }

    onSceneClose() {
        //TODO does't work
        console.log('Tutorial scene closed.');

        if (this.scene.isPaused('Game')){
            this.scene.resume('Game')
            console.log('launching Game')
        }
        if (this.scene.isPaused('Menu')){
            this.scene.launch('Menu')
            console.log('launching')
        }
        else if(this.scene.isSleeping('Menu'))
        {
            this.scene.run('Menu')
            console.log('running')
        }
        else{
            this.scene.start('Menu')
            console.log('starting')
        }
        this.scene.stop('Tutorial')
    }

}