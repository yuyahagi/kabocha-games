class HpBar extends PIXI.Container {
    constructor(maxHp) {
        super();
        
        this.maxHp = maxHp;
        this.barSizeX = 640;
        this.barSizeY = 8;

        let back = new PIXI.Graphics();
        back.beginFill(0xa0a0a0);
        back.drawRect(0, 0, this.width, this.barSizeY);
        back.endFill();
        this.addChild(back);

        let front = new PIXI.Graphics();
        this.addChild(front);
        front.beginFill(0x00aa00, 0.5);
        front.drawRect(0, 0, this.barSizeX, this.barSizeY);
        front.endFill();

        this.front = front;
    }

    update(hp) {
        this.front.width = this.barSizeX * hp / this.maxHp;
    }
}
