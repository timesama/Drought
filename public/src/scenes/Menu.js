import Phaser from "../lib/phaser.js";
import * as Constants from "../modules/Constants.js"

export default class Menu extends Phaser.Scene{
    constructor() {
        super('Menu')
    }
    preload(){
        this.loadAssets()
        const fontObserver = new FontFaceObserver('PixelFont');
        this.fontLoaded = false;

        fontObserver.load()
            .then(() => {
                this.fontLoaded = true;
            })
            .catch((error) => {
                console.error('Font PixelFont is not loaded', error);
            });
        
    }

    create(){
        if (!this.fontLoaded) {
            this.time.delayedCall(100, this.create, [], this);
            return;
        }       

        this.game.events.emit('menu-started')

        // constants init
        //Field coordiantes and parameters for scene
        this.scaleFactor = Constants.scaleFactor
        this.width = Constants.screenWidth
        this.height = Constants.screenHeight;

        this.dynamicFont = Math.max(80 * this.scaleFactor);
        this.dynamicFont1 = Math.max(50 * this.scaleFactor);

        // functions
        this.createGraphics()
        this.createField()

        // listeners:
        this.clearListeners()
        this.addListeners()
        this.registry.reset()
        this.registry.set('resetLevel', true)

        this.multiPlayerState = false

        if (!this.scene.isActive('AudioScene')) {
            this.scene.launch('AudioScene');
        }
    }

    clearListeners(){
        this.events.off('Solo', this.startSoloGame, this);
        this.events.off('Online', this.startMultiplayerGame, this);
        this.events.off('Tutorial', this.startTutorial, this);

        window.socket.off('playerMove')
        window.socket.off('pipePlaceSent')
        window.socket.off('specialKeyPress')
        window.socket.off('changeTemperature')
        window.socket.off('bothReadyFinishLevel')
        window.socket.off('userDisconnected')
        window.socket.off('deviceTypeMobile')
        window.socket.off('enemySceneStarted')
        window.socket.off("syncTimer")
        window.socket.off("opponentPlace")
        window.socket.off('slaveJoinRoom')
        window.socket.off('roomCreated')
        window.socket.off('joinRoomResponse')

    }

    addListeners(){
        this.events.on('Solo', this.startSoloGame, this);
        this.events.on('Online', this.startMultiplayerGame, this);
        this.events.on('Tutorial', this.startTutorial, this);     
    }

    loadAssets()
    {
        this.load.image('pattern', 'assets/Pattern.png')
        this.load.image('logo', 'assets/Logo.png');
        this.load.image('music', 'assets/Music.png');

    }

    createGraphics(){
        this.add
        .tileSprite(100, 100, this.width*2, this.height*2, 'pattern')
        .setScrollFactor(0.1, 0.1)
        .setTint(Constants.SUNNY)


        //TODO add sprites of installator 1 and 2
        // add dog sprites
        //add falling pipes
    }

    createField() {
        const radius = 20*this.scaleFactor
        const x = this.width/2
        const y = this.height/2

        const widthMenu = 800*this.scaleFactor
        const heightMenu = 1000*this.scaleFactor
        const halfMenux = widthMenu/2
        const halfMenuy = heightMenu/2
        const upperY = y - halfMenuy
        this.BannerX = x - halfMenux
        this.BannerY = y - halfMenuy/3

        // background
        const bannerBackground = this.add.graphics()
        bannerBackground.fillStyle(Constants.SUNNY, 1)
        bannerBackground.fillRoundedRect(this.BannerX, upperY, widthMenu, heightMenu, radius)

        const bannerFrame = this.add.graphics();
        bannerFrame.lineStyle(10*Constants.scaleFactor, Constants.BROWN, 1);
        bannerFrame.strokeRoundedRect(this.BannerX, upperY, widthMenu, heightMenu, radius);

        const step = 200*this.scaleFactor
        this.nameGame = this.add.image(
            x,
            upperY+150*this.scaleFactor,
            'logo'
        ).setScale(4*this.scaleFactor)

        this.soloGame = this.writeTextonMenu(2, 'Solo', x, upperY, step)
        this.onlineGame = this.writeTextonMenu(3, 'Online', x, upperY, step)
        this.onlineGame = this.writeTextonMenu(4, 'Tutorial', x, upperY, step)
    }

    writeTextonMenu(i, text, x, upperY, step){
        const textfield = this.add.text(
            x,
            upperY+step*i,
            text,
            { font: `${Math.round(this.dynamicFont)}px PixelFont`,
            fill: '#000000',
            align: "center" }
        ).setOrigin(0.5);
        textfield.setInteractive({cursor: 'pointer'})
        textfield.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.events.emit(text)
        })
        return textfield
    }

    startSoloGame(){
        this.multiPlayerState = false
        this.registry.set('multiplayer', this.multiPlayerState);
        this.scene.start('SceneFirst')
    }

    startMultiplayerGame() {
        this.multiPlayerState = true
        this.registry.set('multiplayer', this.multiPlayerState);
        const code = this.generateRoomCode();
        
        const width = 250*this.scaleFactor
        const height = 350*this.scaleFactor

        const x = this.BannerX - width -30*this.scaleFactor
        const y = this.BannerY

        const bannerBackground = this.add.graphics();
        bannerBackground.fillStyle(Constants.SUNNY, 1);
        bannerBackground.fillRoundedRect(x,y, width, height);

        const bannerFrame = this.add.graphics();
        bannerFrame.lineStyle(5*this.scaleFactor, Constants.BROWN, 1);
        bannerFrame.strokeRoundedRect(x ,y, width, height);

        window.socket.off('slaveJoinRoom')
        window.socket.once('slaveJoinRoom', () => {
            this.registry.set('role', 'master')
            this.startMultiplayerGameConfirmed();
        })

        this.roomCodeText = this.add.text(x + width / 2, y + height / 4, code, {
            font: `${Math.round(this.dynamicFont1)}px PixelFont`,
            fill: "#000000",
            align: "center"
        }).setOrigin(0.5).setInteractive();

        const inputField = this.add.dom(x + width / 2, y + height / 2).createFromHTML(`
            <input name="roomIdJoin" type="text" placeholder="Enter Room Code" style="
                width:  ${Math.round(180*this.scaleFactor)}px;
                height: ${Math.round(40*this.scaleFactor)}px;
                font-size: ${Math.round(20*this.scaleFactor)}px;
                text-align: center;
                border: ${Math.round(2*this.scaleFactor)}px; solid ${Constants.BROWN.toString(16)};
                border-radius: ${Math.round(10*this.scaleFactor)}px;
                outline: none;
                padding: ${Math.round(5*this.scaleFactor)}px;">
        `);

        const confirmButton = this.add.text(x+width/2, y + height - height/5, 'Confirm', {
            font: `${Math.round(this.dynamicFont1)}px PixelFont`,
            fill: "#000000",
            align: "center"
        }).setOrigin(0.5).setInteractive();

        let roomCreated = false;
        window.socket.off('roomCreated')
        window.socket.once ('roomCreated', () => { roomCreated = true });
        confirmButton.on('pointerdown', () => {
            if (!roomCreated) {
                console.warn('Room not yet created!')
                return;
            }
            this.game.events.emit('buttonClicks')
            const inputCode = inputField.getChildByName("roomIdJoin").value.trim();
            console.log(inputCode)
            window.socket.emit('joinRoom', inputCode)
            confirmButton.input.enabled = false
            window.socket.off('joinRoomResponse')
            window.socket.once('joinRoomResponse', (result) => {
                if (result == 1) {
                    console.log('Correct code! Starting multiplayer game...');
                    this.registry.set('role', 'slave')
                    this.startMultiplayerGameConfirmed();
                } else {
                    console.log('Incorrect code, try again.');
                    this.codeWarning?.destroy()

                    this.codeWarning = this.add.text(
                        x+width/2, y + height*0.65, 
                        'Wrong code', {
                            font: `${Math.round(this.dynamicFont1)}px PixelFont`,
                            fill: "#FF0000",
                            align: "center" 
                    }).setOrigin(0.5).setDepth(99)


                    confirmButton.input.enabled = true
                }
            })
        });

        window.socket.emit('createRoom', code)

    }

    generateRoomCode() {
        const characters = '0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) { //TODO DEBUG
        // for (let i = 0; i < 2; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }

    startMultiplayerGameConfirmed() {
        console.log('Both players are connected! Starting the game...');
        this.scene.start('SceneFirst')
    }

    startTutorial(){
        this.multiPlayerState = false
        this.registry.set('multiplayer', this.multiPlayerState);
        this.scene.start('Tutorial', { param: false })
    }
}