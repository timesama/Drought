// Filter stuid error in console
const originalConsoleError = console.error;
console.error = function (message, ...args) {
    if (message && message.includes('bootstrap-autofill.js')) {
        return;
    }
    originalConsoleError.apply(console, [message, ...args]);
};

import Phaser from './lib/phaser.js'
import Game from './scenes/Game.js'
import EndGameScene from './scenes/EndGameScene.js'
import Enemy from './scenes/Enemy.js'
import Seller from './scenes/Seller.js'
import Menu from './scenes/Menu.js'
import Pause from './scenes/Pause.js'
import Tutorial from './scenes/Tutorial.js'
import SceneFirst from './scenes/SceneFirst.js'
import SceneTwo from './scenes/SceneTwo.js'
import SceneThree from './scenes/SceneThree.js'
import SceneFour from './scenes/SceneFour.js'
import SceneFive from './scenes/SceneFive.js'
import SceneSix from './scenes/SceneSix.js'
import AudioScene from './scenes/AudioScene.js'

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;


export default new Phaser.Game({
    type: Phaser.AUTO,
    width: screenWidth,
    height: screenHeight,
    scene: [ Menu,  Game, Seller, Tutorial,   EndGameScene, Enemy, SceneFirst, SceneTwo, SceneThree, SceneFour, SceneFive, SceneSix, Pause,AudioScene],
    pixelArt: true,
    parent: 'phaser-container',
    dom: {
        createContainer: true,
    },
    scale: {
        mode: Phaser.Scale.FIT, // Automatically resizes when the window resizes
        autoCenter: Phaser.Scale.CENTER_BOTH // Centers the game
    }
});
