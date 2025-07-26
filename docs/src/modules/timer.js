export class Timer {
    constructor(scene, x, y, startTime, callbackOnEnd) {
        this.scene = scene;
        this.remainingTime = startTime;
        this.callbackOnEnd = callbackOnEnd;
        this.duration = startTime;
        this.startTimestamp = Date.now();

        // console.log('TIMER STARTED', Date.now(), 'Duration:', this.duration);


        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const initialTime = `Time left:\n${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.text = this.scene.add.text(
            x, y,
            initialTime,
            { font:  `${Math.round(this.scene.FontSize)}px PixelFont`, fill: "#ffffff", align: "center" }
        ).setOrigin(0.5);

        this.timerEvent = this.scene.time.addEvent({
            delay: 100,
            callback: this.update,
            callbackScope: this,
            loop: true,
        });

    }

    update() {
        if (this.scene.multiPlayerState && this.scene.registry.get('role') === 'master') {
            this.remainingTime = this.duration - Math.floor((Date.now() - this.startTimestamp) / 1000);
            this.scene.socket.emit("syncTimer", {
                remainingTime: this.remainingTime
            });
        } else {
            this.remainingTime = this.duration - Math.floor((Date.now() - this.startTimestamp) / 1000);
        }
        
    
        if (this.remainingTime > 0) {
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
    
            this.text.setText(
                `Time left:\n${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        } else {
            this.text.setText("Time left:\n00:00");
            this.scene.time.removeAllEvents();
            this.callbackOnEnd();
        }
    }
    
    forceSetTime(newRemainingTime) {
        this.remainingTime = newRemainingTime;
        this.startTimestamp = Date.now() - (this.duration - newRemainingTime) * 1000;
    }
    
    destroy() {
        this.stop();
    
        if (this.text) {
            this.text.destroy();
            this.text = null;
        }
    }
    
    addTime(seconds) {
        const elapsed = Math.floor((Date.now() - this.startTimestamp) / 1000);

        this.duration += seconds;
        this.remainingTime = this.duration - elapsed;

        this.update();
    }

    stop() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
        this.elapsedWhenStopped = Math.floor((Date.now() - this.startTimestamp) / 1000);
        console.log('stopping timer')
    }

    // resume() {
    //     this.startTimestamp = Date.now() - this.elapsedWhenStopped * 1000;
    
    //     this.timerEvent = this.scene.time.addEvent({
    //         delay: 100,
    //         callback: this.update,
    //         callbackScope: this,
    //         loop: true,
    //     });
    // }

    resume() {
        const now = Date.now();
        const timePassed = this.duration - this.remainingTime;
        this.startTimestamp = now - timePassed * 1000;
    
        if (!this.timerEvent) {
            this.timerEvent = this.scene.time.addEvent({
                delay: 100,
                callback: this.update,
                callbackScope: this,
                loop: true,
            });
        }
    }
    
    

}
