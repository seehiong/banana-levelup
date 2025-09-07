// Base Character Prototype for Banana Level Up Hackathon

class BaseCharacter {
  constructor(name = "Banana Hero", level = 1, experience = 0, health = 100, strength = 10, agility = 10, intelligence = 10) {
    this.name = name;             // Character name
    this.level = level;           // Current level
    this.experience = experience; // XP points
    this.health = health;         // Health points
    this.strength = strength;     // Physical strength stat
    this.agility = agility;       // Speed and dexterity stat
    this.intelligence = intelligence; // Intelligence stat for skills or magic
  }

  // Method to gain experience and level up
  gainExperience(xp) {
    this.experience += xp;
    const xpToNextLevel = this.level * 100; // Example leveling curve

    if (this.experience >= xpToNextLevel) {
      this.levelUp();
      this.experience -= xpToNextLevel;
    }
  }

  // Level up method: increases stats on level up
  levelUp() {
    this.level++;
    this.health += 20;
    this.strength += 5;
    this.agility += 5;
    this.intelligence += 5;
    console.log(`${this.name} leveled up to level ${this.level}!`);
  }
}

// Default base characters user can select
const defaultCharacters = [
  new BaseCharacter("Banana Hero"),
  new BaseCharacter("Peel Warrior", 1, 0, 120, 15, 8, 12),
  new BaseCharacter("Fruit Ninja", 1, 0, 90, 12, 15, 10),
];

// Export or make these characters selectable in your app interface
export { BaseCharacter, defaultCharacters };
