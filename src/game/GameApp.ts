import * as PIXI from 'pixi.js';
import { GameConfig } from './GameConfig';
import { InputManager } from './InputManager';
import { Player, Chaser, Shooter, Projectile, Enemy, Explosion } from './Entities';
import { circleIntersect, distance, angleBetween } from './Utils';

export class GameApp {
  public app: PIXI.Application;
  private input: InputManager;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  
  private textures: Record<string, PIXI.Texture> = {};
  
  private matchTime: number = GameConfig.matchDuration;
  private score: number = 0;
  private spawnTimer: number = 0;
  private isGameOver: boolean = false;

  private gameContainer: PIXI.Container;
  private islandSprite!: PIXI.Sprite;
  private waterBackgroundUnder!: PIXI.TilingSprite;
  private waterBackground!: PIXI.TilingSprite;

  constructor(
    parent: HTMLElement, 
    private onEndGame: (reason: string, score: number, time: number) => void,
    private onUpdateHUD: (score: number, time: number) => void
  ) {
    this.app = new PIXI.Application({
      resizeTo: parent,
      backgroundColor: 0x0a66c2, // Water color
    });
    
    parent.appendChild(this.app.view as HTMLCanvasElement);
    
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    this.input = new InputManager();

    this.init();
  }

  private async init() {
    await PIXI.Assets.load('/assets/spritesheet/ShipsSheet.json');
    await PIXI.Assets.load('/assets/tilesheet/spritesheet.json');
    await PIXI.Assets.load([
      '/assets/png/default/effects/explosion_1.png',
      '/assets/png/default/effects/explosion_2.png',
      '/assets/png/default/effects/explosion_3.png',
      '/assets/png/default/effects/fire_1.png',
      '/assets/png/default/effects/fire_2.png'
    ]);

    this.textures = {
      player: PIXI.Texture.from('ship_1.png'),
      chaser: PIXI.Texture.from('ship_2.png'),
      shooter: PIXI.Texture.from('ship_3.png'),
      projectile: PIXI.Texture.from('cannon_ball.png'),
      water: PIXI.Texture.from('tile_73.png'),
      island: PIXI.Texture.from('tile_4.png')
    };


    this.waterBackground = new PIXI.TilingSprite(
      this.textures.water,
      this.app.screen.width,  
      this.app.screen.height  
    );
    this.waterBackground.alpha = 0.5;
    this.waterBackground.tileScale.set(2); 
    this.waterBackground.tint = 0x0006FF;
    this.gameContainer.addChild(this.waterBackground);

    this.waterBackgroundUnder = new PIXI.TilingSprite(
      this.textures.water,
      this.app.screen.width,  
      this.app.screen.height  
    );
    this.waterBackgroundUnder.alpha = 0.5;
    this.waterBackgroundUnder.tileScale.set(2); 

    this.waterBackgroundUnder.rotation = Math.PI;

    this.waterBackgroundUnder.x = this.app.screen.width;
    this.waterBackgroundUnder.y = this.app.screen.height;

    this.gameContainer.addChild(this.waterBackgroundUnder);

    // Create Island 
    this.islandSprite = new PIXI.Sprite(this.textures.island);
    this.islandSprite.anchor.set(0.5);
    this.islandSprite.scale.set(1);
    this.islandSprite.x = this.app.screen.width / 2;
    this.islandSprite.y = this.app.screen.height / 2;
    this.gameContainer.addChild(this.islandSprite);

    // Create Player
    this.player = new Player(this.gameContainer);
    this.player.x = 200;
    this.player.y = 200;

    this.app.ticker.add(this.update.bind(this));
  }

  private update(delta: number) {
    if (this.isGameOver) return;
    
    const deltaSeconds = delta / 60; 

    this.matchTime -= deltaSeconds;
    if (this.matchTime <= 0) {
      this.endGame('Time Over');
      return;
    }

    this.updatePlayer(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.checkCollisions();

    if (this.player.isDead) {
      if (!this.player.sprite.destroyed) {
         new Explosion(this.gameContainer, this.player.x, this.player.y);
      }
      this.endGame('Destroyed');
    }

    // Keep player in bounds
    this.player.x = Math.max(0, Math.min(this.player.x, this.app.screen.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.app.screen.height));

    // Animação e redimensionamento da camada superior da água
    this.waterBackground.width = this.app.screen.width;
    this.waterBackground.height = this.app.screen.height;
    this.waterBackground.tilePosition.x -= 0.5 * delta;
    this.waterBackground.tilePosition.y -= 0.5 * delta;

    // Animação, redimensionamento e reposicionamento da camada inferior
    this.waterBackgroundUnder.width = this.app.screen.width;
    this.waterBackgroundUnder.height = this.app.screen.height;
    this.waterBackgroundUnder.x = this.app.screen.width; 
    this.waterBackgroundUnder.y = this.app.screen.height;
    // Move em direções e velocidades diferentes para dar o efeito de profundidade (Parallax)
    this.waterBackgroundUnder.tilePosition.x += 0.3 * delta;
    this.waterBackgroundUnder.tilePosition.y -= 0.2 * delta;

    this.onUpdateHUD(this.score, Math.ceil(this.matchTime));
  }

  private updatePlayer(deltaSeconds: number) {
    this.player.updateCooldowns(deltaSeconds);

    // Rotation
    if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('KeyA')) {
      this.player.rotation -= GameConfig.playerRotationSpeed * deltaSeconds;
    }
    if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('KeyD')) {
      this.player.rotation += GameConfig.playerRotationSpeed * deltaSeconds;
    }

    // Movement
    if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW')) {
      this.player.x += Math.cos(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
      this.player.y += Math.sin(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
    }
    if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('KeyS')) {
      this.player.x -= Math.cos(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
      this.player.y -= Math.sin(this.player.rotation) * GameConfig.playerSpeed * deltaSeconds;
    }

    // Island Collision (Player)
    if (distance(this.player.x, this.player.y, this.islandSprite.x, this.islandSprite.y) < 100) {
      const angle = angleBetween(this.islandSprite.x, this.islandSprite.y, this.player.x, this.player.y);
      this.player.x = this.islandSprite.x + Math.cos(angle) * 100;
      this.player.y = this.islandSprite.y + Math.sin(angle) * 100;
    }

    // Shooting
    if (this.input.isKeyDown('Space') && this.player.frontCooldown <= 0) {
      this.shootProjectile(this.player.x, this.player.y, this.player.rotation, true);
      this.player.frontCooldown = GameConfig.playerFrontCooldown;
    }
    
    // Side shooting
    if (this.input.isKeyDown('KeyQ') && this.player.sideCooldown <= 0) {
      this.shootSide(-Math.PI / 2);
      this.player.sideCooldown = GameConfig.playerSideCooldown;
    }
    if (this.input.isKeyDown('KeyE') && this.player.sideCooldown <= 0) {
      this.shootSide(Math.PI / 2);
      this.player.sideCooldown = GameConfig.playerSideCooldown;
    }

    this.player.update(deltaSeconds);
  }

  private shootSide(angleOffset: number) {
    const angle = this.player.rotation + angleOffset;
    for (let i = -1; i <= 1; i++) {
      const offset = i * 20;
      const px = this.player.x + Math.cos(this.player.rotation) * offset;
      const py = this.player.y + Math.sin(this.player.rotation) * offset;
      this.shootProjectile(px, py, angle, true);
    }
  }

  private updateEnemies(deltaSeconds: number) {
    this.spawnTimer += deltaSeconds;
    if (this.spawnTimer >= GameConfig.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isDead) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      const distToPlayer = distance(enemy.x, enemy.y, this.player.x, this.player.y);
      const angleToPlayer = angleBetween(enemy.x, enemy.y, this.player.x, this.player.y);
      
      // Rotate towards player
      const targetRotation = angleToPlayer;
      let diff = targetRotation - enemy.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      enemy.rotation += Math.sign(diff) * Math.min(Math.abs(diff), GameConfig.playerRotationSpeed * deltaSeconds);

      if (enemy instanceof Chaser) {
        enemy.x += Math.cos(enemy.rotation) * enemy.speed * deltaSeconds;
        enemy.y += Math.sin(enemy.rotation) * enemy.speed * deltaSeconds;
      } else if (enemy instanceof Shooter) {
        enemy.updateCooldowns(deltaSeconds);
        if (distToPlayer > GameConfig.shooterRange) {
          enemy.x += Math.cos(enemy.rotation) * enemy.speed * deltaSeconds;
          enemy.y += Math.sin(enemy.rotation) * enemy.speed * deltaSeconds;
        } else if (enemy.cooldown <= 0) {
          this.shootProjectile(enemy.x, enemy.y, enemy.rotation, false);
          enemy.cooldown = GameConfig.shooterCooldown;
        }
      }

      // Island Collision
      if (distance(enemy.x, enemy.y, this.islandSprite.x, this.islandSprite.y) < 100) {
        const angle = angleBetween(this.islandSprite.x, this.islandSprite.y, enemy.x, enemy.y);
        enemy.x = this.islandSprite.x + Math.cos(angle) * 100;
        enemy.y = this.islandSprite.y + Math.sin(angle) * 100;
      }

      enemy.update(deltaSeconds);
    }
  }

  private spawnEnemy() {
    const isChaser = Math.random() > 0.5;
    const enemy = isChaser ? new Chaser(this.gameContainer) : new Shooter(this.gameContainer);
    
    let sx, sy;
    do {
      sx = Math.random() * this.app.screen.width;
      sy = Math.random() * this.app.screen.height;
    } while (distance(sx, sy, this.player.x, this.player.y) < 300);

    enemy.x = sx;
    enemy.y = sy;
    this.enemies.push(enemy);
  }

  private updateProjectiles(deltaSeconds: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.isDead ||
          proj.x < 0 || proj.x > this.app.screen.width ||
          proj.y < 0 || proj.y > this.app.screen.height )
      {
        proj.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      proj.update(deltaSeconds);
    }
  }

  private playSound(path: string, volume: number = 0.2) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  private shootProjectile(x: number, y: number, rotation: number, isPlayerOwned: boolean) {
    const proj = new Projectile(this.textures.projectile, this.gameContainer, x, y, rotation, isPlayerOwned);
    if (!isPlayerOwned) proj.sprite.tint = 0xff0000;
    this.projectiles.push(proj);
    this.playSound('/assets/sounds/cannon_fire_1.wav');
  }

  private checkCollisions() {
    // Projectile vs Ships
    for (const proj of this.projectiles) {
      if (proj.isDead) continue;

      if (proj.isPlayerOwned) {
        for (const enemy of this.enemies) {
          if (!enemy.isDead && circleIntersect(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
            proj.isDead = true;
            const enemyX = enemy.x;
            const enemyY = enemy.y;
            
            enemy.takeDamage(proj.damage);
            
            if (enemy.isDead) {
              this.score++;
              new Explosion(this.gameContainer, enemyX, enemyY);
            }
            break;
          }
        }
      } else {
        if (circleIntersect(proj.x, proj.y, proj.radius, this.player.x, this.player.y, this.player.radius)) {
          proj.isDead = true;
          this.player.takeDamage(GameConfig.shooterDamage); 
        }
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy instanceof Chaser) {
        if (circleIntersect(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.radius)) {
          this.player.takeDamage(GameConfig.chaserDamage);
          enemy.isDead = true;
        }
      }
    }
  }

  private endGame(reason: string) {
    this.isGameOver = true;
    const timePlayed = GameConfig.matchDuration - this.matchTime;
    this.onEndGame(reason, this.score, Math.floor(timePlayed));
  }

  public destroy() {
    this.input.destroy();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }


}
