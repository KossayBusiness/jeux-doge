import { GameObject, Position, Particle } from '../types/GameTypes';

/**
 * 🎮 UTILITAIRES ET CONFIGURATION DU JEU - GameUtils
 * 
 * Ce fichier contient toutes les constantes de configuration du jeu
 * et les fonctions utilitaires pour la physique et les effets visuels.
 * 
 * 🎯 CONTENU PRINCIPAL :
 * - GAME_CONFIG : Toutes les constantes du jeu
 * - Fonctions de physique (collision, vitesse)
 * - Utilitaires pour les particules
 * - Fonctions helper pour le rendu
 * 
 * 📱 ADAPTATIONS MOBILES NÉCESSAIRES :
 * - Ajuster les constantes de physique pour l'écran tactile
 * - Réduire les valeurs de performance (particules, vitesse)
 * - Adapter les tailles selon la résolution d'écran
 * - Optimiser les calculs pour les GPU mobiles
 */

/**
 * 🎮 CONFIGURATION PRINCIPALE DU JEU
 * 
 * Toutes les constantes qui définissent le comportement du jeu.
 * Ces valeurs ont été équilibrées pour une expérience de jeu optimale.
 * 
 * 📱 POUR LA VERSION MOBILE :
 * - CANVAS_WIDTH/HEIGHT : À rendre responsive
 * - GRAVITY/JUMP_FORCE : Peut nécessiter un ajustement pour le tactile
 * - SPAWN_RATE : Réduire sur mobile pour les performances
 * - Toutes les vitesses : Adapter selon la taille d'écran
 */
export const GAME_CONFIG = {
  // 🖼️ DIMENSIONS DU CANVAS (À ADAPTER POUR MOBILE)
  CANVAS_WIDTH: 800,              // Largeur fixe du canvas (800px)
  CANVAS_HEIGHT: 600,             // Hauteur fixe du canvas (600px)
  
  // 🏃‍♂️ PHYSIQUE DU JOUEUR
  GRAVITY: 0.5,                   // Force de gravité (pixels/frame²)
  JUMP_FORCE: -11,                // Force de saut vers le haut (négatif = vers le haut)
  PLAYER_SPEED: 3,                // Vitesse horizontale du joueur (non utilisée actuellement)
  GROUND_Y: 500,                  // Position Y du sol (100px du bas)
  
  // 🎯 OBSTACLES ET COLLECTIBLES
  OBSTACLE_SPEED: 0,              // Vitesse des obstacles (0 = statiques)
  COLLECTIBLE_SPEED: 0,           // Vitesse des collectibles (0 = statiques)
  SPAWN_RATE: 0.015,              // Taux de génération d'obstacles (non utilisé avec système fixe)
  COLLECTIBLE_SPAWN_RATE: 0.02,   // Taux de génération de collectibles (100% garanti)
  
  // 🚀 VITESSE PROGRESSIVE DU JEU
  BASE_SCROLL_SPEED: 4,           // Vitesse de défilement de base (pixels/frame)
  MAX_SCROLL_SPEED: 16,           // Vitesse maximale de défilement
  SPEED_INCREASE_RATE: 0.003,     // Taux d'augmentation de vitesse par point
  
  // 💰 SYSTÈME DE RÉCOMPENSES
  COIN_VALUE: 10,                 // Valeur en points d'un os collecté
};

/**
 * 🚀 CALCUL DE LA VITESSE PROGRESSIVE
 * 
 * Calcule la vitesse actuelle du jeu basée sur le score.
 * Plus le score est élevé, plus le jeu devient rapide.
 * 
 * @param score - Score actuel du joueur
 * @returns Vitesse de défilement en pixels/frame
 * 
 * 📱 MOBILE : Peut nécessiter un ajustement des constantes
 */
export function getGameSpeed(score: number): number {
  const speedIncrease = score * GAME_CONFIG.SPEED_INCREASE_RATE;
  return Math.min(
    GAME_CONFIG.BASE_SCROLL_SPEED + speedIncrease,
    GAME_CONFIG.MAX_SCROLL_SPEED
  );
}

/**
 * 🎯 DÉTECTION DE COLLISION RECTANGULAIRE
 * 
 * Vérifie si deux objets rectangulaires se chevauchent.
 * Utilise l'algorithme AABB (Axis-Aligned Bounding Box).
 * 
 * @param obj1 - Premier objet (généralement le joueur)
 * @param obj2 - Deuxième objet (obstacle ou collectible)
 * @returns true si les objets se touchent, false sinon
 * 
 * 📱 MOBILE : Fonction optimisée, pas de modification nécessaire
 */
export function checkCollision(obj1: GameObject, obj2: GameObject): boolean {
  return (
    obj1.position.x < obj2.position.x + obj2.width &&           // Bord gauche obj1 < bord droit obj2
    obj1.position.x + obj1.width > obj2.position.x &&           // Bord droit obj1 > bord gauche obj2
    obj1.position.y < obj2.position.y + obj2.height &&          // Bord haut obj1 < bord bas obj2
    obj1.position.y + obj1.height > obj2.position.y             // Bord bas obj1 > bord haut obj2
  );
}

/**
 * 🗑️ VÉRIFICATION DE SORTIE D'ÉCRAN
 * 
 * Détermine si un objet est complètement sorti de l'écran à gauche.
 * Utilisé pour nettoyer les objets qui ne sont plus visibles.
 * 
 * @param obj - Objet à vérifier
 * @returns true si l'objet est hors écran, false sinon
 * 
 * 📱 MOBILE : Peut nécessiter un ajustement de la marge (-100)
 */
export function isOffScreen(obj: GameObject): boolean {
  return obj.position.x + obj.width < -100;  // Marge de 100px pour éviter les coupures visuelles
}

/**
 * ✨ CRÉATION DE PARTICULES
 * 
 * Crée une particule pour les effets visuels (explosions, collections).
 * Les particules ont une physique simple avec vélocité aléatoire.
 * 
 * @param position - Position initiale de la particule
 * @param color - Couleur CSS de la particule
 * @returns Nouvelle particule avec propriétés aléatoires
 * 
 * 📱 MOBILE : Réduire maxLife et size pour les performances
 */
export function createParticle(position: Position, color: string): Particle {
  return {
    position: { ...position },                    // Copie de la position initiale
    velocity: {
      x: (Math.random() - 0.5) * 8,              // Vitesse X aléatoire (-4 à +4)
      y: (Math.random() - 0.5) * 8,              // Vitesse Y aléatoire (-4 à +4)
    },
    life: 30,                                     // Durée de vie en frames (0.5 seconde à 60 FPS)
    maxLife: 30,                                  // Durée maximale pour le calcul du fade
    color,
    size: Math.random() * 4 + 2,                  // Taille aléatoire (2 à 6 pixels)
  };
}

/**
 * 🔄 MISE À JOUR DES PARTICULES
 * 
 * Met à jour toutes les particules : position, vélocité, durée de vie.
 * Applique la friction et filtre les particules mortes.
 * 
 * @param particles - Tableau des particules à mettre à jour
 * @returns Nouveau tableau avec particules mises à jour et filtrées
 * 
 * 📱 MOBILE : Fonction optimisée, pas de modification nécessaire
 */
export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(particle => ({
      ...particle,
      // Mise à jour de la position
      position: {
        x: particle.position.x + particle.velocity.x,
        y: particle.position.y + particle.velocity.y,
      },
      // Application de la friction (98% de la vitesse conservée)
      velocity: {
        x: particle.velocity.x * 0.98,
        y: particle.velocity.y * 0.98,
      },
      life: particle.life - 1,                   // Diminution de la durée de vie
    }))
    .filter(particle => particle.life > 0);      // Suppression des particules mortes
}

/**
 * 🎨 COULEUR ALÉATOIRE POUR LES PARTICULES
 * 
 * Retourne une couleur aléatoire parmi une palette prédéfinie.
 * Utilisé pour les effets de particules variés.
 * 
 * @returns Couleur CSS hexadécimale
 * 
 * 📱 MOBILE : Pas de modification nécessaire
 */
export function getRandomColor(): string {
  const colors = ['#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 🦴 COULEUR SPÉCIFIQUE POUR LES OS
 * 
 * Retourne la couleur dorée utilisée pour les os collectibles.
 * Assure la cohérence visuelle des collectibles.
 * 
 * @returns Couleur dorée en hexadécimal
 * 
 * 📱 MOBILE : Pas de modification nécessaire
 */
export function getCoinColor(): string {
  return '#fbbf24'; // Couleur dorée pour les os
}