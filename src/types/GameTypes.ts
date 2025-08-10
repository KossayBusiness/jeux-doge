/**
 * 🎮 TYPES TYPESCRIPT POUR DOGE ASTRONAUT
 * 
 * Ce fichier contient toutes les définitions de types pour le jeu.
 * Il assure la cohérence des données et facilite le développement avec IntelliSense.
 * 
 * 🏗️ ORGANISATION :
 * - Types de base (Position, Velocity)
 * - Entités de jeu (Player, Obstacle, Collectible)
 * - État du jeu (GameState, ShopState)
 * - Système de pouvoirs (PowerUp)
 * - Effets visuels (Particle)
 * 
 * 📱 ADAPTATIONS MOBILES :
 * Ces types sont conçus pour être compatibles mobile.
 * Aucune modification nécessaire pour la version mobile.
 */

// 🎯 TYPES DE BASE POUR LA GÉOMÉTRIE

/**
 * Position 2D dans l'espace de jeu
 * Utilisé pour tous les objets ayant une position
 */
export interface Position {
  x: number;  // Position horizontale en pixels
  y: number;  // Position verticale en pixels
}

/**
 * Vélocité 2D pour la physique
 * Utilisé pour le mouvement et les calculs de physique
 */
export interface Velocity {
  x: number;  // Vitesse horizontale en pixels/frame
  y: number;  // Vitesse verticale en pixels/frame
}

// 🎮 ENTITÉS DE JEU

/**
 * Objet de jeu de base
 * Interface partagée par tous les objets physiques du jeu
 */
export interface GameObject {
  position: Position;  // Position actuelle dans le monde
  velocity: Velocity;  // Vitesse de déplacement
  width: number;       // Largeur pour les collisions
  height: number;      // Hauteur pour les collisions
  active: boolean;     // L'objet est-il actif dans le jeu ?
}

/**
 * Joueur principal (Doge Astronaut)
 * Hérite de GameObject avec des propriétés spécifiques au joueur
 */
export interface Player extends GameObject {
  isJumping: boolean;   // Le joueur est-il en train de sauter ?
  isGrounded: boolean;  // Le joueur touche-t-il le sol ?
  jumpCount: number;    // Nombre de sauts effectués (0 ou 1)
  maxJumps: number;     // Nombre maximum de sauts autorisés (fixé à 1)
}

/**
 * Obstacles à éviter
 * Différents types avec propriétés d'animation
 */
export interface Obstacle extends GameObject {
  type: 'meteorite' | 'rock' | 'flag';  // Type d'obstacle détermine l'apparence
  rotation: number;                      // Rotation actuelle (pour météorites)
  rotationSpeed: number;                 // Vitesse de rotation
}

/**
 * Objets à collecter (os)
 * Avec système d'animation et de magnétisme
 */
export interface Collectible extends GameObject {
  type: 'coin';              // Type de collectible (actuellement seulement 'coin' pour les os)
  collected: boolean;        // L'objet a-t-il été collecté ?
  animation: number;         // Frame d'animation pour l'effet flottant
  value: number;             // Valeur en points (généralement 10)
  magnetized?: boolean;      // L'objet est-il attiré par l'aimant magnétique ?
}

// ✨ SYSTÈME DE PARTICULES

/**
 * Particule pour les effets visuels
 * Utilisé pour les explosions, collections, etc.
 */
export interface Particle {
  position: Position;  // Position actuelle de la particule
  velocity: Velocity;  // Vitesse de déplacement
  life: number;        // Durée de vie restante (en frames)
  maxLife: number;     // Durée de vie maximale (pour le fade)
  color: string;       // Couleur CSS de la particule
  size: number;        // Taille en pixels
}

// 🎮 ÉTAT DU JEU

/**
 * État global du jeu
 * Contient toutes les informations sur la partie en cours
 */
export interface GameState {
  isPlaying: boolean;   // Le jeu est-il en cours ?
  score: number;        // Score de la session actuelle
  coins: number;        // Os collectés dans la session actuelle
  highScore: number;    // Meilleur score de tous les temps
  highCoins: number;    // Meilleur nombre d'os en une session
  gameOver: boolean;    // La partie est-elle terminée ?
  level: number;        // Niveau actuel (non utilisé actuellement)
}

// 🛒 SYSTÈME DE BOUTIQUE ET POUVOIRS

/**
 * Pouvoir achetable dans la boutique
 * Système avec utilisations limitées et durées
 */
export interface PowerUp {
  id: string;                    // Identifiant unique du pouvoir
  name: string;                  // Nom affiché dans l'interface
  description: string;           // Description détaillée du pouvoir
  cost: number;                  // Coût en os pour acheter le pouvoir
  icon: string;                  // Emoji ou icône pour l'affichage
  owned: boolean;                // Le joueur possède-t-il ce pouvoir ?
  active: boolean;               // Le pouvoir est-il actuellement actif ?
  duration?: number;             // Durée en secondes (optionnel pour les pouvoirs permanents)
  usesRemaining?: number;        // Nombre d'utilisations restantes
  maxUses?: number;              // Nombre maximum d'utilisations par achat
}

/**
 * État de la boutique de pouvoirs
 * Gère l'ouverture/fermeture et la liste des pouvoirs
 */
export interface ShopState {
  isOpen: boolean;              // La boutique est-elle ouverte ?
  availablePowers: PowerUp[];   // Liste de tous les pouvoirs disponibles
}