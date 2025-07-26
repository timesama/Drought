import Phaser from '../lib/phaser.js';

import {scaleFactor, screenWidth, screenHeight} from '../modules/Constants.js'

export default class EndGameScene extends Phaser.Scene {
    constructor() {
        super('EndGameScene');
    }

    preload(){
        const frameWidth = 32
        const frameHeight = 32

        this.load.image('pattern', 'assets/Pattern.png')

        this.load.spritesheet('installator_jump', 'assets/spritesheet/Installator_jump.png', {
            frameWidth,
            frameHeight
        });

        this.game.events.emit('finalScene-activated')
    }

    create() {
        this.socket = window.socket;
        this.multiPlayerState = this.registry.get('multiplayer')
        this.role = this.registry.get('role')
        this.width = screenWidth;
        this.height = screenHeight;
        this.onehalf = 150 * scaleFactor

        this.dynamicFont = Math.max(10*scaleFactor)

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('installator_jump', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.createBackground()
        this.createText()
        this.createButton()

        this.installatorSprite()
        this.testers()

        if (!this.multiPlayerState || this.role == 'master'){
            this.createNicknameInput()
        } else{
            this.waitText?.destroy()
            this.waitText = this.add.text(this.width / 2, this.height * 0.35, 'Wait for the host to add nicknames...', {
                font: `${Math.round(this.dynamicFont*5)}px PixelFont`,
                fill: '#ffffff',
                align: 'center',
            }).setOrigin(0.5);
        }
        

        this.socket.off('showScores')
        this.socket.on('showScores', (data) => { //TODO: ONCE?
            console.log('received scores from the server', data)
            this.waitText?.destroy()
            this.highScores = data.topScores;
            this.playerRank = data.playerRank;
            this.playerEntry = data.newScore;

            if (!this.multiPlayerState || this.role == 'master'){
                this.nicknameInput.destroy();
                this.okButton.destroy();
            }
            this.scoreText.destroy()
            this.drawHighScores();

        })
    }

    createButton(){
        // Restart button
        const menuWidth = 400*scaleFactor
        const menuHeight = 80*scaleFactor
        const menuButton = this.add.graphics();
        const menuButtonX = this.width / 2 - menuWidth/2;
        const menuButtonY = this.height * 0.9;

        menuButton.fillStyle(0x000000, 0.8);
        menuButton.fillRoundedRect(menuButtonX, menuButtonY, menuWidth, menuHeight, 10*scaleFactor);

        const returnMenuText = this.add.text(this.width / 2, menuButtonY + menuHeight/2, 'Return to Menu', {
            font: `${Math.round(this.dynamicFont*5)}px PixelFont`,
            fill: '#ffffff',
            align: 'center',
        }).setOrigin(0.5).setInteractive({cursor: 'pointer'})

        returnMenuText.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.scene.stop('EndGameScene');
            this.scene.start('Menu');
            this.game.events.emit('finalScene-disactivated')

            if (this.multiPlayerState){
                window.socket.emit('disconnectMenu')
            }
        });
    }

    createText(){
        this.add.text(this.width / 2, this.height * 0.1, 'Congratulations!', {
            font: `${Math.round(this.dynamicFont*10)}px PixelFont`,
            fill: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(this.width / 2, this.height * 0.12 + this.onehalf, 'You won!', {
            font: `${Math.round(this.dynamicFont*6)}px PixelFont`,
            fill: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);

        if (this.registry.has('Score')){
            this.score = this.registry.get('Score')
        } else {
            this.score = 0
        }

        console.log(this.score)

        this.scoreText = this.add.text(this.width / 2, this.height * 0.3, `Total score: ${this.score}`, {
            font: `${Math.round(this.dynamicFont*5)}px PixelFont`,
            fill: '#ffffff',
            align: 'center',
        }).setOrigin(0.5)

    }

    createBackground(){
        this.background = this.add
            .tileSprite(100, 100, this.width*2, this.height*2, 'pattern')
            .setScrollFactor(0.1, 0.1);

    }

    installatorSprite() {
        this.spriteInstallator = this.add
            .sprite(this.width*0.1, this.height/2, 'installator_jump')
            .setScale(10*scaleFactor)
            .setDepth(10);

        this.spriteInstallator.play('jump');
    }

    update() {
        this.background.tilePositionY += 1;
    }


    testers(){
        this.add.text(this.width *0.12, this.height*0.8, 
        'Special thanks:\nZar\nFljúgandi 🐈Kettlingur\nRareBird\nDaria\nAisling\nLuna L.\nGefen\nAndes', 
        {
            font: `${Math.round(this.dynamicFont*4)}px PixelFont`,
            fill: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
    }

    createNicknameInput() {
        const fontSize = 60 * scaleFactor;
        const inputWidth = 500 * scaleFactor;
        const inputHeight = 80 * scaleFactor;

        const inputX = this.width / 2 - inputWidth/2;
        const inputY = this.height * 0.35;

        this.nicknameInput = this.add.dom(inputX, inputY).createFromHTML(`
            <input type="text" name="nickname" placeholder="Enter your nickname" maxlength="10"
                style="
                    font-size: ${fontSize}px;
                    width: ${inputWidth}px;
                    height: ${inputHeight}px;
                    padding: ${5 * scaleFactor}px;
                    font-family: PixelFont, monospace;
                    text-align: center;
                    border-radius: ${5 * scaleFactor}px;
                    border: none;
                    outline: none;
                "
            />
        `);
        this.nicknameInput.setOrigin(0, 0);

        this.okButton = this.add.text(this.width / 2 + inputWidth/2, inputY, 'OK', {
            font: `${Math.round(this.dynamicFont*6)}px PixelFont`,
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setInteractive({ cursor: 'pointer' });

        this.okButton.on('pointerdown', () => {
            const nickname = this.nicknameInput.getChildByName('nickname').value || 'Anon';
            console.log(nickname)
            this.socket.emit('saveScore', { nickname, score: this.score });
            this.game.events.emit('buttonClicks')
        });
    }

    addScore(nickname, score) {
        const entry = { nickname, score };
        if (!this.highScores) this.highScores = [];

        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);

        this.playerRank = this.highScores.findIndex(e => e.nickname === nickname && e.score === score) + 1;
        this.playerEntry = entry;
    }

    drawHighScores() {
        const startY = this.height *0.3;
        const title = this.add.text(this.width / 2, startY, 'High Scores', {
            font: `${Math.round(this.dynamicFont*9)}px PixelFont`,
            fill: '#ffff00'
        }).setOrigin(0.5);

        const rowHeight = 100* scaleFactor;
        for (let i = 0; i < 5; i++) {
            const entry = this.highScores?.[i] || { nickname: '---', score: 0 };
            this.add.text(this.width / 2 - 300 * scaleFactor, startY + 100 * scaleFactor + i * rowHeight, `${i + 1}.`, {
                font: `${Math.round(this.dynamicFont*7)}px PixelFont`,
                fill: '#ffffff',
                align: 'left'
            }).setOrigin(0, 0.5);

            this.add.text(this.width / 2 - 100* scaleFactor, startY + 100* scaleFactor + i * rowHeight, `${entry.nickname}`, {
                font: `${Math.round(this.dynamicFont*7)}px PixelFont`,
                fill: '#ffffff',
                align: 'left'
            }).setOrigin(0, 0.5);

            this.add.text(this.width / 2 + 300* scaleFactor, startY + 100* scaleFactor + i * rowHeight, `${entry.score}`, {
                font: `${Math.round(this.dynamicFont*7)}px PixelFont`,
                fill: '#ffffff',
                align: 'right'
            }).setOrigin(1, 0.5);
        }

        if (this.playerEntry) {
            this.add.text(this.width / 2, startY + rowHeight*6, `Your place:\n ${this.playerRank}    ${this.playerEntry.nickname}: ${this.playerEntry.score}`, {
                font: `${Math.round(this.dynamicFont*6)}px PixelFont`,
                fill: '#00ff00',
                align: 'center'
            }).setOrigin(0.5);
        }
    }


}
