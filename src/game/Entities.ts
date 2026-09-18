import * as PIXI from 'pixi.js';
import { GameConfig } from './GameConfig';

class Entity {
  public sprite: PIXI.Sprite;
  public x: number = 0;
  public y: number = 0;
  public radius: number = 20;
  public rotation: number = 0;
  public isDead: boolean = false;

  constructor(texture: PIXI.Texture | PIXI.Texture[] | undefined, container: PIXI.Container) {
    if (texture) {
      if (Array.isArray(texture)) {
        this.sprite = new PIXI.AnimatedSprite(texture);
      } else {
        this.sprite = new PIXI.Sprite(texture);
      }
      this.sprite.anchor.set(0.5);
      container.addChild(this.sprite);
    } else {
      this.sprite = new PIXI.Sprite();
    }
  }

  public update(_deltaSeconds?: number) {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation - (Math.PI / 2);
  }

  public destroy() {
    this.sprite.destroy();
  }
}

export class Projectile extends Entity {
  public speed: number = GameConfig.projectileSpeed;
  public damage: number = GameConfig.playerDamage;
  public life: number = GameConfig.projectileLife;
  public lifeScale: number = this.life;
  public isPlayerOwned: boolean;
  
  constructor(texture: PIXI.Texture, container: PIXI.Container, x: number, y: number, rotation: number, isPlayerOwned: boolean) {
    super(texture, container);
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.isPlayerOwned = isPlayerOwned;
    this.radius = 5;
    
    this.sprite.scale.set(2);
  }

  public update(deltaSeconds: number) {
    this.x += Math.cos(this.rotation) * this.speed * deltaSeconds;
    this.y += Math.sin(this.rotation) * this.speed * deltaSeconds;
    
    this.life -= deltaSeconds;
    if (this.life <= 0) {
      this.isDead = true;
    }

    const pct = this.life / this.lifeScale;

    const tamanhoInicial = 1; 
    const tamanhoNoMeio = 2;  

    const A = (2 * tamanhoInicial) - (4 * tamanhoNoMeio);
    const B = (4 * tamanhoNoMeio) - tamanhoInicial;

    const novaEscala = A * (pct * pct) + B * pct;
    
    this.sprite.scale.set(Math.max(0, novaEscala)); 

    super.update(deltaSeconds);
  }
}

class Ship extends Entity {
  public health: number = 3;
  public maxHealth: number = 3;
  public speed: number = 0;
  public healthBar: PIXI.Graphics;

  public stateTextures: PIXI.Texture[] = [];
  public flashTimer: number = 0;
  public fireSprite?: PIXI.AnimatedSprite;

  constructor(textures: PIXI.Texture[], container: PIXI.Container) {
    super(textures[0], container);
    this.stateTextures = textures;
    this.healthBar = new PIXI.Graphics();
    container.addChild(this.healthBar);
    this.radius = 25; // Approximate radius for collision
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    this.flashTimer = 0.15;

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }

    // Atualiza a textura baseado no estado da vida
    const pct = this.health / this.maxHealth;
    let stateIdx = 0;
    if (pct <= 0) stateIdx = 3;         // Afundou
    else if (pct <= 0.33) stateIdx = 2; // Muito danificado
    else if (pct <= 0.66) stateIdx = 1; // Danificado

    if (this.stateTextures[stateIdx]) {
      this.sprite.texture = this.stateTextures[stateIdx];
    }
  }

  public update(deltaSeconds: number) {
    super.update(deltaSeconds);
    
    // Lógica do Flash Vermelho
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaSeconds;
      this.sprite.tint = 0xff0000;
    } else {
      this.sprite.tint = 0xffffff;
    }

    // Lógica do Fogo (se a vida estiver abaixo de 33%)
    const pct = this.health / this.maxHealth;
    if (pct > 0 && pct <= 0.33 && !this.isDead) {
      if (!this.fireSprite) {
        const fireTex = [
          PIXI.Texture.from('/assets/png/default/effects/fire_1.png'), 
          PIXI.Texture.from('/assets/png/default/effects/fire_2.png')
        ];
        this.fireSprite = new PIXI.AnimatedSprite(fireTex);
        this.fireSprite.anchor.set(0.5);
        this.fireSprite.animationSpeed = 0.15;
        this.fireSprite.play();
        // Adiciona o fogo em cima do barco
        this.sprite.addChild(this.fireSprite);
      }
    } else if (this.fireSprite) {
      this.fireSprite.destroy();
      this.fireSprite = undefined;
    }

    // Update health bar
    this.healthBar.clear();
    const hpWidth = 40;
    const hpHeight = 5;
    const hpPercent = Math.max(0, this.health / this.maxHealth);
    
    this.healthBar.beginFill(0xff0000);
    this.healthBar.drawRect(this.x - hpWidth/2, this.y - 40, hpWidth, hpHeight);
    this.healthBar.endFill();
    
    this.healthBar.beginFill(0x00ff00);
    this.healthBar.drawRect(this.x - hpWidth/2, this.y - 40, hpWidth * hpPercent, hpHeight);
    this.healthBar.endFill();
  }

  public destroy() {
    super.destroy();
    this.healthBar.destroy();
    if (this.fireSprite) {
      this.fireSprite.destroy();
    }
  }
}

export class Player extends Ship {
  public frontCooldown: number = 0;
  public sideCooldown: number = 0;

  constructor(container: PIXI.Container) {
    const texs = [
      PIXI.Texture.from('ship_1.png'),
      PIXI.Texture.from('ship_7.png'),
      PIXI.Texture.from('ship_13.png'),
      PIXI.Texture.from('ship_19.png')
    ];
    super(texs, container);
    this.health = this.maxHealth = GameConfig.playerHealth;
  }

  public updateCooldowns(deltaSeconds: number) {
    if (this.frontCooldown > 0) this.frontCooldown -= deltaSeconds;
    if (this.sideCooldown > 0) this.sideCooldown -= deltaSeconds;
  }
}

export class Enemy extends Ship {
  public enemyType: 'CHASER' | 'SHOOTER';
  
  constructor(textures: PIXI.Texture[], container: PIXI.Container, type: 'CHASER' | 'SHOOTER') {
    super(textures, container);
    this.enemyType = type;
  }
}

export class Chaser extends Enemy {
  constructor(container: PIXI.Container) {
    const texs = [
      PIXI.Texture.from('ship_2.png'),
      PIXI.Texture.from('ship_8.png'),
      PIXI.Texture.from('ship_14.png'),
      PIXI.Texture.from('ship_20.png')
    ];
    super(texs, container, 'CHASER');
    this.health = this.maxHealth = GameConfig.chaserHealth;
    this.speed = GameConfig.chaserSpeed;
  }
}

export class Shooter extends Enemy {
  public cooldown: number = 0;

  constructor(container: PIXI.Container) {
    const texs = [
      PIXI.Texture.from('ship_3.png'),
      PIXI.Texture.from('ship_9.png'),
      PIXI.Texture.from('ship_15.png'),
      PIXI.Texture.from('ship_21.png')
    ];
    super(texs, container, 'SHOOTER');
    this.health = this.maxHealth = GameConfig.shooterHealth;
    this.speed = GameConfig.shooterSpeed;
  }

  public updateCooldowns(deltaSeconds: number) {
    if (this.cooldown > 0) this.cooldown -= deltaSeconds;
  }
}

export class Explosion extends Entity {
  constructor(container: PIXI.Container, x: number, y: number) {
    const texs = [
      PIXI.Texture.from('/assets/png/default/effects/explosion_3.png'),
      PIXI.Texture.from('/assets/png/default/effects/explosion_2.png'),
      PIXI.Texture.from('/assets/png/default/effects/explosion_1.png')
    ];
    super(texs, container);
    this.x = x;
    this.y = y;
    this.sprite.x = x;
    this.sprite.y = y;
    
    const animSprite = this.sprite as PIXI.AnimatedSprite;
    animSprite.animationSpeed = 0.15;
    animSprite.loop = false;
    animSprite.onComplete = () => {
      this.isDead = true;
      this.sprite.destroy();
    };
    animSprite.play();

    const audio = new Audio('/assets/sounds/ship_explosion_1.wav');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }
}
