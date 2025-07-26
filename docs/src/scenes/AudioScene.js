import { scaleFactor, BROWN, SUNNY, screenWidth } from '../modules/Constants.js';

export default class AudioScene extends Phaser.Scene {
    constructor() {
        super('AudioScene');
        this.musicMain = null;
        this.musicData = {
            instance: null,
            volume: 0
        };
        this.soundData = {
            instance: null,
            volume: 0
        };
        this.sliderVisible = false;
        this.hoveBROWNOverMusicUI = false;
    }

    preload() {
        this.load.image('music', 'assets/Music.png');
        this.load.image('sound', 'assets/SFX.png');

        // Music
        this.load.audio('audioMenu', 'assets/audio/mainTheme.WAV');
        this.load.audio('audioEnemy', 'assets/audio/enemyTheme.WAV');
        this.load.audio('audioFinal', 'assets/audio/finalTheme.WAV');

        // Sounds
        this.load.audio('placeSound', 'assets/audio/placeSound.wav');
        this.load.audio('boomSound', 'assets/audio/Explosion.wav');
        this.load.audio('missSound', 'assets/audio/missSound.wav');
        this.load.audio('coinSound', 'assets/audio/Coin.wav');
        this.load.audio('itemSound', 'assets/audio/itemSound.wav');
        this.load.audio('temperatureSound', 'assets/audio/temperatureSound.wav');
        this.load.audio('failSound', 'assets/audio/failSound.wav');
        this.load.audio('winSound', 'assets/audio/winSound.wav');
        this.load.audio('clickSound', 'assets/audio/Click.wav');
        this.load.audio('pageSound', 'assets/audio/PageTurn.wav');

        //Speaking
        this.load.audio('installator_sound', 'assets/audio/speak/speakMoti.wav');
        this.load.audio('granny_sound', 'assets/audio/speak/speakGranny.wav');
        this.load.audio('boy_sound', 'assets/audio/speak/speakBoy.wav');
        this.load.audio('enemy_sound', 'assets/audio/speak/speakEnemy.wav');
        this.load.audio('man_sound', 'assets/audio/speak/speakMan.wav');
        this.load.audio('woman_sound', 'assets/audio/speak/speakWoman.wav');
        this.load.audio('installator2_sound', 'assets/audio/speak/speakInstallator2.wav');       
        
    }

    create() {
        this.stateDialog = false
        this.Speaker = null

        this.addMusic()
        this.createMusicUI();
        this.createSoundUI()
        this.addListeners()
        this.updateSoundVolume(); 

        this.musicMain.play({ volume: this.musicData.volume });
    }

    addMusic(){
        this.musicMain = this.sound.add('audioMenu', {
            loop: true,
            volume: this.musicData.volume,
        });

        this.musicData.instance = this.musicMain;

        this.soundPlace = this.sound.add('placeSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundBoom = this.sound.add('boomSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundMiss = this.sound.add('missSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundBuy = this.sound.add('coinSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundUse = this.sound.add('itemSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundTemperature = this.sound.add('temperatureSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.failSound = this.sound.add('failSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.winSound = this.sound.add('winSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundClick = this.sound.add('clickSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundPage = this.sound.add('pageSound', {
            loop: false,
            volume: this.soundData.volume,
        });

        this.soundGranny = this.sound.add('granny_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundInstallator = this.sound.add('installator_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundBoy = this.sound.add('boy_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundEnemy = this.sound.add('enemy_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundMan = this.sound.add('man_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundWoman = this.sound.add('woman_sound', {
            loop: true,
            volume: this.soundData.volume,
        });

        this.soundInstallator2 = this.sound.add('installator2_sound', {
            loop: true,
            volume: this.soundData.volume,
        });
    }

    addListeners(){
        this.clearListeners()
        // console.log('Adding  Audio listeners')

        this.game.events.on('spawnPipeAudio', (type) => {
            // console.log('received event spawn', type)
            if (type === 'place') {
                this.soundPlace.play({ volume: this.soundData.volume });
                // console.log('playPlace')
            } else if (type === 'boom') {
                this.soundBoom.play({ volume: this.soundData.volume });
                // console.log('playBoom')
            }
        })

        this.game.events.on('changetemperatureAudio', () => {
            // console.log('received event temperature change')
            this.soundTemperature.play({ volume: this.soundData.volume });
        })

        this.game.events.on('missedHit', () => {
            // console.log('received event missed pipe')
            this.soundMiss.play({ volume: this.soundData.volume });
        });

        this.game.events.on('buyItem', () => {
            // console.log('received event buy')
            this.soundBuy.play({ volume: this.soundData.volume });
        })

        this.game.events.on('useItem', () => {
            // console.log('received event use item')
            this.soundUse.play({ volume: this.soundData.volume });
        })

        this.game.events.on('turnPage', () => {
            // console.log('received event use item')
            this.soundPage.play({ volume: this.soundData.volume });
        })

        this.game.events.on('buttonClicks', () => {
            // console.log('received event use item')
            this.soundClick.play({ volume: this.soundData.volume });
        })

        this.game.events.on('resultsSound', (winstate) => {
            // console.log('received event result sound')
            if (winstate){
                this.winSound.play({ volume: this.soundData.volume });
            } else {
                this.failSound.play({ volume: this.soundData.volume });
            }
        })


        this.game.events.on('enemy-activated', this.switchToEnemyMusic, this);
        this.game.events.on('enemy-disactivated', this.switchToMainMusic, this);

        this.game.events.on('finalScene-activated', this.switchToFinalMusic, this);
        this.game.events.on('finalScene-disactivated', this.switchToMainMusic, this);

        this.game.events.on('playSoundSpeak', this.playCharacterSound, this);
        this.game.events.on('stopSoundSpeak', this.stopCharacterSound, this);

        this.game.events.on('game-started', this.stopCharacterSound, this)
        this.game.events.on('menu-started', this.stopCharacterSound, this)
        this.game.events.on('pause-started', this.stopCharacterSound, this)
        
    }

    clearListeners(){
        // console.log('Clearing Audio listeners')
        this.game.events.off('spawnPipeAudio')
        this.game.events.off('enemy-activated');
        this.game.events.off('enemy-disactivated');
        this.game.events.off('playSoundSpeak');
        this.game.events.off('stopSoundSpeak');
        this.game.events.off('game-started')
        this.game.events.off('menu-started')
        this.game.events.off('pause-started')
        this.game.events.off('missedHit')
        this.game.events.off('buyItem')
        this.game.events.off('changetemperatureAudio')
        this.game.events.off('useitem')
        this.game.events.off('resultsSound')
        this.game.events.off('turnPage')
        this.game.events.off('buttonClicks')
        // add here scene dialog

    }

    stopCharacterSound() {
        // add here scene dialog
        this.soundGranny.stop()
        this.soundInstallator.stop()
        this.soundEnemy.stop()
        this.soundBoy.stop()
        this.soundMan.stop()
        this.soundWoman.stop()
        this.soundInstallator2.stop()
        this.stateDialog = false
    }

    playCharacterSound(soundKey) {
        this.stateDialog = true
        this.activeSoundKey = soundKey;
        switch (soundKey) {
            case 'granny':
                this.soundGranny.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            case 'installator':
                this.soundInstallator.play({ volume: this.soundData.volume })
                this.Speaker = 'moti'
                break;
            case 'enemy':
                this.soundEnemy.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            case 'boy':
                this.soundBoy.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            case 'man':
                this.soundMan.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            case 'woman':
                this.soundWoman.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            case 'installator2':
                this.soundInstallator2.play({ volume: this.soundData.volume })
                this.Speaker = 'client'
                break;
            default:
                console.error('Sound key not found: ' + soundKey);
                break;
        }
    }

    updateSoundVolume() {
        const sounds = [
            this.soundGranny,
            this.soundInstallator,
            this.soundEnemy,
            this.soundBoy,
            this.soundMan,
            this.soundWoman,
            this.soundInstallator2
        ];
    
        sounds.forEach(sound => {
        sound.setVolume(this.soundData.volume);
        });
    }

    switchMusic(newMusicKey) {
        if (this.musicData.instance) {
            this.tweens.add({
                targets: this.musicData.instance,
                volume: 0,
                duration: 1000,
                onComplete: () => {
                    this.musicData.instance.stop(); 
                    this.playNewMusic(newMusicKey);
                }
            });
        } else {
            this.playNewMusic(newMusicKey);
        }
    }
    
    playNewMusic(musicKey) {
        this.musicMain = this.sound.add(musicKey, {
            loop: true,
            volume: this.musicData.volume,
        });
        this.musicData.instance = this.musicMain;
        this.musicMain.play();
    }

    switchToFinalMusic() {
        this.switchMusic('audioFinal');
    }
    
    switchToEnemyMusic() {
        this.switchMusic('audioEnemy');
    }
    
    switchToMainMusic() {
        this.switchMusic('audioMenu');
    }
    
    createSoundUI() {
        const width = screenWidth;
    
        this.soundButton = this.add.image(width * 0.90, 40, 'sound')
            .setDepth(99)
            .setInteractive({ cursor: 'pointer' })
            .setScale(2 * scaleFactor)
            .setTint(BROWN);
    
        this.soundSliderBg = this.add.rectangle(
            this.soundButton.x,
            this.soundButton.y + 150 * scaleFactor,
            50 * scaleFactor,
            200 * scaleFactor,
            SUNNY
        ).setOrigin(0.5).setDepth(98).setVisible(false).setInteractive();
    
        this.soundSlider = this.add.rectangle(
            this.soundButton.x,
            this.soundButton.y + 225 * scaleFactor,
            50 * scaleFactor,
            50 * scaleFactor,
            BROWN
        ).setOrigin(0.5).setDepth(99).setVisible(false).setInteractive({ cursor: 'pointer' });
    
        this.soundSliderBorder = this.add.rectangle(
            this.soundSliderBg.x,
            this.soundSliderBg.y,
            this.soundSliderBg.width + 4,
            this.soundSliderBg.height + 4,
            BROWN
        ).setOrigin(0.5).setDepth(97).setVisible(false);
    
        const showSlider = () => {
            this.hoverOverSoundUI = true;
            this.soundSlider.setVisible(true);
            this.soundSliderBg.setVisible(true);
            this.soundSliderBorder.setVisible(true);
        };
    
        const hideSlider = () => {
            this.hoverOverSoundUI = false;
            this.time.delayedCall(1000, () => {
                if (!this.hoverOverSoundUI) {
                    this.soundSlider.setVisible(false);
                    this.soundSliderBg.setVisible(false);
                    this.soundSliderBorder.setVisible(false);
                }
            });
        };
    
        [this.soundButton, this.soundSlider, this.soundSliderBg].forEach(elem => {
            elem.on('pointerover', showSlider);
            elem.on('pointerout', hideSlider);
        });
    
        this.input.setDraggable(this.soundSlider);
    
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.soundSlider) {
                const minY = this.soundSliderBg.y - 75 * scaleFactor;
                const maxY = this.soundSliderBg.y + 75 * scaleFactor;
                const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
                gameObject.y = clampedY;
    
                const range = maxY - minY;
                const volume = Phaser.Math.Clamp(1 - (clampedY - minY) / range, 0, 1);
                this.soundData.volume = volume;
                this.updateSoundVolume();
            }

            if (this.soundData.volume > 0){
                this.soundButton.setTint(SUNNY)
            } else {
                this.soundButton.setTint(BROWN)
            }
        });
    
        this.soundSliderBg.on('pointerdown', (pointer) => {
            this.game.events.emit('buttonClicks')
            const minY = this.soundSliderBg.y - 75 * scaleFactor;
            const maxY = this.soundSliderBg.y + 75 * scaleFactor;
            const clampedY = Phaser.Math.Clamp(pointer.worldY, minY, maxY);
            this.soundSlider.y = clampedY;
    
            const range = maxY - minY;
            const volume = Phaser.Math.Clamp(1 - (clampedY - minY) / range, 0, 1);
            this.soundData.volume = volume;
            this.updateSoundVolume();

            if (this.soundData.volume > 0){
                this.soundButton.setTint(SUNNY)
            } else {
                this.soundButton.setTint(BROWN)
            }
        });
    }

    createMusicUI() {
        const width = screenWidth;
    
        this.musicButton = this.add.image(width * 0.95, 40, 'music')
            .setDepth(99)
            .setInteractive({ cursor: 'pointer' })
            .setScale(2 * scaleFactor)
            .setTint(BROWN);
    
        this.volumeSliderBg = this.add.rectangle(
            this.musicButton.x,
            this.musicButton.y + 150 * scaleFactor,
            50 * scaleFactor,
            200 * scaleFactor,
            SUNNY
        ).setOrigin(0.5).setDepth(98).setVisible(false).setInteractive();
    
        this.volumeSlider = this.add.rectangle(
            this.musicButton.x,
            this.musicButton.y + 225 * scaleFactor,
            50 * scaleFactor,
            50 * scaleFactor,
            BROWN
        ).setOrigin(0.5).setDepth(99).setVisible(false).setInteractive({ cursor: 'pointer' });
    
        this.volumeSliderBorder = this.add.rectangle(
            this.volumeSliderBg.x,
            this.volumeSliderBg.y,
            this.volumeSliderBg.width + 4,
            this.volumeSliderBg.height + 4,
            BROWN
        ).setOrigin(0.5).setDepth(97).setVisible(false);
    
        const showSlider = () => {
            this.hoverOverMusicUI = true;
            this.volumeSlider.setVisible(true);
            this.volumeSliderBg.setVisible(true);
            this.volumeSliderBorder.setVisible(true);
        };
    
        const hideSlider = () => {
            this.hoverOverMusicUI = false;
            this.time.delayedCall(1000, () => {
                if (!this.hoverOverMusicUI) {
                    this.volumeSlider.setVisible(false);
                    this.volumeSliderBg.setVisible(false);
                    this.volumeSliderBorder.setVisible(false);
                }
            });
        };
    
        [this.musicButton, this.volumeSlider, this.volumeSliderBg].forEach(elem => {
            elem.on('pointerover', showSlider);
            elem.on('pointerout', hideSlider);
        });
    
        this.input.setDraggable(this.volumeSlider);
    
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.volumeSlider) {
                const minY = this.volumeSliderBg.y - 75 * scaleFactor;
                const maxY = this.volumeSliderBg.y + 75 * scaleFactor;
                const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
                gameObject.y = clampedY;
    
                const range = maxY - minY;
                const volume = Phaser.Math.Clamp(1 - (clampedY - minY) / range, 0, 1);
                this.musicMain.setVolume(volume);
                this.musicData.volume = volume;
            }

            if (this.musicData.volume > 0){
                this.musicButton.setTint(SUNNY)
            } else {
                this.musicButton.setTint(BROWN)
            }
        });
    
        this.volumeSliderBg.on('pointerdown', (pointer) => {
            // this.game.events.emit('buttonClicks')
            const minY = this.volumeSliderBg.y - 75 * scaleFactor;
            const maxY = this.volumeSliderBg.y + 75 * scaleFactor;
            const clampedY = Phaser.Math.Clamp(pointer.worldY, minY, maxY);
            this.volumeSlider.y = clampedY;
    
            const range = maxY - minY;
            const volume = Phaser.Math.Clamp(1 - (clampedY - minY) / range, 0, 1);
            this.musicMain.setVolume(volume);
            this.musicData.volume = volume;
            
            if (this.musicData.volume > 0){
                this.musicButton.setTint(SUNNY)
            } else {
                this.musicButton.setTint(BROWN)
            }
        });
    }        
}

/*
Todo:
add sounds for the seller appearence

the music for the end scene.

*/
