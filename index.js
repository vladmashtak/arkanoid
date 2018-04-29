class Sprites {
  constructor(backgroundSrc, platformSrc, ballSrc, blockSrc) {
    this.background = new Image();
    this.background.src = backgroundSrc;

    this.platform = new Image();
    this.platform.src = platformSrc;

    this.ball = new Image();
    this.ball.src = ballSrc;

    this.block = new Image();
    this.block.src = blockSrc;
  }
}

class Platform {
  constructor(ball) {
    if (!(ball instanceof Ball)) {
      throw new Error('Argument must be instance of Ball');
    }
    this.ball = ball;
    this.x = 300;
    this.y = 300;
    this.velocity = 6; // max speed
    this.dx = 0; // start speed
    this.width = 104;
    this.height = 24;
  }

  move() {
    this.x += this.dx;

    if (this.ball) {
      this.ball.x += this.dx;
    }
  }

  stop() {
    this.dx = 0;

    if (this.ball) {
      this.ball.dx = 0;
    }
  }

  releaseBall() {
    if (this.ball) {
      this.ball.jump();
      this.ball = null;
    }
  }
}

class Ball {
  constructor() {
    this.x = 340;
    this.y = 278;

    this.width = 22;
    this.height = 22;

    this.frame = 0;

    this.dx = 0;
    this.dy = 0;

    this.velocity = 3;
  }

  jump() {
    this.dx = -this.velocity;
    this.dy = -this.velocity;
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;
  }

  collide(element) {
    let x = this.x + this.dx;
    let y = this.y + this.dy;

    return x + this.width > element.x &&
      x < element.x + element.width &&
      y + this.height > element.y &&
      y < element.y + element.height;
  }

  bumpBlock(block) {
    if (!(block instanceof Block)) {
      throw new Error('Argument must be instance of Block');
    }

    this.dy *= -1;
    block.isAlive = false;
  }

  bumpPlatform(platform) {
    if (!(platform instanceof Platform)) {
      throw new Error('Argument must be instance of Platform');
    }

    this.dy = -this.velocity;
    this.dx = this.onTheLeftSide(platform) ? -this.velocity : this.velocity;
  }

  onTheLeftSide(platform) {
    return (this.x + this.width / 2) < (platform.x + platform.width / 2);
  }

  checkBounds(canvasWidth, canvasHeight, over) {
    if (typeof canvasWidth !== 'number' && typeof canvasHeight !== 'number') {
      throw Error('Params: canvasWidth and canvasHeight must be a number');
    }

    if (typeof over !== 'function') {
      throw Error('Params over must be a function');
    }

    let x = this.x + this.dx;
    let y = this.y + this.dy;

    if (x < 0 ) {
      this.x = 0;
      this.dx = this.velocity;
    } else if (x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
      this.dx = -this.velocity;
    } else if (y < 0) {
      this.y = 0;
      this.dy = this.velocity;
    } else if (y + this.height > canvasHeight) {
      over()
    }
  }
}

class Block {
  constructor(x, y = 0, width = 64, height = 32) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isAlive = true;
  }
}

class GameLevel {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;

    this.blocks = [];
  }

  createBlocks() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.blocks.push(new Block(68 * col + 50, 38 * row + 35));
      }
    }
  }
}

class Game {
  constructor() {
    this.running = true;
    this.score = 0;
    this.canvas = document.getElementById('mycanvas');
    this.width = parseInt(this.canvas.getAttribute('width'));
    this.height = parseInt(this.canvas.getAttribute('height'));

    this.ctx = this.canvas.getContext('2d');

    this.sprites = new Sprites(
      'png/background.jpg',
      'png/platform.png',
      'png/ball.png',
      'png/element_red_rectangle.png'
    );

    this.ball = new Ball();
    this.platform = new Platform(this.ball);
    this.gameLevel = null;
  }

  start() {
    this.createLevel();
    this.initEvent();
    this.run();
  }

  initEvent() {
    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 37) {
        this.platform.dx = -this.platform.velocity;
      } else if (event.keyCode === 39) {
        this.platform.dx = this.platform.velocity;
      } else if (event.keyCode === 32) {
        this.platform.releaseBall();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.platform.stop();
    });
  }

  createLevel() {
    this.gameLevel = new GameLevel(4, 8);

    this.gameLevel.createBlocks();
  }

  render() {
    /* clear previous frame*/
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.drawImage(this.sprites.background, 0, 0);
    this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
    this.ctx.drawImage(this.sprites.ball, this.ball.x, this.ball.y);

    this.gameLevel.blocks.forEach((block) => {
      if (block.isAlive) {
        this.ctx.drawImage(this.sprites.block, block.x, block.y);
      }
    });
  }

  update() {
    if (this.ball.collide(this.platform)) {
      this.ball.bumpPlatform(this.platform);
    }

    if (this.platform.dx) {
      this.platform.move();
    }

    if (this.ball.dx || this.ball.dy) {
      this.ball.move();
    }

    this.gameLevel.blocks.forEach((block) => {
      if (block.isAlive && this.ball.collide(block)) {
        this.ball.bumpBlock(block);

        this.score++;

        if (this.score >= this.gameLevel.blocks.length) {
          this.over('You win ! =)')
        }
      }
    });

    this.ball.checkBounds(this.width, this.height, () => {
      this.over('You loose =)');
    });
  }

  over(message) {
    alert(message);
    this.running = false;
    window.location.reload();
  }

  run() {
    this.update();
    this.render();

    if (this.running) {
      window.requestAnimationFrame(() => {
        this.run();
      });
    }
  }
}

window.onload = function () {
  const game = new Game();

  game.start();
};