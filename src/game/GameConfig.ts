export const GameConfig = {
  // Player
  playerSpeed: 150, // pixels per second
  playerRotationSpeed: 1.5, // radians per second
  playerHealth: 10,
  playerFrontCooldown: 0.3, // seconds
  playerSideCooldown: 1.0, // seconds

  // Enemies
  chaserSpeed: 100,
  chaserHealth: 3,
  chaserDamage: 2, 

  shooterSpeed: 50,
  shooterHealth: 3,
  shooterRange: 300,
  shooterCooldown: 1.5,
  shooterDamage: 1,

  // Projectiles
  projectileSpeed: 600,
  projectileLife: 1, // seconds
  playerDamage: 1,

  // Default Match Settings 
  matchDuration: 120, // seconds
  spawnInterval: 3.0, // seconds
};
