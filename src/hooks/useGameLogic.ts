import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Obstacle, Collectible, Particle, GameState, PowerUp, ShopState } from '../types/GameTypes';
import { GAME_CONFIG, checkCollision, isOffScreen, createParticle, updateParticles, getRandomColor, getGameSpeed, getCoinColor } from '../utils/GameUtils';

/**
 * 🎮 HOOK PRINCIPAL DE LOGIQUE DE JEU - useGameLogic
 * 
 * Ce hook custom contient TOUTE la logique métier du jeu Doge Astronaut :
 * 
 * 🎯 RESPONSABILITÉS PRINCIPALES :
 * - Gestion de l'état du jeu (score, vies, vitesse, etc.)
 * - Physique du joueur (gravité, saut, collision)
 * - Génération procédurale d'obstacles et collectibles
 * - Système de pouvoirs avec utilisations limitées
 * - Persistance des données (localStorage)
 * - Boucle de jeu principale (game loop)
 * 
 * 🏗️ ARCHITECTURE :
 * - État React avec useState pour la réactivité
 * - useEffect pour les effets de bord et la persistance
 * - useCallback pour l'optimisation des performances
 * - useRef pour les références mutables (game loop, clavier)
 * 
 * 💾 PERSISTANCE :
 * - Scores et records dans localStorage
 * - Monnaies (os, DOGEVISION) sauvegardées automatiquement
 * - Utilisations des pouvoirs persistantes entre sessions
 * 
 * 🎮 SYSTÈMES IMPLÉMENTÉS :
 * - Physique réaliste avec gravité et momentum
 * - Collision detection précise
 * - Génération d'obstacles avec espacement exact
 * - Système de vies avec invulnérabilité temporaire
 * - Pouvoirs avec durées et utilisations limitées
 * - Collection magnétique et multiplicateurs
 * 
 * 📱 ADAPTATIONS MOBILES NÉCESSAIRES :
 * - Remplacer les événements clavier par des contrôles tactiles
 * - Optimiser la boucle de jeu pour les performances mobiles
 * - Adapter les constantes de physique pour l'écran tactile
 * - Implémenter la vibration pour le feedback haptique
 */
export const useGameLogic = () => {
  // 🎮 ÉTAT PRINCIPAL DU JEU
  // Contient toutes les informations sur l'état actuel de la partie
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,    // Le jeu est-il en cours ?
    score: 0,            // Score de la session actuelle
    coins: 0,            // Os collectés dans la session actuelle
    highScore: parseInt(localStorage.getItem('dogeHighScore') || '0'),  // Meilleur score persistant
    highCoins: parseInt(localStorage.getItem('dogeHighCoins') || '0'),  // Meilleur nombre d'os persistant
    gameOver: false,     // État de fin de partie
    level: 1,            // Niveau actuel (non utilisé actuellement)
  });

  // 💰 MONNAIES PERSISTANTES
  // Ces valeurs sont sauvegardées automatiquement dans localStorage
  const [totalCoinsCollected, setTotalCoinsCollected] = useState<number>(
    parseInt(localStorage.getItem('dogeTotalCoins') || '0')
  );

  // 🪙 DOGEVISION - Monnaie premium
  // Obtenue en échangeant 1000 os contre 100 DOGEVISION
  const [dogevisions, setDogevisions] = useState<number>(
    parseInt(localStorage.getItem('dogeDogevisions') || '0')
  );

  // 🛡️ SYSTÈME DE VIES
  // Par défaut 1 vie, peut être augmenté à 3 avec le pouvoir "3 Lives"
  const [lives, setLives] = useState<number>(1);                    // Vies actuelles
  const [maxLives, setMaxLives] = useState<number>(1);              // Vies maximales
  const [isInvulnerable, setIsInvulnerable] = useState<boolean>(false); // Invulnérabilité temporaire (2s après dégâts)

  // 🛒 BOUTIQUE DE POUVOIRS
  // Système complet avec 3 pouvoirs, chacun ayant 2 utilisations maximum
  const [shopState, setShopState] = useState<ShopState>({
    isOpen: false,
    availablePowers: [
      // ⚡ POUVOIR 1 : Collecteur x2 (25 os, 2 utilisations)
      // Double la valeur des os pendant 30 secondes
      {
        id: 'double_collector',
        name: '2x Collector',
        description: 'Double the value of all collected bones for 30 seconds (2 uses)',
        cost: 25,
        icon: '⚡',
        owned: false,
        active: false,
        duration: 30,
        usesRemaining: parseInt(localStorage.getItem('dogeDoubleCollectorUses') || '0'),
        maxUses: 2,
      },
      // 🧲 POUVOIR 2 : Collecteur Magnétique (50 os, 2 utilisations)
      // Collection automatique des os à distance pendant toute la partie
      {
        id: 'magnetic_collector',
        name: 'Magnetic Collector',
        description: 'Automatically collect all bones at distance for the entire game (2 uses)',
        cost: 50,
        icon: '🧲',
        owned: false,
        active: false,
        duration: 999, // Toute la partie (très long)
        usesRemaining: parseInt(localStorage.getItem('dogeMagneticCollectorUses') || '0'),
        maxUses: 2,
      },
      // 🛡️ POUVOIR 3 : Trois Vies (100 os, 2 utilisations)
      // Donne 3 vies au lieu d'une, avec invulnérabilité temporaire
      {
        id: 'three_lives',
        name: '3 Lives',
        description: 'Get 3 lives instead of just one! Survive 2 additional collisions (2 uses)',
        cost: 100,
        icon: '🛡️',
        owned: false,
        active: false,
        duration: 999, // Toute la partie
        usesRemaining: parseInt(localStorage.getItem('dogeThreeLivesUses') || '0'),
        maxUses: 2,
      },
    ],
  });

  // 🎮 POUVOIRS ACTIFS
  // Stocke les timestamps de fin pour chaque pouvoir actif
  const [activePowers, setActivePowers] = useState<{[key: string]: number}>({});

  // 🎮 ÉTAT DU JOUEUR
  // Position, vélocité, état de saut et propriétés physiques
  const [player, setPlayer] = useState<Player>({
    position: { x: 100, y: GAME_CONFIG.GROUND_Y - 60 },  // Position initiale
    velocity: { x: 0, y: 0 },
    width: 60,
    height: 70,
    active: true,
    isJumping: false,
    isGrounded: true,
    jumpCount: 0,
    maxJumps: 1,  // Un seul saut autorisé (pas de double saut)
  });

  // 🎯 ENTITÉS DU JEU
  // Tableaux contenant tous les objets dynamiques du jeu
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // 🌟 ÉLÉMENTS VISUELS
  // Étoiles pour le parallax et effets de profondeur
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number }>>([]);
  
  // 🌍 ÉTAT DU MONDE
  // Variables pour le scrolling et la génération procédurale
  const [worldOffset, setWorldOffset] = useState(0);
  const [nextObstacleX, setNextObstacleX] = useState(GAME_CONFIG.CANVAS_WIDTH + 100);
  const [currentSpeed, setCurrentSpeed] = useState(GAME_CONFIG.BASE_SCROLL_SPEED);

  // 🔄 RÉFÉRENCES POUR LA BOUCLE DE JEU
  // useRef pour éviter les re-renders et maintenir les références
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());  // Touches actuellement pressées

  // Initialize stars
  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH * 2,
      y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    setStars(newStars);
  }, []);

  // 🛒 FONCTIONS DE GESTION DE LA BOUTIQUE
  
  /**
   * Ouvre la boutique de pouvoirs
   * Utilisé depuis l'interface utilisateur (bouton SHOP, touche S)
   */
  const openShop = useCallback(() => {
    setShopState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeShop = useCallback(() => {
    setShopState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 🪙 SYSTÈME D'ÉCHANGE DOGEVISION
  
  /**
   * Échange des os contre des DOGEVISION
   * Taux : 1000 os = 100 DOGEVISION
   * @returns Objet avec succès, DOGEVISION ajoutés et os dépensés
   */
  const exchangeForDogevision = useCallback(() => {
    const EXCHANGE_RATE = 1000; // 1000 os = 1 DOGEVISION
    const maxExchangeable = Math.floor(totalCoinsCollected / EXCHANGE_RATE);
    
    if (maxExchangeable > 0) {
      const osToSpend = maxExchangeable * EXCHANGE_RATE;
      const dogevisionsToAdd = maxExchangeable * 100; // 1000 os = 100 DOGEVISION
      
      // Déduire les os
      const newTotalCoins = totalCoinsCollected - osToSpend;
      setTotalCoinsCollected(newTotalCoins);
      localStorage.setItem('dogeTotalCoins', newTotalCoins.toString());
      
      // Ajouter les DOGEVISION
      const newDogevisions = dogevisions + dogevisionsToAdd;
      setDogevisions(newDogevisions);
      localStorage.setItem('dogeDogevisions', newDogevisions.toString());
      
      console.log(`🪙 Échange réussi ! ${osToSpend} os → ${dogevisionsToAdd} DOGEVISION`);
      return { success: true, dogevisionsAdded: dogevisionsToAdd, osSpent: osToSpend };
    }
    
    return { success: false, dogevisionsAdded: 0, osSpent: 0 };
  }, [totalCoinsCollected, dogevisions]);

  /**
   * Achète un pouvoir dans la boutique
   * Déduit le coût du total des os et ajoute des utilisations au pouvoir
   * @param powerId - ID du pouvoir à acheter
   */
  const buyPower = useCallback((powerId: string) => {
    const power = shopState.availablePowers.find(p => p.id === powerId);
    if (!power || totalCoinsCollected < power.cost) return;

    // Déduire le coût du total des os
    const newTotal = totalCoinsCollected - power.cost;
    setTotalCoinsCollected(newTotal);
    localStorage.setItem('dogeTotalCoins', newTotal.toString());

    // Ajouter les utilisations au pouvoir
    const newUsesRemaining = (power.usesRemaining || 0) + (power.maxUses || 1);
    
    // Sauvegarder les utilisations dans localStorage selon le type de pouvoir
    if (powerId === 'double_collector') {
      localStorage.setItem('dogeDoubleCollectorUses', newUsesRemaining.toString());
    } else if (powerId === 'magnetic_collector') {
      localStorage.setItem('dogeMagneticCollectorUses', newUsesRemaining.toString());
    } else if (powerId === 'three_lives') {
      localStorage.setItem('dogeThreeLivesUses', newUsesRemaining.toString());
    }

    // Mettre à jour l'état du pouvoir
    setShopState(prev => ({
      ...prev,
      availablePowers: prev.availablePowers.map(p =>
        p.id === powerId ? { 
          ...p, 
          owned: true, 
          usesRemaining: newUsesRemaining 
        } : p
      ),
    }));

    // Fermer la boutique après achat
    closeShop();
  }, [shopState.availablePowers, totalCoinsCollected, closeShop]);

  // 🎮 SYSTÈME D'ACTIVATION DES POUVOIRS
  
  /**
   * Active un pouvoir si des utilisations sont disponibles
   * @param powerId - ID du pouvoir à utiliser
   */
  const usePower = useCallback((powerId: string) => {
    const power = shopState.availablePowers.find(p => p.id === powerId);
    if (!power || !power.usesRemaining || power.usesRemaining <= 0) return;

    // Activer le pouvoir
    if (power.duration) {
      setActivePowers(prev => ({
        ...prev,
        [powerId]: Date.now() + (power.duration! * 1000),
      }));
    }

    // 🛡️ Activation spéciale du pouvoir 3 vies
    if (powerId === 'three_lives') {
      setLives(3);
      setMaxLives(3);
      console.log('🛡️ 3 Lives power activated! Lives: 3/3');
    }

    // Décrémenter les utilisations
    const newUsesRemaining = power.usesRemaining - 1;
    
    // Sauvegarder selon le type de pouvoir
    if (powerId === 'double_collector') {
      localStorage.setItem('dogeDoubleCollectorUses', newUsesRemaining.toString());
    } else if (powerId === 'magnetic_collector') {
      localStorage.setItem('dogeMagneticCollectorUses', newUsesRemaining.toString());
    } else if (powerId === 'three_lives') {
      localStorage.setItem('dogeThreeLivesUses', newUsesRemaining.toString());
    }

    // Mettre à jour l'état du pouvoir
    setShopState(prev => ({
      ...prev,
      availablePowers: prev.availablePowers.map(p =>
        p.id === powerId ? { 
          ...p, 
          usesRemaining: newUsesRemaining,
          active: true 
        } : p
      ),
    }));
  }, [shopState.availablePowers]);

  // 🎮 GESTION DE L'EXPIRATION DES POUVOIRS
  
  /**
   * Vérifie toutes les secondes si des pouvoirs ont expiré
   */
  useEffect(() => {
    const checkPowerExpiration = () => {
      const now = Date.now();
      setActivePowers(prev => {
        const updated = { ...prev };
        let hasExpired = false;

        Object.keys(updated).forEach(powerId => {
          if (updated[powerId] <= now) {
            delete updated[powerId];
            hasExpired = true;
            
            // 🛡️ Désactivation spéciale du pouvoir 3 vies
            if (powerId === 'three_lives') {
              setLives(1);
              setMaxLives(1);
              console.log('🛡️ 3 Lives power expired! Back to 1 life');
            }
          }
        });

        if (hasExpired) {
          // Mettre à jour l'état des pouvoirs dans la boutique
          setShopState(prevShop => ({
            ...prevShop,
            availablePowers: prevShop.availablePowers.map(p => ({
              ...p,
              active: updated[p.id] ? true : false,
            })),
          }));
        }

        return updated;
      });
    };

    const interval = setInterval(checkPowerExpiration, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🦘 SYSTÈME DE SAUT
  
  /**
   * Fait sauter le joueur si les conditions sont remplies
   * Un seul saut autorisé, uniquement quand le joueur est au sol
   */
  const jump = useCallback(() => {
    // Seulement si le joueur est au sol (pas de double saut)
    if (player.isGrounded && player.jumpCount === 0) {
      setPlayer(prev => ({
        ...prev,
        velocity: { ...prev.velocity, y: GAME_CONFIG.JUMP_FORCE },
        isJumping: true,
        isGrounded: false,
        jumpCount: 1, // Un seul saut utilisé
      }));

      // Add jump particles
      const jumpParticles = Array.from({ length: 5 }, () =>
        createParticle(
          { x: player.position.x + player.width / 2, y: player.position.y + player.height },
          getRandomColor()
        )
      );
      setParticles(prev => [...prev, ...jumpParticles]);
    }
  }, [player.isGrounded, player.jumpCount, player.position]);

  // 🎮 GESTION DU DÉMARRAGE DE PARTIE
  
  /**
   * Démarre une nouvelle partie
   * Réinitialise tous les états et active automatiquement les pouvoirs disponibles
   */
  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: true, gameOver: false, score: 0, coins: 0 }));
    setPlayer(prev => ({
      ...prev,
      position: { x: 100, y: GAME_CONFIG.GROUND_Y - 70 },
      velocity: { x: 0, y: 0 },
      isGrounded: true,
      jumpCount: 0,
    }));
    setObstacles([]);
    setCollectibles([]);
    setParticles([]);
    setWorldOffset(0);
    setNextObstacleX(GAME_CONFIG.CANVAS_WIDTH + 100);
    setCurrentSpeed(GAME_CONFIG.BASE_SCROLL_SPEED);
    closeShop(); // Fermer la boutique si elle est ouverte

    // 🛡️ Réinitialisation des vies
    setLives(1);
    setMaxLives(1);
    setIsInvulnerable(false);

    // 🎮 Auto-activation des pouvoirs disponibles
    const doubleCollectorPower = shopState.availablePowers.find(p => p.id === 'double_collector');
    if (doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0) {
      usePower('double_collector');
    }

    // 🧲 Auto-activation de l'aimant magnétique
    const magneticPower = shopState.availablePowers.find(p => p.id === 'magnetic_collector');
    if (magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0) {
      usePower('magnetic_collector');
    }

    // 🛡️ Auto-activation du pouvoir 3 vies
    const threeLivesPower = shopState.availablePowers.find(p => p.id === 'three_lives');
    if (threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0) {
      usePower('three_lives');
    }
  }, [closeShop, shopState.availablePowers, usePower]);

  // 💀 GESTION DE FIN DE PARTIE
  
  /**
   * Termine la partie et sauvegarde les records
   * Désactive tous les pouvoirs actifs et réinitialise les vies
   * Met à jour les meilleurs scores dans localStorage
   */
  const gameOver = useCallback(() => {
    console.log('💀 GAME OVER! Lives remaining:', lives);
    
    // 🚨 DÉSACTIVER IMMÉDIATEMENT TOUS LES POUVOIRS ACTIFS
    setActivePowers({});
    
    // 🛡️ Réinitialisation des vies
    setLives(1);
    setMaxLives(1);
    setIsInvulnerable(false);
    
    // 🚨 METTRE À JOUR L'ÉTAT DES POUVOIRS DANS LA BOUTIQUE
    setShopState(prev => ({
      ...prev,
      availablePowers: prev.availablePowers.map(p => ({
        ...p,
        active: false, // Désactiver tous les pouvoirs
      })),
    }));

    setGameState(prev => {
      const newHighScore = Math.max(prev.score, prev.highScore);
      const newHighCoins = Math.max(prev.coins, prev.highCoins);
      localStorage.setItem('dogeHighScore', newHighScore.toString());
      localStorage.setItem('dogeHighCoins', newHighCoins.toString());
      return {
        ...prev,
        isPlaying: false,
        gameOver: true,
        highScore: newHighScore,
        highCoins: newHighCoins,
      };
    });

    // Add explosion particles
    const explosionParticles = Array.from({ length: 20 }, () =>
      createParticle(
        { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 },
        getRandomColor()
      )
    );
    setParticles(prev => [...prev, ...explosionParticles]);
  }, [player.position, lives]);

  // 🛡️ SYSTÈME DE PERTE DE VIE
  
  /**
   * Gère la perte d'une vie lors d'une collision
   * Si plus d'une vie : perte d'une vie + invulnérabilité temporaire
   * Si dernière vie : game over
   */
  const loseLife = useCallback(() => {
    // Vérifier si le joueur est invulnérable (période de grâce après avoir perdu une vie)
    if (isInvulnerable) {
      console.log('🛡️ Player invulnerable, collision ignored');
      return;
    }

    console.log('💥 Collision detected! Lives before:', lives, '/', maxLives);
    
    if (lives > 1) {
      // Perdre une vie mais continuer à jouer
      const newLives = lives - 1;
      setLives(newLives);
      console.log('❤️ Life lost! Lives remaining:', newLives, '/', maxLives);
      
      // Période d'invulnérabilité de 2 secondes
      setIsInvulnerable(true);
      setTimeout(() => {
        setIsInvulnerable(false);
        console.log('🛡️ Invulnerability ended');
      }, 2000);
      
      // Effet visuel de perte de vie (particules rouges)
      const damageParticles = Array.from({ length: 15 }, () =>
        createParticle(
          { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 },
          '#ef4444' // Rouge pour les dégâts
        )
      );
      setParticles(prev => [...prev, ...damageParticles]);
      
    } else {
      // Plus de vies = Game Over
      console.log('💀 No more lives! Game Over');
      gameOver();
    }
  }, [lives, maxLives, isInvulnerable, player.position, gameOver]);

  // 🦴 SYSTÈME DE COLLECTION D'OS
  
  /**
   * Collecte un os et met à jour les scores
   * Gère les multiplicateurs et la persistance des données
   * @param coin - L'os à collecter
   */
  const collectCoin = useCallback((coin: Collectible) => {
    // Vérifier si l'os n'est pas déjà collecté
    if (coin.collected || !coin.active) return;

    // Marquer la pièce comme collectée IMMÉDIATEMENT
    setCollectibles(prev => prev.map(c => 
      c === coin ? { ...c, collected: true, active: false } : c
    ));

    // 🎮 Calcul de la valeur avec multiplicateur
    const isDoubleCollectorActive = activePowers.double_collector && activePowers.double_collector > Date.now();
    const coinValue = isDoubleCollectorActive ? coin.value * 2 : coin.value;
    const coinsToAdd = isDoubleCollectorActive ? 2 : 1;

    // Ajouter des points et des pièces (session actuelle)
    setGameState(prev => ({ 
      ...prev, 
      score: prev.score + coinValue,
      coins: prev.coins + coinsToAdd
    }));

    // Mise à jour du total persistant
    setTotalCoinsCollected(prev => {
      const newTotal = prev + coinsToAdd;
      localStorage.setItem('dogeTotalCoins', newTotal.toString());
      return newTotal;
    });

    // 🧲 Effets visuels selon les pouvoirs actifs
    const isMagneticActive = activePowers.magnetic_collector && activePowers.magnetic_collector > Date.now();
    const particleCount = isDoubleCollectorActive ? 16 : 8;
    const particleColor = isMagneticActive ? '#00ffff' : isDoubleCollectorActive ? '#ffd700' : getCoinColor();
    
    const coinParticles = Array.from({ length: particleCount }, () =>
      createParticle(
        { x: coin.position.x + coin.width / 2, y: coin.position.y + coin.height / 2 },
        particleColor
      )
    );
    setParticles(prev => [...prev, ...coinParticles]);
  }, [activePowers]);

  // 🔄 BOUCLE PRINCIPALE DU JEU
  
  /**
   * Boucle de jeu principale exécutée à chaque frame
   * Gère la physique, les collisions, la génération d'obstacles et la progression
   * Utilise requestAnimationFrame pour une animation fluide à 60 FPS
   */
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying) return;

    // Calculer la vitesse actuelle basée sur le score
    const newSpeed = getGameSpeed(gameState.score);
    setCurrentSpeed(newSpeed);

    // Mise à jour du défilement du monde
    setWorldOffset(prev => prev + newSpeed);

    // Update player
    setPlayer(prev => {
      const newVelocity = { ...prev.velocity };
      const newPosition = { ...prev.position };

      // Apply gravity
      newVelocity.y += GAME_CONFIG.GRAVITY;

      // Update position
      newPosition.y += newVelocity.y;

      // Ground collision
      const groundY = GAME_CONFIG.GROUND_Y - prev.height;
      if (newPosition.y >= groundY) {
        newPosition.y = groundY;
        newVelocity.y = 0;
        return {
          ...prev,
          position: newPosition,
          velocity: newVelocity,
          isGrounded: true,
          isJumping: false,
          jumpCount: 0, // Reset du compteur de saut quand on touche le sol
        };
      }

      return {
        ...prev,
        position: newPosition,
        velocity: newVelocity,
        isGrounded: false,
      };
    });

    // 🎯 GÉNÉRATION D'OBSTACLES avec espacement exact de 200px
    const currentWorldX = worldOffset + GAME_CONFIG.CANVAS_WIDTH;
    
    if (currentWorldX >= nextObstacleX) {
      const obstacleTypes = ['meteorite', 'rock', 'flag'];
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      // Taille uniforme pour tous les obstacles
      const width = 60;
      const height = 60;
      
      const newObstacle: Obstacle = {
        position: { 
          x: nextObstacleX - worldOffset, // Position relative à l'écran
          y: GAME_CONFIG.GROUND_Y - height // Positionné exactement sur le sol
        },
        velocity: { x: 0, y: 0 }, // Statique
        width,
        height,
        active: true,
        type: type as 'meteorite' | 'rock' | 'flag',
        rotation: 0,
        rotationSpeed: 0, // Pas de rotation
      };
      
      setObstacles(prev => [...prev, newObstacle]);
      
      // ✨ GÉNÉRATION D'OS GARANTI entre chaque obstacle
      const bonePositionOptions = [
        // En l'air, hauteur de saut très facile (50px du sol - très accessible)
        { x: nextObstacleX + width + 60, y: GAME_CONFIG.GROUND_Y - 60, difficulty: 'easy' },
        { x: nextObstacleX + width + 100, y: GAME_CONFIG.GROUND_Y - 60, difficulty: 'easy' },
        { x: nextObstacleX + width + 140, y: GAME_CONFIG.GROUND_Y - 60, difficulty: 'easy' },
        
        // En l'air, hauteur de saut normale (65px du sol - saut facile requis)
        { x: nextObstacleX + width + 80, y: GAME_CONFIG.GROUND_Y - 75, difficulty: 'medium' },
        { x: nextObstacleX + width + 120, y: GAME_CONFIG.GROUND_Y - 75, difficulty: 'medium' },
        
        // En l'air, hauteur de saut élevée (80px du sol - saut moyen requis)
        { x: nextObstacleX + width + 90, y: GAME_CONFIG.GROUND_Y - 90, difficulty: 'hard' },
        { x: nextObstacleX + width + 110, y: GAME_CONFIG.GROUND_Y - 90, difficulty: 'hard' },
        
        // En l'air, hauteur de saut très élevée (95px du sol - défi modéré)
        { x: nextObstacleX + width + 100, y: GAME_CONFIG.GROUND_Y - 105, difficulty: 'expert' },
      ];
      
      // 🎯 Probabilités pondérées favorisant les hauteurs faciles
      const difficultyWeights = [
        0.45, // Facile position 1 (45% - encore augmenté)
        0.30, // Facile position 2 (30% - encore augmenté)
        0.15, // Facile position 3 (15% - diminué)
        0.05, // Moyen position 1 (5% - encore diminué)
        0.03, // Moyen position 2 (3% - encore diminué)
        0.02, // Difficile position 1 (2% - encore diminué)
        0.00, // Difficile position 2 (0% - supprimé)
        0.00, // Expert (0% - supprimé pour faciliter)
      ];
      
      // Sélection pondérée pour varier la difficulté
      const random = Math.random();
      let cumulativeWeight = 0;
      let selectedIndex = 0;
      
      for (let i = 0; i < difficultyWeights.length; i++) {
        cumulativeWeight += difficultyWeights[i];
        if (random <= cumulativeWeight) {
          selectedIndex = i;
          break;
        }
      }
      
      const bonePosition = bonePositionOptions[selectedIndex];
      
      // Création de l'os garanti (toujours en l'air)
      const newBone: Collectible = {
        position: { 
          x: bonePosition.x - worldOffset,
          y: bonePosition.y // ✅ TOUJOURS en l'air, jamais au sol !
        },
        velocity: { x: 0, y: 0 },
        width: 65, // ENCORE PLUS GRAND : 55 → 65 (+10px de plus)
        height: 65, // ENCORE PLUS GRAND : 55 → 65 (+10px de plus)
        active: true,
        type: 'coin',
        collected: false,
        animation: 0, // Pour l'effet flottant
        value: GAME_CONFIG.COIN_VALUE,
        magnetized: false, // Pour l'effet d'aimant
      };
      
      setCollectibles(prev => [...prev, newBone]);
      
      // Position du prochain obstacle
      setNextObstacleX(nextObstacleX + width + 200);
    }

    // Update obstacles (défilement par rapport au monde) avec la vitesse progressive
    setObstacles(prev => prev
      .map(obstacle => ({
        ...obstacle,
        // Les obstacles bougent vers la gauche par rapport au défilement
        position: {
          ...obstacle.position,
          x: obstacle.position.x - newSpeed,
        }
      }))
      .filter(obstacle => !isOffScreen(obstacle))
    );

    // Mise à jour des collectibles avec effet flottant
    setCollectibles(prev => prev
      .map(collectible => ({
        ...collectible,
        position: {
          ...collectible.position,
          x: collectible.position.x - newSpeed,
        },
        // Animation flottante
        animation: collectible.animation + 0.08, // Vitesse d'oscillation douce
      }))
      .filter(collectible => !isOffScreen(collectible) && collectible.active)
    );

    // Update particles
    setParticles(prev => updateParticles(prev));

    // Update score
    setGameState(prev => ({ ...prev, score: prev.score + 1 }));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.score, worldOffset, nextObstacleX]);

  // 🎯 DÉTECTION DE COLLISIONS
  
  /**
   * Vérifie les collisions entre le joueur et les obstacles/collectibles
   * Gère la collection magnétique et les collisions avec le système de vies
   * Exécuté à chaque frame quand le jeu est actif
   */
  useEffect(() => {
    if (!gameState.isPlaying) return;

    // 🛡️ NOUVEAU : Check obstacle collisions avec système de vies
    obstacles.forEach(obstacle => {
      if (checkCollision(player, obstacle)) {
        console.log('💥 COLLISION DETECTED with', obstacle.type, '! Lives:', lives, '/', maxLives, 'Invulnerable:', isInvulnerable);
        // Utiliser le système de vies au lieu de game over immédiat
        loseLife();
      }
    });

    // 🧲 Système de collection (normale ou magnétique)
    const isMagneticActive = activePowers.magnetic_collector && activePowers.magnetic_collector > Date.now();
    
    collectibles.forEach(coin => {
      if (!coin.collected && coin.active) {
        if (isMagneticActive) {
          // 🧲 AIMANT ACTIF : Collection automatique à distance
          const MAGNETIC_RANGE = 150;
          
          // Calcul de distance pour la collection magnétique
          const dx = (player.position.x + player.width / 2) - (coin.position.x + coin.width / 2);
          const dy = (player.position.y + player.height / 2) - (coin.position.y + coin.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Si l'os est dans la portée magnétique, le collecter automatiquement
          if (distance <= MAGNETIC_RANGE) {
            collectCoin(coin);
          }
        } else {
          // 🎯 COLLECTION NORMALE : Contact direct requis
          if (checkCollision(player, coin)) {
            collectCoin(coin);
          }
        }
      }
    });
  }, [gameState.isPlaying, obstacles, collectibles, player, loseLife, collectCoin, activePowers, lives, maxLives, isInvulnerable]);

  // 💾 SYNCHRONISATION AVEC LOCALSTORAGE
  
  /**
   * Charge les utilisations des pouvoirs depuis localStorage au démarrage
   */
  useEffect(() => {
    // Synchroniser les utilisations depuis localStorage au démarrage
    setShopState(prev => ({
      ...prev,
      availablePowers: prev.availablePowers.map(p => {
        if (p.id === 'double_collector') {
          return {
            ...p,
            usesRemaining: parseInt(localStorage.getItem('dogeDoubleCollectorUses') || '0'),
          };
        } else if (p.id === 'magnetic_collector') {
          return {
            ...p,
            usesRemaining: parseInt(localStorage.getItem('dogeMagneticCollectorUses') || '0'),
          };
        } else if (p.id === 'three_lives') {
          return {
            ...p,
            usesRemaining: parseInt(localStorage.getItem('dogeThreeLivesUses') || '0'),
          };
        }
        return p;
      }),
    }));
  }, []);

  // ⌨️ GESTION DES ÉVÉNEMENTS CLAVIER
  
  /**
   * Gère les contrôles clavier du jeu
   * ESPACE : Saut ou démarrage de partie
   * S : Ouverture/fermeture de la boutique
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.isPlaying) {
          jump();
        } else if (!shopState.isOpen) {
          startGame();
        }
      }
      // Gestion de la boutique avec la touche S
      if (e.code === 'KeyS' && !gameState.isPlaying) {
        e.preventDefault();
        if (shopState.isOpen) {
          closeShop();
        } else {
          openShop();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, shopState.isOpen, jump, startGame, openShop, closeShop]);

  // 🔄 DÉMARRAGE/ARRÊT DE LA BOUCLE DE JEU
  
  /**
   * Démarre ou arrête la boucle de jeu selon l'état isPlaying
   */
  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameLoop]);

  // 🎯 RETOUR DU HOOK
  
  /**
   * Retourne tous les états et fonctions nécessaires à l'interface utilisateur
   * Ce hook encapsule toute la logique métier et expose une API simple
   * pour les composants React
   */
  return {
    gameState,
    player,
    obstacles,
    collectibles,
    particles,
    stars,
    worldOffset,
    currentSpeed,
    totalCoinsCollected,    // Total des os collectés (persistant)
    dogevisions,           // Monnaie premium DOGEVISION
    shopState,             // État de la boutique
    activePowers,          // Pouvoirs actuellement actifs
    lives,                 // Vies actuelles
    maxLives,              // Vies maximales
    startGame,
    jump,
    openShop,              // Ouvrir la boutique
    closeShop,             // Fermer la boutique
    buyPower,              // Acheter un pouvoir
    usePower,              // Utiliser un pouvoir
    exchangeForDogevision, // Échanger os contre DOGEVISION
  };
};