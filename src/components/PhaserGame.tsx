'use client';

import React, { useRef, useEffect } from 'react';
import * as Phaser from 'phaser';

class Balloon {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  letter: string;
  speed: number;
  hit: boolean = false; 

  constructor(scene: Phaser.Scene, x: number, y: number, letter: string) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.sprite = scene.add.image(0, 0, 'childBalloon');
    this.sprite.setScale(0.2);
    const letterText = scene.add.text(0, 0, letter, { fontSize: '20px', color: '#ffffff' });
    letterText.setOrigin(0.5);
    letterText.setPosition(-3, -30);
    this.container.add([this.sprite, letterText]);
    this.letter = letter;
    this.speed = 1;
  }

  update(delta: number) {
    this.container.y -= this.speed * (delta / 16.67);
  }

  destroy() {
    this.container.destroy();
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }
}

class BalloonManager {
  scene: Phaser.Scene;
  balloons: Balloon[];
  spawnInterval: number;
  lastSpawnTime: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.balloons = [];
    this.spawnInterval = 1500;
    this.lastSpawnTime = 0;
  }

  update(time: number, delta: number, gameTimer: number) {
    if (time > this.lastSpawnTime + this.spawnInterval && gameTimer > 0) {
      this.spawnBalloon();
      this.lastSpawnTime = time;
    }
    this.balloons.forEach(balloon => balloon.update(delta));
    this.balloons = this.balloons.filter(balloon => balloon.y > -100);
  }

  spawnBalloon() {
    const x = Phaser.Math.Between(50, 750);
    const y = 650;
    const letter = String.fromCharCode(65 + Phaser.Math.Between(0, 25));
    const balloon = new Balloon(this.scene, x, y, letter);
    this.balloons.push(balloon);
  }

  removeBalloon(balloon: Balloon) {
    const index = this.balloons.indexOf(balloon);
    if (index > -1) {
      this.balloons.splice(index, 1);
      balloon.destroy();
    }
  }

  getMatchingBalloons(letter: string): Balloon[] {
    return this.balloons.filter(balloon => balloon.letter === letter);
  }
}

class Bird {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Image;
  targetX: number;
  targetY: number;
  speed: number;
  onHit?: () => void;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onHit?: () => void
  ) {
    this.scene = scene;
    // Use the new bird image asset "chilBird"
    this.sprite = scene.add.image(startX, startY, 'chilBird');
    this.sprite.setScale(0.15);
    // Optional stabbing tween
    scene.tweens.add({
      targets: this.sprite,
      angle: 20,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = 4;
    this.onHit = onHit;
  }

  update(delta: number): boolean {
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 5) {
      if (this.onHit) this.onHit();
      this.destroy();
      return true;
    } else {
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.sprite.x += vx;
      this.sprite.y += vy;
      return false;
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}

class BirdManager {
  scene: Phaser.Scene;
  birds: Bird[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.birds = [];
  }

  spawnBird(startX: number, startY: number, targetX: number, targetY: number, onHit?: () => void) {
    const bird = new Bird(this.scene, startX, startY, targetX, targetY, onHit);
    this.birds.push(bird);
  }

  update(delta: number) {
    this.birds = this.birds.filter(bird => !bird.update(delta));
  }
}

class Explosion {
  scene: Phaser.Scene;
  circle: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.circle = scene.add.circle(x, y, 0, 0xffa500);
    scene.tweens.add({
      targets: this.circle,
      radius: 30,
      alpha: { from: 1, to: 0 },
      duration: 300,
      onComplete: () => this.circle.destroy()
    });
  }
}

class UIManager {
  scene: Phaser.Scene;
  score: number;
  timer: number;
  scoreText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, initialTimer: number) {
    this.scene = scene;
    this.score = 0;
    this.timer = initialTimer;
    this.scoreText = scene.add.text(10, 10, 'Score: 0', { fontSize: '20px', color: '#ffffff' });
    this.timerText = scene.add.text(650, 10, `Time: ${initialTimer}`, { fontSize: '20px', color: '#ffffff' });
  }

  updateTimer(time: number) {
    this.timer = time;
    this.timerText.setText(`Time: ${time}`);
  }

  updateScore(score: number) {
    this.score = score;
    this.scoreText.setText(`Score: ${score}`);
  }
}

class DifficultyManager {
  scene: Phaser.Scene;
  balloonManager: BalloonManager;
  difficultyTimer: number;

  constructor(scene: Phaser.Scene, balloonManager: BalloonManager) {
    this.scene = scene;
    this.balloonManager = balloonManager;
    this.difficultyTimer = 0;
  }

  update(delta: number) {
    this.difficultyTimer += delta;
    if (this.difficultyTimer > 10000) {
      this.difficultyTimer = 0;
      this.balloonManager.balloons.forEach(balloon => balloon.speed += 0.2);
      this.balloonManager.spawnInterval = Math.max(500, this.balloonManager.spawnInterval - 100);
    }
  }
}

class InputHandler {
  scene: Phaser.Scene;
  balloonManager: BalloonManager;
  birdManager: BirdManager;
  uiManager: UIManager;

  constructor(scene: Phaser.Scene, balloonManager: BalloonManager, birdManager: BirdManager, uiManager: UIManager) {
    this.scene = scene;
    this.balloonManager = balloonManager;
    this.birdManager = birdManager;
    this.uiManager = uiManager;
    scene.input.keyboard!.on('keydown', this.handleKey);
  }

  handleKey = (event: KeyboardEvent) => {
    const keyPressed = event.key.toUpperCase();
    const matchingBalloons = this.balloonManager.getMatchingBalloons(keyPressed);
    if (matchingBalloons.length === 0) return;
    const validBalloons = matchingBalloons.filter(balloon => balloon.y >= -100 && !balloon.hit);
    if (validBalloons.length === 0) return;
  
    validBalloons.forEach(balloon => {
      balloon.hit = true;
      const explosionOffsetY = -20;
      const spawnX = -20;
      const spawnY = this.scene.cameras.main.height + 20;
      const dx = balloon.x - spawnX;
      const dy0 = balloon.y - spawnY;
      const vBalloon = balloon.speed;
      const vBird = 4;
      const A = vBalloon * vBalloon - vBird * vBird;
      const B = -2 * dy0 * vBalloon;
      const C = dx * dx + dy0 * dy0;
      let t = 0;
      if (Math.abs(A) < 0.0001) {
        t = C / (-B);
      } else {
        const discriminant = B * B - 4 * A * C;
        if (discriminant < 0) {
          t = 0;
        } else {
          const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
          const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);
          t = (t1 > 0 ? t1 : (t2 > 0 ? t2 : 0));
        }
      }
      const predictedY = balloon.y - vBalloon * t;
      const targetX = balloon.x;
      const targetY = predictedY + explosionOffsetY;
      this.birdManager.spawnBird(
        spawnX,
        spawnY,
        targetX,
        targetY,
        () => {
          if (balloon.y < 0) return;
          new Explosion(this.scene, balloon.x, balloon.y + explosionOffsetY);
          this.balloonManager.removeBalloon(balloon);
          this.scene.events.emit('balloonPopped', 1);
          this.scene.sound.play('pop');
        }
      );
    });
  };
}

class TypingGameScene extends Phaser.Scene {
  score: number = 0;
  gameTimer: number = 60;
  balloonManager!: BalloonManager;
  birdManager!: BirdManager;
  uiManager!: UIManager;
  difficultyManager!: DifficultyManager;

  constructor() {
    super({ key: 'TypingGameScene' });
  }

  preload() {
    this.load.image('childBalloon', '/child_balloon.png');
    this.load.image('chilBird', '/chilBird.png');
    this.load.audio('pop', '/pop_arya.m4a');
  }

  create() {
    this.score = 0;
    this.gameTimer = 60;
    this.balloonManager = new BalloonManager(this);
    this.birdManager = new BirdManager(this);
    this.uiManager = new UIManager(this, this.gameTimer);
    this.difficultyManager = new DifficultyManager(this, this.balloonManager);
    new InputHandler(this, this.balloonManager, this.birdManager, this.uiManager);
    this.events.on('balloonPopped', this.updateScore, this);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTimer--;
        this.uiManager.updateTimer(this.gameTimer);
        if (this.gameTimer <= 0) {
          this.scene.pause();
          this.add.text(400, 300, 'Game Over', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);
        }
      },
      loop: true,
    });
  }

  updateScore(points: number) {
    this.score += points;
    this.uiManager.updateScore(this.score);
  }

  update(time: number, delta: number) {
    this.balloonManager.update(time, delta, this.gameTimer);
    this.birdManager.update(delta);
    this.difficultyManager.update(delta);
  }
}

const PhaserGame: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainerRef.current || undefined,
      scene: [TypingGameScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      }
    };
    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainerRef} className="mx-auto my-8 border border-gray-400" />;
};

export default PhaserGame;