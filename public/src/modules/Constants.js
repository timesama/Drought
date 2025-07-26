// Constants

// Geometrical constant
// Screen size
const baseWidth = 1935;  // Original design width
const baseHeight = 1100; // Original design height
export const screenWidth = window.innerWidth;
export const screenHeight = window.innerHeight;
export const scaleFactor = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);

export const ONE_STEP = 96 * scaleFactor
export const FIRST_PIPE_X = screenWidth/5
export const FIRST_PIPE_Y = screenHeight/4

export const HORIZ_CELLS_COUNT = 11
export const VERT_CELLS_COUNT = 7

export const LEFT_UP_CORNER = {
    x: FIRST_PIPE_X - ONE_STEP,
    y: FIRST_PIPE_Y - ONE_STEP }
export const RIGHT_UP_CORNER = {
    x: FIRST_PIPE_X + (ONE_STEP * HORIZ_CELLS_COUNT),
    y: FIRST_PIPE_Y - ONE_STEP }
export const LEFT_DOWN_CORNER = {
    x: LEFT_UP_CORNER.x + ONE_STEP,
    y: FIRST_PIPE_Y + (ONE_STEP * VERT_CELLS_COUNT) }
export const RIGHT_DOWN_CORNER = {
    x: RIGHT_UP_CORNER.x,
    y: LEFT_DOWN_CORNER.y }
export const CENTER = {
    x: FIRST_PIPE_X + 5*ONE_STEP,
    y: FIRST_PIPE_Y + 3*ONE_STEP}
export const ENEMY = {
    x: FIRST_PIPE_X - 200 * scaleFactor,
    y: FIRST_PIPE_Y + 6.5 * ONE_STEP}

export const RED = 0xff0000
export const BLACK = 0x000000
export const BLUE = 0x0000FF
export const TRANSPARENT = 0x000000
export const GREEN = 0x00ff00
export const WHITE = 0xFFFFFF
export const SUNNY = 0xF4B073
export const BROWN = 0x964B00
export const YELLOW = 0xFFFF00
export const GREENish = 0x99ff99
export const BLUEish = 0x99ffff

export const convertCellXYToPixelXY = (x, y) => [FIRST_PIPE_X + ONE_STEP * x, FIRST_PIPE_Y + ONE_STEP * y]

export const PIPE_TYPES = {
    "0":  { "type": "nothing", "angle": 0, "matrix": { "up": "fail", "down": "fail", "left": "fail", "right": "fail" }},
    "1":  { "type": "source", "angle": 0, "matrix": { "none": "up",    "up": "fail", "down": "fail", "left": "fail", "right": "fail" }},
    "2":  { "type": "source", "angle": 90,  "matrix": { "none": "right", "up": "fail", "down": "fail", "left": "fail", "right": "fail" }},
    "3":  { "type": "source", "angle": 180,  "matrix": { "none": "down",  "up": "fail", "down": "fail", "left": "fail", "right": "fail" }},
    "4":  { "type": "source", "angle": 270,  "matrix": { "none": "left",  "up": "fail", "down": "fail", "left": "fail", "right": "fail" }},
    "5": { "type": "sink", "angle": 0, "matrix": { "right": "fail", "down": "end", "up": "fail", "left": "fail" }},
    "6": { "type": "sink", "angle": 90, "matrix": { "right": "fail", "down": "fail", "up": "fail", "left": "end" }},
    "7": { "type": "sink", "angle": 180, "matrix": { "right": "fail", "down": "fail", "up": "end", "left": "fail" }},
    "8": { "type": "sink", "angle": 270, "matrix": { "right": "end", "down": "fail", "up": "fail", "left": "fail" }},
    "9":  { "type": "line", "angle": 90,    "matrix": { "right": "fail", "down": "down",       "up": "up",   "left": "fail" }},
    "10": { "type": "line", "angle": 0,    "matrix": { "right": "right", "down": "fail",     "up": "fail",   "left": "left" }},
    "11": { "type": "curv", "angle": 0,    "matrix": { "right": "fail", "down": "fail",    "up": "right",   "left": "down" }},
    "12": { "type": "curv", "angle": 90,    "matrix": { "right": "down", "down": "fail",     "up": "left",   "left": "fail" }},
    "13": { "type": "curv", "angle": 180,    "matrix": { "right": "up",   "down": "left",     "up": "fail",   "left": "fail" }},
    "14": { "type": "curv", "angle": 270,    "matrix": { "right": "fail", "down": "right",     "up": "fail",  "left": "up" }},
    "16": { "type": "cross", "angle": 0,   "matrix": { "right": "right", "down": "down",       "up": "up",   "left": "left" }},
    "15": { "type": "cross", "angle": 90,   "matrix": { "right": "right", "down": "down",       "up": "up",   "left": "left" }},
    "17": { "type": "triple", "angle": 0,  "matrix": { "right": "down", "down": "fail",     "up": "fail",   "left": "down" }},
    "18": { "type": "triple", "angle": 90,  "matrix": { "right": "fail", "down": "left",     "up": "left",   "left": "fail" }},
    "19": { "type": "triple", "angle": 180,  "matrix": { "right": "up",   "down": "fail",     "up": "fail",   "left": "up" }},
    "20": { "type": "triple", "angle": 270,  "matrix": { "right": "fail", "down": "right",    "up": "right",  "left": "fail" }},
    "21": { "type": "store", "angle": 0,   "matrix": { "right": "fail", "down": "down",       "up": "up",   "left": "fail" }},
    "22": { "type": "store", "angle": 90,   "matrix": { "right": "right", "down": "fail",     "up": "fail",   "left": "left" }}
}


