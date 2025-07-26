import Phaser from "../lib/phaser.js";
import * as Constants from "../modules/Constants.js"

const frameWidth = 32
const frameHeight = 32

export default class SceneFour extends Phaser.Scene{
    constructor(){
        super('SceneFour')
    }
    preload(){
        this.loadAssets()
    }

    create(){
        this.multiPlayerState = this.registry.get('multiplayer')

        this.loadAnimation()
        this.scaleFactor = Constants.scaleFactor
        this.width = Constants.screenWidth
        this.height = Constants.screenHeight

        this.dynamicFont = Math.max(80*this.scaleFactor)
        this.dynamicFont1 = Math.max(40*this.scaleFactor)

        this.createbackground()
        this.createDictionary()

        this.page = 0
        this.animateText()
        this.createSkipButton()
        this.pauseButton()
        this.tutorialKeys()

        if (this.multiPlayerState){
            window.socket.off('bothReadySkip')
            window.socket.once('bothReadySkip', () => {
                this.closeScene()
            })
        }


        window.socket.off('userDisconnected')
        window.socket.once('userDisconnected', () => {
            window.socket.off('bothReadySkip')
            this.scene.start('Menu')
            this.scene.stop('SceneFour')
        })
    }

    loadAssets(){
        this.load.image('pattern', 'assets/Pattern.png')
        this.load.image('pause', 'assets/Question.png');
        this.load.image('music', 'assets/Music.png');

        this.load.image('block', 'assets/Block.png');

        this.load.spritesheet('installator_idle', 'assets/spritesheet/Installator_idle.png', {
            frameWidth,
            frameHeight
        });

        this.load.spritesheet('Man_idle', 'assets/spritesheet/Man_idle.png', {
            frameWidth,
            frameHeight
        });

    }

    loadAnimation(){
        this.anims.create({
            key: 'installator_idle',
            frames: this.anims.generateFrameNumbers('installator_idle', {start:0, end:1}),
            frameRate: 4,
            repeat: -1
        })

        this.anims.create({
            key: 'Man_idle',
            frames: this.anims.generateFrameNumbers('Man_idle', {start:0, end:1}),
            frameRate: 4,
            repeat: -1
        })
    }

    createbackground(){
        this.add
            .tileSprite(100,100,this.width*2, this.height*2, 'pattern')
            .setScrollFactor(0.1, 0.1)

        this.installatorAnimation(this.width/6, this.height/2)
        this.grannyAnimation(this.width*0.8, this.height/2)
    }

    tutorialKeys(){
        const block = this.add.image(this.width/2, this.height * 0.2,'block').setDepth(99).setScale(1*Constants.scaleFactor)

        this.textPlace = this.add.text(
            this.width/2,
            this.height * 0.3,
            'Block',
            {
                font: `${Math.round(this.dynamicFont1*2)}px PixelFont`,
                fill: "#ffffff",
                align: "center"
            }
        ).setOrigin(0.5)

    }

    installatorAnimation(x,y){
        this.installatorSprite = this.add.sprite(x,y, 'installator_idle')
        .setScale(10*this.scaleFactor)
        .setDepth(10)
    }

    grannyAnimation(x,y){
        this.grannySprite = this.add.sprite(x,y, 'Man_idle')
        .setScale(10*this.scaleFactor)
        .setDepth(10)
        .setFlipX(true)
    }

    createDictionary(){
        this.Dictionary = [
            {
                text: "I am so gratefull that you agreed to do this job! The sand is very hard to build on.",
                speaker: 'client'
            },
            {
                text: "I see, there are only few hard stones that I cannot build on.",
                speaker: 'moti'
            },
            {
                text: "Exactly!",
                speaker: 'client'
            },
            {
                text: "May I ask why do you need sea water?",
                speaker: 'moti'
            },
            {
                text: "...",
                speaker: 'client'
            },
            {
                text: "OK. I will just start working.",
                speaker: 'moti'
            },
        ]
    }

    writeText(text){
        this.textOntheField?.destroy()

        this.textOntheField = this.add.text(
            this.width/2,
            this.height/2,
            text,
            {
                font: `${Math.round(this.dynamicFont)}px PixelFont`,
                fill: "#ffffff",
                align: "center",
                wordWrap: {width: this.width*0.7 -this.width/5 }
            }
        ).setOrigin(0.5)
        .setInteractive({cursor: "pointer"})
    }

    animateText(){
        const text = this.Dictionary[this.page].text
        const speaker = this.Dictionary[this.page].speaker
        this.writeText('')

        let isTyping = true
        let index = 0

        const addNextLetter = () => {
            if (index < text.length && isTyping) {
                this.textOntheField.text += text[index]
                index++
                this.time.delayedCall(30, addNextLetter, [], this)
            }
            else {
                this.game.events.emit('stopSoundSpeak')
                isTyping = false
            }
        }

        const createNextButton = () => {
            const buttonWidth = 300*this.scaleFactor;
            const buttonHeight = 100*this.scaleFactor;
            const buttonX = this.width/6;
            const buttonY = this.height*0.7;
    
            this.Nextbutton = this.add.graphics();
            this.Nextbutton.fillStyle(Constants.BLACK, 1)
            this.Nextbutton.fillRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10*this.scaleFactor); // Rounded button
            this.Nextbutton.lineStyle(5*this.scaleFactor, Constants.WHITE);
            this.Nextbutton.strokeRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10);
    
            const buttonText = this.add.text(buttonX, buttonY+buttonHeight/2, 'Next', {
                font: `${Math.round(this.dynamicFont)}px PixelFont`,
                fill: '#ffffff',
                align: 'center',
                backgroundColor: '#000000'
            });
            buttonText.setOrigin(0.5);
    
            const hitArea = new Phaser.Geom.Rectangle(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight);
                this.Nextbutton.setInteractive({
                hitArea: hitArea,
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true
            });
    
            this.Nextbutton.setDepth(100);
            buttonText.setDepth(100);
        }

        addNextLetter()
        createNextButton()

        if (speaker === 'client'){
            this.grannySprite.play('Man_idle')
            this.installatorSprite.anims.stop(true)
            this.game.events.emit('playSoundSpeak', 'man')
        }
        else if (speaker === 'moti'){
            this.installatorSprite.play('installator_idle')
            this.game.events.emit('playSoundSpeak', 'installator')
            this.grannySprite.anims.stop(true)
        }

        this.textOntheField.on('pointerdown', () => {
            this.game.events.emit('stopSoundSpeak')
            if (isTyping) {
                let remainText = text.slice(index)
                this.textOntheField.text += remainText

                isTyping = false
            }
            else {
                this.nextPage()
            }
        })

        this.Nextbutton.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.game.events.emit('stopSoundSpeak')
            if (isTyping) {
                let remainText = text.slice(index)
                this.textOntheField.text += remainText

                isTyping = false
            }
            else {
                this.nextPage()
            }
        })
    }

    nextPage(){
        this.page +=1
        if (this.page > (this.Dictionary.length - 1)){
            if (this.multiPlayerState) {

                this.textSkipReady?.destroy()
                this.textSkipReady = this.add.text(this.width/2, this.height/2 + 150 * this.scaleFactor, '1/2', {
                    font: `${Math.round(this.dynamicFont)}px PixelFont`,
                    fill: '#ffffff',
                    align: 'center'
                });
                this.textSkipReady.setOrigin(0.5)

                window.socket.emit('btnPressed', 'Skip');
            } else {
                this.closeScene()
            }
            return
        }
        this.animateText()
    }

    createSkipButton(){
        const buttonWidth = 300*this.scaleFactor;
        const buttonHeight = 100*this.scaleFactor;
        const buttonX = this.width*0.8;
        const buttonY = this.height*0.7;

        const button = this.add.graphics();
        button.fillStyle(Constants.BLACK, 1)
        button.fillRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10*this.scaleFactor); // Rounded button
        button.lineStyle(5*this.scaleFactor, Constants.WHITE); // BROWN border
        button.strokeRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10);

        const buttonText = this.add.text(buttonX, buttonY+buttonHeight/2, 'Skip', {
            font: `${Math.round(this.dynamicFont)}px PixelFont`,
            fill: '#ffffff',
            align: 'center'
        });
        buttonText.setOrigin(0.5);

        const hitArea = new Phaser.Geom.Rectangle(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight);
                    button.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        button.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            if (this.multiPlayerState) {

                this.textSkipReady?.destroy()
                this.textSkipReady = this.add.text(buttonX, buttonY+buttonHeight/2 + 100 * this.scaleFactor, '1/2', {
                    font: `${Math.round(this.dynamicFont)}px PixelFont`,
                    fill: '#ffffff',
                    align: 'center'
                });
                this.textSkipReady.setOrigin(0.5)

                window.socket.emit('btnPressed', 'Skip');
            } else {
                this.closeScene()
            }
        })
        button.setDepth(100);
        buttonText.setDepth(100);
    }

    pauseButton(){
        const pause_button = this.add.image(40,40,'pause').setDepth(99).setInteractive({cursor: 'pointer'}).setScale(2*Constants.scaleFactor)
        pause_button.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.scene.launch('Pause', { param: 'SceneFour' })

            if (!this.multiPlayerState) {this.scene.pause('SceneFour')}
        })
    }

    closeScene(){
        this.scene.stop('SceneFour')
        this.scene.start('Game')
    }
}