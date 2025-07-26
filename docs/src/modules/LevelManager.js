export default class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.level = 1;
        const delimeter = this.scene.multiPlayerState==true ? 1 : 1 //TODO it inits before the multiplayer state, lol
        console.log(delimeter)

        this.levelData = [
            {
                background: 'background1',
                time: 300/delimeter,
                sourceCoords: [
                    { x: 5, y: 0, angle: 180 }
                ],
                sinkCoords: { x: 5, y: 6 },
                sinkAngle: 0,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line"],
                tiletype: 'tile1',
                percentage_hot: 0,
                enemy: false,
                blockCoords: []
            },
            {
                background: 'background2',
                time: 300/delimeter,
                sourceCoords: [
                    { x: 0, y: 0, angle: 90 },
                    { x: 10, y: 0, angle: 270 },
                ],
                sinkCoords: { x: 5, y: 6 },
                sinkAngle: 0,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line", "triple"],
                tiletype: 'tile2',
                percentage_hot: 50,
                enemy: false,
                blockCoords: []
            },
            {
                background: 'background3',
                time: 300/delimeter,
                sourceCoords: [
                    { x: 0, y: 5, angle: 90 },
                    { x: 10, y: 1, angle: 270 },
                ],
                sinkCoords: { x: 5, y: 3 },
                sinkAngle: 180,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line", "triple"],
                tiletype: 'tile3',
                percentage_hot: 0,
                enemy: true,
                blockCoords: []
            },
            {
                background: 'background4',
                time: 300/delimeter,
                sourceCoords: [
                    { x: 0, y: 1, angle: 90 },
                    { x: 0, y: 6, angle: 0 },
                    { x: 10, y: 0, angle: 180 },
                    { x: 10, y: 5, angle: 270 },
                ],
                sinkCoords: { x: 5, y: 3 },
                sinkAngle: 90,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line", "triple"],
                tiletype: 'tile4',
                percentage_hot: 25,
                enemy: true,
                blockCoords: [
                    {x: 2, y: 2, angle: 0},
                    {x: 2, y: 3, angle: 0},
                    {x: 2, y: 4, angle: 0},
                    {x: 2, y: 5, angle: 0},
                    {x: 2, y: 6, angle: 0},
                    {x: 8, y: 0, angle: 0},
                    {x: 8, y: 1, angle: 0},
                    {x: 8, y: 2, angle: 0},
                    {x: 8, y: 3, angle: 0},
                    {x: 8, y: 4, angle: 0},
                ]
            },
            {
                background: 'background5',
                time: 400/delimeter,
                sourceCoords: [
                    { x: 1, y: 0, angle: 270 },
                    { x: 1, y: 6, angle: 270 },
                    { x: 4, y: 3, angle: 270 },
                    { x: 6, y: 3, angle: 90 },
                    { x: 9, y: 0, angle: 90 },
                    { x: 9, y: 6, angle: 90 },
                ],
                sinkCoords: { x: 5, y: 3 },
                sinkAngle: 180,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line", "triple"],
                tiletype: 'tile5',
                percentage_hot: 50,
                enemy: true,
                blockCoords: [
                    {x: 4, y: 0, angle: 0},
                    {x: 4, y: 1, angle: 0},
                    {x: 4, y: 4, angle: 0},
                    {x: 4, y: 5, angle: 0},
                    {x: 4, y: 6, angle: 0},
                    {x: 6, y: 1, angle: 0},
                    {x: 6, y: 2, angle: 0},
                    {x: 6, y: 4, angle: 0},
                    {x: 6, y: 5, angle: 0}
                ]
            },
            {
                background: 'background6',
                time: 500/delimeter,
                sourceCoords: [
                    { x: 0, y: 3, angle: 0 },
                    { x: 0, y: 4, angle: 180 },
                    { x: 5, y: 0, angle: 180 },
                    { x: 4, y: 0, angle: 180 },
                    { x: 5, y: 6, angle: 0 },
                    { x: 6, y: 6, angle: 0 },
                    { x: 10, y: 3, angle: 0 },
                    { x: 10, y: 4, angle: 180 },
                ],
                sinkCoords: { x: 5, y: 3 },
                sinkAngle: 270,
                sinktype: 'sink',
                pipesAvailable: ["curv", "cross", "line", "triple"],
                tiletype: 'tile6',
                percentage_hot: 75,
                enemy: true,
                blockCoords: [
                    {x: 2, y: 1, angle: 0},
                    {x: 3, y: 2, angle: 0},
                    {x: 4, y: 2, angle: 0},
                    {x: 5, y: 2, angle: 0},
                    {x: 6, y: 2, angle: 0},
                    {x: 7, y: 2, angle: 0},
                    {x: 8, y: 1, angle: 0},
                    {x: 1, y: 5, angle: 0},
                    {x: 7, y: 5, angle: 0},
                    {x: 7, y: 6, angle: 0},
                    {x: 9, y: 5, angle: 0}
                ]
            }
        ]
    }

    increaseLevel() {
        this.level += 1;
        console.log(`New Level ${this.level}`);
        this.scene.registry.set('level', this.level)

        if (this.level > 6){
            // console.log(`Game over`);
            this.level = 1
            this.scene.registry.set('level', this.level)
        }
    }

    resetLevels() {
        this.level = 1;
    }

    getLevel() {
        return this.level;
    }
}
