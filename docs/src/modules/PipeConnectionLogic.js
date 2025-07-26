import { HORIZ_CELLS_COUNT, VERT_CELLS_COUNT, PIPE_TYPES } from './Constants.js'

export class LogicConnection {
    constructor(scene) {
        this.scene = scene
        this.isPipesConnected = false

        // this.matrix_pipetypes = Array.from({ length: VERT_CELLS_COUNT }, () => new Array(HORIZ_CELLS_COUNT).fill(0))

    }

    initialize_matrix_pipetypes(){
        this.matrix_pipetypes = Array.from({ length: VERT_CELLS_COUNT }, () => new Array(HORIZ_CELLS_COUNT).fill(0))
    }

    findPipeByTypeAndAngle(type, angle) {
        for (const [key, pipe] of Object.entries(PIPE_TYPES)) {
            if (pipe.type === type && pipe.angle === angle) {
                return parseInt(key)
            }
        }
        return null
    }

    updatePipeMatrix(x, y, type, angle) {
        if (!this.matrix_pipetypes || this.matrix_pipetypes.length === 0) {
            console.error("Source matrices are not initialized. Call findSource() first.")
            return
        }

        // Normalize angle
        if (angle === -90) {
            angle = 270
        } else if (angle === -180) {
            angle = 180
        }

        const pipenumber = this.findPipeByTypeAndAngle(type, angle)
        if (pipenumber === null) {
            return
        }

        if (y >= 0 && y < VERT_CELLS_COUNT && x >= 0 && x < HORIZ_CELLS_COUNT) {
            this.matrix_pipetypes[y][x] = pipenumber
        } else {
        }

        this.scene.registry.set('matrix_pipetypes', this.matrix_pipetypes);
    }

    findSource() {
        const currentLevel = this.scene.levelManager.getLevel();
        const currentLevelData = this.scene.levelManager.levelData[currentLevel - 1];

        this.matrix_pipetypes = Array.from({ length: VERT_CELLS_COUNT }, () => new Array(HORIZ_CELLS_COUNT).fill(0))

        currentLevelData.sourceCoords.forEach((source) => {
            this.matrix_pipetypes[source.y][source.x] = this.findPipeByTypeAndAngle('source', source.angle)
        });

        this.matrix_pipetypes[currentLevelData.sinkCoords.y][currentLevelData.sinkCoords.x] = this.findPipeByTypeAndAngle(currentLevelData.sinktype, currentLevelData.sinkAngle)

    }

    traverse() {
        this.scene.pathConnected = false
        const currentLevel = this.scene.levelManager.getLevel()
        const currentLevelData = this.scene.levelManager.levelData[currentLevel-1]
        const allPaths = {}
        let allSourcesReachEnd = true // state of the loose

        let countIterations = 0
        this.scene.stateInfiniteLoop = false

        currentLevelData.sourceCoords.forEach((source, index) => {
            this.curX = source.x
            this.curY = source.y
            this.curDir = PIPE_TYPES[this.matrix_pipetypes[this.curY][this.curX]].matrix['none']

            const path = [[this.curX, this.curY]]

            while (!(this.curDir === "end" || this.curDir === "fail")) {
                if (this.curDir === "up") this.curY -= 1
                else if (this.curDir === "down") this.curY += 1
                else if (this.curDir === "left") this.curX -= 1
                else if (this.curDir === "right") this.curX += 1
                else {
                    // console.log("NO WAY")
                    break
                }

                // Check if out of bounds
                if (this.curY < 0 || this.curX < 0 || this.curY >= VERT_CELLS_COUNT || this.curX >= HORIZ_CELLS_COUNT) {
                    // console.log(`FAIL: OUT OF LIMITS for Source ${index + 1}`)
                    console.log(path)
                    // return path
                    break
                }

                countIterations = countIterations + 1

                if (countIterations>500){
                    console.log('infinite loop')
                    this.scene.stateInfiniteLoop = true
                    // this.isPipesConnected = false
                    // this.scene.pathConnected = false
                    break
                }

                // Update direction based on the current pipe
                this.curDir = PIPE_TYPES[this.matrix_pipetypes[this.curY][this.curX]].matrix[this.curDir];
                // Add current position to the path
                path.push([this.curX, this.curY])
            }

            // Check final direction and update level status
            if (this.curDir === "end") {
                // console.log(`Source ${index + 1}: Success!`)
            } else {
                // console.log(`Source ${index + 1}: Failed.`)
                allSourcesReachEnd = false
            }

            allPaths[index] = path
            

        })

        this.isPipesConnected = allSourcesReachEnd
        this.scene.pathConnected = allSourcesReachEnd
        return allPaths
    }

}
