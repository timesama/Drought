import Phaser from '../lib/phaser.js'
import * as Constants from '../modules/Constants.js'

export default class Seller extends Phaser.Scene
{
    coord
    widthMenu
    heightMenu

    constructor()
    {
        super('Seller')
    }
    create()
    {   console.log('starting Seller')
        //Field coordiantes and parameters for scene
        this.scaleFactor = Constants.scaleFactor
        this.width = Constants.screenWidth
        this.height = Constants.screenHeight;

        this.add
            .tileSprite(100, 100, this.width*2, this.height*2, 'pattern')
            .setScrollFactor(0.1, 0.1)
            .setTint(Constants.BROWN)

        this.widthMenu = this.width - (800*this.scaleFactor)
        this.heightMenu = this.height -  (300*this.scaleFactor);
        this.BannerX = this.width / 5;
        this.BannerY = this.height / 10;
        this.coord = {x: 200* this.scaleFactor, y: 100* this.scaleFactor}
        this.dynamicFontSizeSmall = Math.max(40 * this.scaleFactor); // Prevents text from being too small

        // States

        //Get Data
        this.score = this.registry.get('Score')
        this.multiPlayerState = this.registry.get('multiplayer')

        // FUnctions init
        this.createField()

        this.price_clock = 100
        this.price_screw = 200
        this.price_shield = 300

        if (this.multiPlayerState){
            window.socket.off('buyItem')
            window.socket.on('buyItem', (data) => {
                this.checkPriceScore(data.tool, data.index)
            });
            window.socket.off('bothReadySeller')
            window.socket.on('bothReadySeller', () => {
                this.closeScene()
            })
        }

        window.socket.off('userDisconnected')
        window.socket.on('userDisconnected', () => {
            window.socket.off('bothReadySeller')
            this.scene.start('Menu')
            this.scene.stop('Seller')
            this.scene.stop('Game')
        })
        this.pauseButton()
    }

    createField() {
        
        const radius = 20*this.scaleFactor
        const x = this.widthMenu / 2 + this.BannerX
        const y = this.heightMenu / 2

        this.banner = this.add.container(this.BannerX, this.BannerY)

        // background
        const bannerBackground = this.add.graphics()
        bannerBackground.fillStyle(Constants.SUNNY, 1)
        bannerBackground.fillRoundedRect(0, 0, this.widthMenu, this.heightMenu, radius)

        const bannerFrame = this.add.graphics();
        bannerFrame.lineStyle(10*this.scaleFactor, Constants.BROWN, 1);
        bannerFrame.strokeRoundedRect(0, 0, this.widthMenu, this.heightMenu, radius);

        this.banner.add(bannerBackground)
        this.banner.add(bannerFrame)

        const action = () => {
            this.game.events.emit('buttonClicks')
            if (this.multiPlayerState) {

                this.textSkipReady?.destroy()

                this.textSkipReady = this.add.text(x, this.heightMenu*0.89, '1/2', {
                    font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
                    fill: '#964B00',
                    align: 'center'
                });
                this.textSkipReady.setOrigin(0.5).setDepth(99)

                window.socket.emit('btnPressed', 'Seller');
            } else {
                this.closeScene()
            }
        }
        this.banner.setScale(0)
        this.tweens.add({
            targets: this.banner,
            scale: 1,
            duration: 1000,
            ease: 'Circ',
            onComplete: () => {
                const shopText = this.add.text(x, this.heightMenu*0.20, 'SHOP', {
                    font: `${Math.round(this.dynamicFontSizeSmall*2)}px PixelFont`,
                    fill: '#964B00',
                    align: 'center'
                });
                shopText.setOrigin(0.5);
                shopText.setDepth(99)
                this.createButton(x, this.heightMenu*0.95, 200*this.scaleFactor, 70*this.scaleFactor, 'Continue', action)
                this.createScorePlate(x, this.heightMenu*0.35)
                this.createBPSlotsSeller()
                this.installatorSprite(this.BannerX+this.widthMenu/4, this.heightMenu*0.35)
                this.sellerSprite(this.BannerX+this.widthMenu*0.75, this.heightMenu*0.35)
        }
        })
        this.banner.setDepth(10)
    }

    createButton(x, y, width, height, text, onClickCallback) {
        const buttonWidth = width;
        const buttonHeight = height;
        const buttonX = x;
        const buttonY = y;

        const button = this.add.graphics();
        button.fillRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10*this.scaleFactor); // Rounded button
        button.lineStyle(5*this.scaleFactor, Constants.BROWN); // BROWN border
        button.strokeRoundedRect(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight, 10);
        const buttonText = this.add.text(buttonX, buttonY+buttonHeight/2, text, {
            font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
            fill: '#964B00',
            align: 'center'
        });
        buttonText.setOrigin(0.5);

        const hitArea = new Phaser.Geom.Rectangle(buttonX-buttonWidth/2, buttonY, buttonWidth, buttonHeight);
                    button.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        button.on('pointerdown', onClickCallback)
        button.setDepth(100);
        buttonText.setDepth(100);

    return button;
    }

    // Function to delete the text and frame if they exist
    removeScorePlate() {
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }

        if (this.scoreFrame) {
            this.scoreFrame.destroy();
            this.scoreFrame = null;
        }
    }

    installatorSprite(x, y) {
        this.spriteInstallator = this.add
            .sprite(x, y, 'installator_idle')
            .setScale(5.5*Constants.scaleFactor)
            .setDepth(10);

        this.spriteInstallator.play('idle_installator_idle');
    }

    sellerSprite(x, y) {
        this.spriteSeller = this.add
            .sprite(x, y, 'seller_idle')
            .setScale(5.5*Constants.scaleFactor)
            .setDepth(10)
            .setFlipX(true)
        this.spriteSeller.play('idle_seller_idle');
    }

    createScorePlate(x, y) {
        // Remove previous text and frame if they exist
        this.removeScorePlate();

        if (!this.score) {
            this.score = 0;
        }

        const framePadding = 20;

        // Create new frame and text
        const frame = this.add.graphics();
        const text = this.add.text(x, y, `Your score: ${this.score}$`, {
            font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
            fill: '#964B00',
            align: 'center'
        });
        text.setOrigin(0.5, 0.5);

        const textBounds = text.getBounds();
        frame.lineStyle(5*this.scaleFactor, Constants.BROWN, 1);
        frame.fillStyle(Constants.SUNNY, 1);
        frame.fillRoundedRect(
            textBounds.x - framePadding,
            textBounds.y - framePadding,
            textBounds.width + framePadding * 2,
            textBounds.height + framePadding * 2
        );
        frame.setDepth(11);
        frame.strokeRoundedRect(
            textBounds.x - framePadding,
            textBounds.y - framePadding,
            textBounds.width + framePadding * 2,
            textBounds.height + framePadding * 2
        );

        text.setDepth(12);

        // Store references to the text and frame for removal later
        this.scoreText = text;
        this.scoreFrame = frame;
    }

    createBPSlotsSeller() {
        const center = this.heightMenu/1.8;
        const sideStep = this.widthMenu/4;

        const tools = [
            { key: 'tool_clock', description: "Sand watch\nAdds 30 sec to Timer\nPress 1 to use", price: this.price_clock },
            { key: 'tool_screw', description: "Screw tool\nDissasemble the pipe of choice\nPress 2 to use", price: this.price_screw },
            { key: 'tool_shield', description: "Protector shield\nZero down the destroyed pipes count\nPress 3 to use", price: this.price_shield },
        ];

        const descriptionText = this.add.text(this.widthMenu/2+this.BannerX, this.heightMenu*0.8, '', {
            font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
            fill: '#000000',
            align: 'center'
        }).setDepth(20).setAlpha(0).setOrigin(0.5, 0.5);

        tools.forEach((tool, index) => {
            const offScreenX = this.BannerX+sideStep + index * (sideStep);

            const slot = this.add.image(0, 0, 'bp_slot')
                .setScale(this.scaleFactor)
                .setDepth(14)
                .setOrigin(0.5);
            const item = this.add.image(0, 0, tool.key)
                .setScale(0.6 * this.scaleFactor)
                .setDepth(15)
                .setOrigin(0.5);

            const container = this.add.container(offScreenX, center, [slot, item])
                .setSize(192*Constants.scaleFactor,192*Constants.scaleFactor)
                .setInteractive({ cursor: 'pointer' })
                .setName(`bp_slot_${index}`)
                .setDepth(15)

            container.on('pointerover', () => {
                descriptionText.setText(tool.description).setAlpha(1);
            });
            container.on('pointerout', () => {
                descriptionText.setAlpha(0);
            });
            container.on('pointerdown', () => {
                this.checkPriceScore(tool, index)
                if (this.multiPlayerState){
                    window.socket.emit('buyItem', {tool, index})
                }
            });

            this.add.text(offScreenX, center + this.heightMenu/7, `${tool.price}$`, {
                font: `${Math.round(this.dynamicFontSizeSmall)}px PixelFont`,
                fill: '#964B00',
                align: 'center'
            }).setOrigin(0.5, 0.5).setDepth(16)
        });

        this.writeamount()
    }

    writeamount() {
        const purchasedItems = this.registry.get('purchasedItems') || {};
        const sideStep = this.widthMenu / 4;
        const center = this.heightMenu / 1.8;
        const toolsNames = ['tool_clock', 'tool_screw', 'tool_shield'];

        if (this.amountContainer) {
            this.amountContainer.destroy();
        }
    
        this.amountContainer = this.add.container(0, 0).setDepth(100); // Create container
    
        for (let index = 0; index < 3; index++) {
            const offScreenX = this.BannerX + sideStep + index * sideStep;
    
            const bg = this.add.graphics();
            bg.fillStyle(Constants.BLACK, 0.3);
            bg.fillRoundedRect(
                offScreenX - 50 * this.scaleFactor / 2,
                center - 50 * this.scaleFactor / 2,
                50 * this.scaleFactor,
                50 * this.scaleFactor,
                6 * this.scaleFactor
            );
    
            const amount = purchasedItems[toolsNames[index]];
    
            const amountText = this.add.text(offScreenX, center, `x${amount}`, {
                font: `${Math.round(this.dynamicFontSizeSmall * 1.5)}px PixelFont`,
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5);
    
            this.amountContainer.add([bg, amountText]); // Add both to container
        }
    }
    

    checkPriceScore(item, index){
        const priceForItem = item.price
        if (this.score>=priceForItem){
            this.score = this.score - priceForItem
            this.registry.set('Score', this.score)

            this.createScorePlate(this.widthMenu / 2 + this.BannerX, this.heightMenu*0.35)
            this.highlightBPCellSeller(index, Constants.GREEN)
            this.buyItem(item)
            this.game.events.emit('buyItem')
        }else{
            this.highlightBPCellSeller(index, Constants.RED)
            this.game.events.emit('missedHit');
        }
    }

    buyItem(item) {
        const itemKey = item.key;

        let purchasedItems = this.registry.get('purchasedItems') || {};

        if (purchasedItems[itemKey]) {
            purchasedItems[itemKey] += 1;
        } else {
            purchasedItems[itemKey] = 1;
        }
        this.registry.set('purchasedItems', purchasedItems);
        this.writeamount()
    }

    highlightBPCellSeller(number, color) {
        const containerName = `bp_slot_${number}`;
        const container = this.children.getByName(containerName);

        if (!container) {
            console.error(`Container with name ${containerName} not found.`);
            return;
        }
        container.getAll().forEach((child) => child.setTint(color));
        this.time.delayedCall(200, () => {
            container.getAll().forEach((child) => child.clearTint());
        });
    }

    pauseButton(){
        const pause_button = this.add.image(40,40,'pause').setDepth(99).setInteractive({cursor: 'pointer'}).setScale(2*Constants.scaleFactor)
        pause_button.on('pointerdown', () => {
            this.game.events.emit('buttonClicks')
            this.scene.launch('Pause', { param: 'Seller' })
            if (!this.multiPlayerState)
            {this.scene.pause('Seller')}
        })
    }

    closeScene() {
        this.scene.get('Game').events.emit('sellerSceneStopped');
        this.scene.stop('Seller');

        this.level = this.registry.get('level')
    
        switch (this.level) {
            case 1:
                this.scene.start('SceneFirst');
                break;
            case 2:
                this.scene.start('SceneTwo');
                break;
            case 3:
                this.scene.start('SceneThree');
                break;
            case 4:
                this.scene.start('SceneFour');
                break;
            case 5:
                this.scene.start('SceneFive');
                break;
            case 6:
                this.scene.start('SceneSix');
                break;
            default:
                console.warn('Unknown level:', this.level);
        }
    }
}