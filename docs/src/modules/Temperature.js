/*
    In this class:

*/
import { scaleFactor, FIRST_PIPE_X, FIRST_PIPE_Y, ONE_STEP, LEFT_DOWN_CORNER,
    RED, BLACK, BLUE, TRANSPARENT, GREEN, WHITE,
    HORIZ_CELLS_COUNT,  VERT_CELLS_COUNT,
    convertCellXYToPixelXY} from '././Constants.js';

export default class Temperature {
    constructor(scene) {
        this.scene = scene;
        if (this.scene.block) {
            return;
        }

        this.assign_temperature_initial()

        this.scene.events.once('endLevel', this.level_end, this)
        this.scene.events.on('circleClicked', this.change_temperature, this)
    }

    calculate_percentage(hot, cold){
        let percentage = 100*hot/(hot+cold)
        // console.log(`percentage is ${percentage} of hot water`)
        return percentage
    }

    returnCurrentPercentage(){
        let hot = 0
        let cold = 0
        this.sourceCoordinates.forEach((source) => {
            if (source[2] === true){
                hot += 1
            } else{
                cold += 1
            }
        })

        const percentage_real = Math.round(this.calculate_percentage(hot, cold))
        return percentage_real
    }

    level_end(data){
        let hot = 0
        let cold = 0
        this.sourceCoordinates.forEach((source) => {
            if (source[2] === true){
                hot += 1
            } else{
                cold += 1
            }
        })
        const percentage_real = this.calculate_percentage(hot, cold)
        // console.log('how much there is: ', percentage_real)
        const currentLevelData = this.scene.levelManager.levelData[this.level - 1]
        const percentage_to_win = currentLevelData.percentage_hot
        // console.log('how much to win: ', percentage_to_win)

        this.scene.temperatureRight = (percentage_real === percentage_to_win);

        if (this.scene.LogicConnection.isPipesConnected) {
            if (percentage_real == percentage_to_win){
                this.scene.lvlWon = true
                console.log('Game won by percentage')
            } else{
                this.scene.lvlWon = false
                console.log('Game lost by percentage')
            }
        }else{
            this.scene.lvlWon = false
            console.log('Pipies are not connected')
        }
    }

    checkTempTutorial(data){
            let hot = 0
            let cold = 0
            this.sourceCoordinates.forEach((source) => {
                if (source[2] === true){
                    hot += 1
                } else{
                    cold += 1
                }
            })

            const percentage_real = this.calculate_percentage(hot, cold)

            const currentLevelData = this.scene.levelManager.levelData[this.level - 1]
            const percentage_to_win = currentLevelData.percentage_hot
            // console.log('how much to win: ', percentage_to_win)

            if (percentage_real == percentage_to_win){
                this.scene.lvlWon = true
                // console.log('Game won by percentage')
                this.scene.events.emit('ZeroHot')
            }else{
                this.scene.lvlWon = false
                // console.log('Game lost by percentage')
            }
    }

    change_temperature(data) {
        if (this.scene.block) return

        console.log('Changing temperature')

        const { x, y, hot } = data;

        const index = this.sourceCoordinates.findIndex((coord) =>
            coord[0] === x && coord[1] === y
        );

        if (index !== -1) {
            this.sourceCoordinates[index][2] = !this.sourceCoordinates[index][2];
            // console.log('Updated matrix:', this.sourceCoordinates);
        } else {
            // console.log('No matching coordinates found.');
        }
    }

    assign_temperature_initial(){
        this.level = this.scene.levelManager.level
        const currentLevelData = this.scene.levelManager.levelData[this.level - 1]
        this.sourceCoordinates = []
        currentLevelData.sourceCoords.forEach((source) => {
            const coordinates = [source.x, source.y]
            this.sourceCoordinates.push([...coordinates, true]) // true - initially hot
        })
        this.sinkCoordinates = [currentLevelData.sinkCoords.x, currentLevelData.sinkCoords.y]
    }

    draw_circle_initial(){
        this.sourceCoordinates.forEach((coord) => {
            let x = coord[0]
            let y = coord[1]
            let hot = true

            this.drawCircle(x,y,hot)
        })
    }

    drawCircle(x, y, hot) {
        let color = BLUE
        if (hot) {
            color = RED
        }
        else {
            color = BLUE
        }
        const radius = 20*scaleFactor;

        const [x_px, y_px] = convertCellXYToPixelXY(x, y)

        const circleTemperature = this.scene.add.circle(x_px, y_px, radius, color);
        circleTemperature.setDepth(3)
        circleTemperature.setInteractive({ cursor: 'pointer' });

        circleTemperature.on('pointerdown', () => {
            if (this.scene.block) return
            hot = !hot
            this.scene.game.events.emit('changetemperatureAudio')

            const newColor = hot ? RED : BLUE;
            circleTemperature.setFillStyle(newColor);

            if (this.scene.multiPlayerState)
            {this.scene.socket.emit('changeTemperature', {x, y, hot})}
            this.scene.events.emit('circleClicked', { x, y, hot });
        });
    }

}