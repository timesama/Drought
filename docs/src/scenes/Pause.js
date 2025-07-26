import Phaser from "../lib/phaser.js";
import * as Constants from "../modules/Constants.js"
import Graphics from '../modules/Graphics.js'


export default class Pause extends Phaser.Scene{
    constructor() {
        super('Pause')
        this.Graphics = new Graphics(this)
    }

    preload(){
    }

    create(data){
        this.nameOfPrevScene = data.param

        this.game.events.emit('pause-started')

        // listeners:
        this.events.on('Back to Game', this.goBack, this)
        this.events.on('Back to Menu', this.goBackMenu, this)

        // constants init
        this.width = Constants.screenWidth
        this.height = Constants.screenHeight;

        this.FontSize1 = Math.max(100 * Constants.scaleFactor);
        this.FontSize2 = Math.max(80 * Constants.scaleFactor);

        this.multiPlayerState = this.registry.get('multiplayer')

        this.createField()
        
        window.socket.on('userDisconnected', () => {
            this.clearListeners()
            this.scene.start('Menu')
            this.scene.stop('Pause')
            this.scene.stop(this.nameOfPrevScene)
        })

    }

    clearListeners() {
        this.events.off('Back', this.goBack, this)
        this.events.off('Back to Menu', this.goBackMenu, this)
        window.socket.off('playerMove')
        window.socket.off('playerPlace')
        window.socket.off('specialKeyPress')
        window.socket.off('changeTemperature')
        window.socket.off('userDisconnected')
        window.socket.off('deviceTypeMobile')
        window.socket.off('enemySceneStarted')
        window.socket.off("syncTimer")
    }

    createField() {
        const radius = 20*Constants.scaleFactor
        const x = this.width/2
        const y = this.height/2

        const widthMenu = 700*Constants.scaleFactor
        const heightMenu = 800*Constants.scaleFactor
        const halfMenux = widthMenu/2
        const halfMenuy = heightMenu/2
        const upperY = y - halfMenuy

        this.Graphics.tutorial(x, y, widthMenu, heightMenu)


        // background
        const bannerBackground = this.add.graphics()
        bannerBackground.fillStyle(Constants.SUNNY, 1)
        bannerBackground.fillRoundedRect(x - halfMenux, y - halfMenuy, widthMenu, heightMenu, radius)
        bannerBackground.setAlpha(0.8)

        const bannerFrame = this.add.graphics();
        bannerFrame.lineStyle(10*Constants.scaleFactor, Constants.BROWN, 1);
        bannerFrame.strokeRoundedRect(x - halfMenux, y - halfMenuy, widthMenu, heightMenu, radius);

        const step = 150*Constants.scaleFactor

        this.back = this.writeTextonMenu(1, 'Back to Game', x, upperY, step)
        this.backMenu = this.writeTextonMenu(2, 'Back to Menu', x, upperY, step)

        if (this.multiPlayerState){

            this.warning = this.add.text(
                x,
                upperY+step*5,
                'The game is not paused',
                { 
                font: `${Math.round(this.FontSize2)}px PixelFont`, 
                fill: '#000000', 
                align: "center" 
            }).setOrigin(0.5);
        }
    }

    writeTextonMenu(i, text, x, upperY, step){
        const textfield = this.add.text(
            x,
            upperY+step*i,
            text,
            { 
            font: `${Math.round(this.FontSize2)}px PixelFont`, 
            fill: '#000000', 
            align: "center" 
        }).setOrigin(0.5);

        textfield.setInteractive({cursor: 'pointer'})
        textfield.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            console.log('clicked back')
            this.events.emit(text)
        })
        return textfield
    }

    goBack(){
        this.clearListeners()
        this.scene.resume(this.nameOfPrevScene)
        this.scene.stop('Pause')

        // if (this.nameOfPrevScene == 'Game' && !this.multiPlayerState){
        if (this.nameOfPrevScene == 'Game'){
            this.game.events.emit('resumeTimer')
        }
    }

    goBackMenu(){
        this.registry.reset()
        this.clearListeners()
        if (this.scene.isPaused('Menu')){
            this.scene.launch('Menu')
        }
        else if(this.scene.isSleeping('Menu'))
        {
            this.scene.run('Menu')
        }
        else{
            this.scene.start('Menu')
        }
        this.scene.stop('Game')
        this.scene.stop('Enemy')
        this.scene.stop('Seller')
        this.scene.stop('Tutorial')
        this.scene.stop('Pause')
        this.scene.stop('SceneFirst')
        this.scene.stop('SceneTwo')
        this.scene.stop('SceneThree')
        this.scene.stop('SceneFour')
        this.scene.stop('SceneFive')
        this.scene.stop('SceneSix')
        this.events.emit('backToMenu')
        

        if (this.multiPlayerState){
            window.socket.emit('disconnectMenu')
        }
    }
}