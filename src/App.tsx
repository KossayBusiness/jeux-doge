import React, { useRef, useState, useEffect } from 'react';
import { Rocket, Trophy, Star, Zap, Coins, Wallet, Play, RotateCcw, Sparkles, Target, Award, Crown, ShoppingCart, X, Clock, ArrowRightLeft, Heart } from 'lucide-react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameRenderer } from './components/GameRenderer';
import { GAME_CONFIG, getGameSpeed } from './utils/GameUtils';

/**
 * 🚀 DOGE ASTRONAUT - Composant principal de l'application
 * 
 * Ce composant gère l'interface utilisateur complète du jeu, incluant :
 * - 🎮 Écrans de menu, jeu, boutique et game over
 * - 🎨 Animations de fond (étoiles scintillantes, nébuleuses)
 * - 📊 Affichage des statistiques et HUD en temps réel
 * - 🛒 Système de boutique avec pouvoirs et échanges
 * - 💾 Gestion des événements utilisateur (clavier, clic)
 * 
 * ARCHITECTURE :
 * - Logique métier déléguée à useGameLogic hook
 * - Rendu graphique délégué à GameRenderer component
 * - Interface responsive avec Tailwind CSS
 * - Animations CSS et JavaScript combinées
 * 
 * POUR LA VERSION MOBILE :
 * - Remplacer les événements clavier par des contrôles tactiles
 * - Adapter les tailles de Canvas et UI pour mobile
 * - Optimiser les animations pour les performances mobiles
 * - Implémenter des gestes tactiles (tap, swipe)
 */
function App() {
  // 🎮 Référence au Canvas pour le rendu du jeu
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 🎯 Hook principal contenant toute la logique métier du jeu
  const {
    gameState,              // État global : score, coins, isPlaying, gameOver
    player,                 // État du joueur : position, vélocité, saut
    obstacles,              // Tableau des obstacles (météorites, rochers, drapeaux)
    collectibles,           // Tableau des os à collecter
    particles,              // Système de particules pour les effets visuels
    stars,                  // Étoiles du background avec parallax
    worldOffset,            // Décalage du monde pour l'effet de scrolling
    currentSpeed,           // Vitesse actuelle du jeu (progressive)
    totalCoinsCollected,    // Total des os collectés (persistant)
    dogevisions,            // Monnaie premium DOGEVISION
    shopState,              // État de la boutique (ouvert/fermé, pouvoirs)
    activePowers,           // Pouvoirs actuellement actifs avec timestamps
    lives,                  // Vies actuelles du joueur
    maxLives,               // Vies maximales (1 par défaut, 3 avec pouvoir)
    startGame,              // Fonction pour démarrer une nouvelle partie
    jump,                   // Fonction pour faire sauter le joueur
    openShop,               // Fonction pour ouvrir la boutique
    closeShop,              // Fonction pour fermer la boutique
    buyPower,               // Fonction pour acheter un pouvoir
    exchangeForDogevision,  // Fonction pour échanger os contre DOGEVISION
  } = useGameLogic();

  // 🌟 État pour les étoiles animées du background
  // Ces étoiles créent un effet de profondeur et d'immersion spatiale
  const [backgroundStars, setBackgroundStars] = useState<Array<{
    x: number;              // Position horizontale
    y: number;              // Position verticale
    size: number;           // Taille de l'étoile (1-4px)
    opacity: number;        // Opacité actuelle (0-1)
    twinkleSpeed: number;   // Vitesse de scintillement
    twinklePhase: number;   // Phase actuelle de l'animation
  }>>([]);

  // 🌟 Initialisation des étoiles du background au chargement
  // Génère 150 étoiles avec des propriétés aléatoires pour un effet naturel
  useEffect(() => {
    const newBackgroundStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,        // Position aléatoire sur la largeur
      y: Math.random() * window.innerHeight,       // Position aléatoire sur la hauteur
      size: Math.random() * 3 + 1,                 // Taille entre 1 et 4 pixels
      opacity: Math.random() * 0.8 + 0.2,          // Opacité entre 0.2 et 1
      twinkleSpeed: Math.random() * 0.02 + 0.01,   // Vitesse de scintillement variable
      twinklePhase: Math.random() * Math.PI * 2,   // Phase initiale aléatoire
    }));
    setBackgroundStars(newBackgroundStars);
  }, []);

  // 🌟 Animation des étoiles avec scintillement
  // Met à jour la phase et l'opacité toutes les 50ms pour un effet fluide
  useEffect(() => {
    const animateStars = () => {
      setBackgroundStars(prev => prev.map(star => ({
        ...star,
        twinklePhase: star.twinklePhase + star.twinkleSpeed,  // Avancement de la phase
        opacity: 0.3 + Math.sin(star.twinklePhase) * 0.5,     // Opacité sinusoïdale (0.3-0.8)
      })));
    };

    const interval = setInterval(animateStars, 50); // 20 FPS pour les étoiles
    return () => clearInterval(interval);
  }, []);

  // 🪙 État pour l'animation d'échange DOGEVISION
  // Affiche une notification temporaire lors des échanges réussis ou échoués
  const [exchangeAnimation, setExchangeAnimation] = useState<{
    show: boolean;              // Afficher ou masquer l'animation
    dogevisionsAdded: number;   // Nombre de DOGEVISION ajoutés (0 si échec)
    osSpent: number;            // Nombre d'os dépensés
  }>({ show: false, dogevisionsAdded: 0, osSpent: 0 });

  // 📊 Calcul du pourcentage de vitesse actuelle par rapport au maximum
  const speedPercentage = Math.round((currentSpeed / GAME_CONFIG.MAX_SCROLL_SPEED) * 100);

  // 🎮 Calcul du temps restant pour les pouvoirs actifs
  // Convertit le timestamp de fin en secondes restantes
  const getPowerTimeRemaining = (powerId: string): number => {
    if (!activePowers[powerId]) return 0;
    return Math.max(0, Math.ceil((activePowers[powerId] - Date.now()) / 1000));
  };

  // 🎮 Récupération des références aux pouvoirs pour l'affichage
  // Permet d'accéder facilement aux informations de chaque pouvoir
  const doubleCollectorPower = shopState.availablePowers.find(p => p.id === 'double_collector');
  const magneticPower = shopState.availablePowers.find(p => p.id === 'magnetic_collector');
  const threeLivesPower = shopState.availablePowers.find(p => p.id === 'three_lives');

  // 🪙 Fonction de gestion des échanges avec animation de feedback
  // Gère les cas de succès et d'échec avec des messages appropriés
  const handleExchange = () => {
    // Si pas assez d'os, afficher un message informatif
    if (maxExchangeable === 0) {
      setExchangeAnimation({
        show: true,
        dogevisionsAdded: 0,
        osSpent: 0,
      });
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setExchangeAnimation({ show: false, dogevisionsAdded: 0, osSpent: 0 });
      }, 3000);
      return;
    }
    
    const result = exchangeForDogevision();
    if (result.success) {
      setExchangeAnimation({
        show: true,
        dogevisionsAdded: result.dogevisionsAdded,
        osSpent: result.osSpent,
      });
      
      // Masquer l'animation après 3 secondes
      setTimeout(() => {
        setExchangeAnimation({ show: false, dogevisionsAdded: 0, osSpent: 0 });
      }, 3000);
    }
  };

  // 🪙 Calcul du nombre maximum de DOGEVISION obtenables
  // Taux d'échange : 1000 os = 100 DOGEVISION
  const maxExchangeable = Math.floor(totalCoinsCollected / 1000);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 
        🌟 BACKGROUND SPATIAL ANIMÉ
        - Gradient complexe bleu-violet-noir pour l'ambiance spatiale
        - Effets radiaux pour simuler des nébuleuses lointaines
        - Base pour les étoiles animées et effets de profondeur
      */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 via-indigo-900 to-black"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #581c87 50%, #7c2d12 75%, #000000 100%)
          `
        }}
      />
      
      {/* 
        🌟 ÉTOILES SCINTILLANTES
        - 150 étoiles avec positions, tailles et vitesses aléatoires
        - Animation de scintillement avec opacité variable
      */}
      <div className="fixed inset-0 pointer-events-none">
        {backgroundStars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: Math.max(0.1, Math.min(1, star.opacity)),
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity * 0.5})`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 
        🌟 EFFETS DE NÉBULEUSES FLOTTANTES
        - 3 nébuleuses de tailles différentes avec animations de rotation
        - Couleurs variées (violet, bleu, indigo) pour la profondeur
        - Animations à vitesses différentes pour un effet naturel
      */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            top: '60%',
            right: '15%',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, transparent 70%)',
            bottom: '20%',
            left: '10%',
            animation: 'float 30s ease-in-out infinite',
          }}
        />
      </div>

      {/* 
        🎮 CONTENU PRINCIPAL DE L'APPLICATION
        - Container principal avec z-index élevé pour passer au-dessus du background
        - Layout centré verticalement et horizontalement
        - Responsive avec padding adaptatif
      */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3 drop-shadow-2xl">
            <Rocket className="text-orange-500 animate-pulse drop-shadow-lg" size={40} />
            <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Doge Astronaut
            </span>
            <Star className="text-yellow-400 animate-spin drop-shadow-lg" size={40} />
          </h1>
          <p className="text-gray-200 drop-shadow-lg">Help our doge astronaut explore the moon and collect bones! 🦴</p>
          
          {/* 
            💰 AFFICHAGE DES STATISTIQUES PRINCIPALES
            - Total des os collectés (persistant entre les sessions)
            - DOGEVISION (monnaie premium) si > 0 seulement
          */}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-yellow-400/30">
              <Wallet className="text-yellow-200" size={20} />
              <span className="font-bold">Total: {totalCoinsCollected} bones 🦴</span>
              <Coins className="text-yellow-200" size={20} />
            </div>
            
            {/* 🪙 Affichage DOGEVISION uniquement si le joueur en possède */}
            {dogevisions > 0 && (
              <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-orange-400/30">
                <img 
                  src="/AA copy copy copy.png" 
                  alt="Doge Astronaut" 
                  className="w-6 h-6 rounded-full animate-pulse"
                />
                <span className="font-bold">{dogevisions} DOGEVISION</span>
                <span className="text-2xl">🚀</span>
              </div>
            )}
          </div>

          {/* 
            🎮 AFFICHAGE DES POUVOIRS DISPONIBLES
            - Montre les utilisations restantes pour chaque pouvoir
            - Affichage conditionnel (seulement si des utilisations disponibles)
          */}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-purple-400/30">
                <span className="text-sm">⚡</span>
                <span className="font-bold text-sm">2x Collector: {doubleCollectorPower.usesRemaining} game(s)</span>
              </div>
            )}
            
            {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-cyan-400/30">
                <span className="text-sm">🧲</span>
                <span className="font-bold text-sm">Magnet: {magneticPower.usesRemaining} game(s)</span>
              </div>
            )}

            {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-red-400/30">
                <span className="text-sm">🛡️</span>
                <span className="font-bold text-sm">3 Lives: {threeLivesPower.usesRemaining} game(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* 
          🪙 ANIMATION D'ÉCHANGE DOGEVISION
          - Notification temporaire centrée à l'écran
          - Messages différents pour succès/échec
          - Animation bounce pour attirer l'attention
        */}
        {exchangeAnimation.show && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white px-8 py-6 rounded-xl shadow-2xl border-4 animate-bounce backdrop-blur-md ${
            exchangeAnimation.dogevisionsAdded > 0 
              ? 'bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 border-yellow-300'
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border-red-300'
          }`}>
            <div className="text-center">
              {exchangeAnimation.dogevisionsAdded > 0 ? (
                <>
                  <div className="text-4xl mb-2">🎉 EXCHANGE SUCCESSFUL! 🎉</div>
                  <div className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    {exchangeAnimation.osSpent} bones 🦴 → {exchangeAnimation.dogevisionsAdded} DOGEVISION 
                    <img 
                      src="/AA copy copy copy.png" 
                      alt="Doge Astronaut" 
                      className="w-8 h-8 rounded-full animate-pulse"
                    />
                    🚀
                  </div>
                  <div className="text-sm text-yellow-200">TO THE MOON! 🌙</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">⚠️ NOT ENOUGH BONES! ⚠️</div>
                  <div className="text-xl font-bold mb-2">
                    You need at least 1000 bones 🦴
                  </div>
                  <div className="text-sm text-red-200">
                    You have: {totalCoinsCollected} bones 🦴<br/>
                    Collect {1000 - totalCoinsCollected} more bones!
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 
          🎮 CONTAINER PRINCIPAL DU JEU
          - Canvas de jeu avec overlay UI
          - Background semi-transparent avec blur
          - Gestion des clics pour les contrôles
          - Taille fixe 800x600 (À ADAPTER POUR MOBILE)
        */}
        <div className="relative bg-slate-800/80 backdrop-blur-md rounded-lg shadow-2xl p-4 border border-slate-600/50">
          <canvas
            ref={canvasRef}
            width={GAME_CONFIG.CANVAS_WIDTH}
            height={GAME_CONFIG.CANVAS_HEIGHT}
            className="rounded-lg cursor-pointer"
            onClick={gameState.isPlaying ? jump : (shopState.isOpen ? undefined : startGame)}
          />
          
          {/* 🎨 Composant de rendu graphique délégué */}
          <GameRenderer
            canvasRef={canvasRef}
            player={player}
            obstacles={obstacles}
            collectibles={collectibles}
            particles={particles}
            stars={stars}
            worldOffset={worldOffset}
          />

          {/* 
            🎮 INTERFACE UTILISATEUR DU JEU (HUD)
            - Affichage en temps réel : score, os, vies, vitesse, records
            - Positionnement absolu en overlay sur le canvas
            - Design avec transparence et effets de flou
          */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white border border-orange-500/30">
              <div className="text-sm text-gray-300">Score</div>
              <div className="text-xl font-bold text-orange-400">{gameState.score}</div>
            </div>
            
            {/* Bone counter (current session) */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-yellow-500/30">
              <span className="text-yellow-400 text-lg">🦴</span>
              <div>
                <div className="text-sm text-gray-300">This Game</div>
                <div className="text-xl font-bold text-yellow-400">{gameState.coins}</div>
              </div>
            </div>
            
            {/* 🛡️ Affichage des vies (seulement si plus d'1 vie) */}
            {gameState.isPlaying && maxLives > 1 && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-red-500/30">
                <Heart className="text-red-400" size={20} />
                <div>
                  <div className="text-sm text-gray-300">Lives</div>
                  <div className="text-xl font-bold text-red-400">{lives}/{maxLives}</div>
                </div>
              </div>
            )}
            
            {/* 📊 Indicateur de vitesse avec pourcentage */}
            {gameState.isPlaying && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-cyan-500/30">
                <Zap className="text-yellow-400 animate-pulse" size={20} />
                <div>
                  <div className="text-sm text-gray-300">Speed</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {currentSpeed.toFixed(1)}x ({speedPercentage}%)
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-yellow-500/30">
              <Trophy className="text-yellow-400" size={20} />
              <div>
                <div className="text-sm text-gray-300">Record</div>
                <div className="text-xl font-bold text-yellow-400">{gameState.highScore}</div>
                <div className="text-sm text-yellow-400">🦴 {gameState.highCoins}</div>
              </div>
            </div>
          </div>

          {/* 
            🎮 INDICATEURS DE POUVOIRS ACTIFS
            - Affichage en temps réel des pouvoirs en cours
            - Temps restant ou "ENTIRE GAME" pour les pouvoirs permanents
            - Couleurs différentes selon le type de pouvoir
          */}
          {gameState.isPlaying && Object.keys(activePowers).length > 0 && (
            <div className="absolute top-20 left-6 space-y-2">
              {Object.entries(activePowers).map(([powerId, endTime]) => {
                const timeRemaining = getPowerTimeRemaining(powerId);
                if (timeRemaining <= 0) return null;
                
                // 🧲 Affichage différent selon le type de pouvoir
                const isDoubleCollector = powerId === 'double_collector';
                const isMagnetic = powerId === 'magnetic_collector';
                const isThreeLives = powerId === 'three_lives';
                
                return (
                  <div key={powerId} className={`backdrop-blur-sm rounded-lg px-3 py-2 text-white border animate-pulse ${
                    isDoubleCollector 
                      ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-purple-400/50'
                      : isMagnetic
                      ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 border-cyan-400/50'
                      : 'bg-gradient-to-r from-red-600/90 to-pink-600/90 border-red-400/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isDoubleCollector ? '⚡' : isMagnetic ? '🧲' : '🛡️'}</span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {isDoubleCollector ? '2X COLLECTOR' : isMagnetic ? 'MAGNETIC COLLECTOR' : '3 LIVES ACTIVE'}
                        </div>
                        <div className="text-xs text-gray-200 flex items-center gap-1">
                          <Clock size={12} />
                          {(isMagnetic || isThreeLives) && timeRemaining > 900 ? 'ENTIRE GAME' : `${timeRemaining}s`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 
            🛒 BOUTIQUE DE POUVOIRS
            - Interface complète de la boutique avec scroll
            - Système d'achat et d'échange DOGEVISION
            - Affichage des soldes et utilisations disponibles
            - Design avec gradients et effets visuels
          */}
          {!gameState.isPlaying && shopState.isOpen && (
            <div 
              className="absolute inset-4 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-md flex items-center justify-center rounded-lg overflow-y-auto border border-purple-500/30 shop-container"
              style={{ 
                width: `${GAME_CONFIG.CANVAS_WIDTH}px`, 
                height: `${GAME_CONFIG.CANVAS_HEIGHT}px` 
              }}
            >
              <div className="text-center text-white w-full h-full flex flex-col justify-center px-6 py-4">
                <div className="space-y-4 max-h-full overflow-y-auto">
                  {/* 🛒 En-tête de la boutique */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="text-purple-400" size={32} />
                      <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                        POWER SHOP
                      </h2>
                    </div>
                    <button
                      onClick={closeShop}
                      className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg p-2 transition-all duration-200"
                    >
                      <X className="text-red-400" size={20} />
                    </button>
                  </div>

                  {/* 💰 Affichage des soldes actuels */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Wallet className="text-yellow-300" size={20} />
                        <span className="text-lg font-bold text-yellow-200">Your balance: {totalCoinsCollected} bones 🦴</span>
                      </div>
                    </div>
                    
                    {/* 🪙 Affichage DOGEVISION dans la boutique si > 0 */}
                    {dogevisions > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-2">
                          <img 
                            src="/AA copy copy copy.png" 
                            alt="Doge Astronaut" 
                            className="w-8 h-8 rounded-full animate-pulse"
                          />
                          <span className="text-lg font-bold text-orange-200">Your DOGEVISION: {dogevisions} DOGEVISION 🚀</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🎮 Affichage des utilisations restantes */}
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">⚡</span>
                          <span className="text-xs font-bold text-purple-300">
                            2X COLLECTOR: {doubleCollectorPower.usesRemaining} game(s)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">🧲</span>
                          <span className="text-xs font-bold text-cyan-300">
                            MAGNET: {magneticPower.usesRemaining} game(s)
                          </span>
                        </div>
                      </div>
                    )}

                    {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">🛡️</span>
                          <span className="text-xs font-bold text-red-300">
                            3 LIVES: {threeLivesPower.usesRemaining} game(s)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🪙 Section d'échange DOGEVISION */}
                  <div className="bg-gradient-to-r from-orange-600/20 via-yellow-500/20 to-orange-600/20 border border-orange-400/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <ArrowRightLeft className="text-orange-400" size={24} />
                      <h3 className="text-xl font-bold text-orange-300">DOGEVISION EXCHANGE</h3>
                      <img 
                        src="/AA copy copy copy.png" 
                        alt="Doge Astronaut" 
                        className="w-8 h-8 rounded-full animate-pulse"
                      />
                      <span className="text-2xl">🚀</span>
                    </div>
                    
                    <div className="text-center mb-3">
                      <div className="text-sm text-orange-200 mb-2 flex items-center justify-center gap-2">
                        Exchange rate: 1000 bones 🦴 = 100 DOGEVISION 
                        <img 
                          src="/AA copy copy copy.png" 
                          alt="Doge" 
                          className="w-5 h-5 rounded-full"
                        />
                      </div>
                      {maxExchangeable > 0 ? (
                        <div className="text-lg font-bold text-orange-300 mb-3">
                          You can get: {maxExchangeable * 100} DOGEVISION 🚀
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 mb-3">
                          Collect at least 1000 bones to exchange!
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleExchange}
                      className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                        'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white border border-orange-400/50 hover:scale-105'
                      }`}
                    >
                      {maxExchangeable > 0 ? `EXCHANGE ${maxExchangeable * 1000} BONES → ${maxExchangeable * 100} DOGEVISION` : 'EXCHANGE (1000 BONES = 100 DOGEVISION)'}
                    </button>
                  </div>

                  {/* 🎮 Liste des pouvoirs disponibles */}
                  <div className="space-y-3">
                    {shopState.availablePowers.map(power => {
                      const canAfford = totalCoinsCollected >= power.cost;
                      const isActive = activePowers[power.id] && activePowers[power.id] > Date.now();
                      const timeRemaining = getPowerTimeRemaining(power.id);
                      const hasUses = power.usesRemaining && power.usesRemaining > 0;

                      return (
                        <div key={power.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{power.icon}</span>
                              <div className="text-left">
                                <h3 className="text-lg font-bold text-white">{power.name}</h3>
                                <p className="text-sm text-gray-300">{power.description}</p>
                                
                                {/* 🎮 Affichage des utilisations restantes */}
                                {hasUses && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <span className="text-green-300">✅ {power.usesRemaining} game(s) available</span>
                                  </div>
                                )}
                                
                                {isActive && (
                                  <div className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    Active - {(power.id === 'magnetic_collector' || power.id === 'three_lives') && timeRemaining > 900 ? 'Entire game' : `${timeRemaining}s remaining`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400 mb-2">
                                {power.cost} bones 🦴
                              </div>
                              
                              {/* 🎮 Logique d'achat améliorée */}
                              {hasUses ? (
                                <div className="bg-green-600/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg font-bold">
                                  OWNED
                                </div>
                              ) : (
                                <button
                                  onClick={() => buyPower(power.id)}
                                  disabled={!canAfford}
                                  className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${
                                    canAfford
                                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/50 hover:scale-105'
                                      : 'bg-gray-600/20 border border-gray-500/50 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {canAfford ? 'BUY' : 'TOO EXPENSIVE'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 📖 Instructions du système de pouvoirs */}
                  <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mt-4 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-white mb-2">💡 POWER SYSTEM</div>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>• <strong>2x Collector</strong>: Double bone value for 30s (25 bones, 2 games)</p>
                      <p>• <strong>Magnetic Collector</strong>: Auto-collect at distance (50 bones, 2 games)</p>
                      <p>• <strong>3 Lives</strong>: Survive 2 additional collisions (100 bones, 2 games)</p>
                      <p>• <strong>DOGEVISION Exchange</strong>: 1000 bones = 100 DOGEVISION 🐕🚀</p>
                      <p>• Powers activate automatically at the start of each game</p>
                      <p>• Buy again when you run out of uses!</p>
                    </div>
                  </div>

                  {/* 🔙 Bouton de retour */}
                  <button
                    onClick={closeShop}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 border border-slate-500/50"
                  >
                    BACK TO MENU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 
            🎮 ÉCRANS DE MENU ET GAME OVER
            - Interface conditionnelle selon l'état du jeu
            - Design compact avec toutes les informations essentielles
            - Boutons d'action avec animations et effets hover
            - Statistiques détaillées et guides de jeu
          */}
          {!gameState.isPlaying && !shopState.isOpen && (
            <div 
              className="absolute inset-4 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-md flex items-center justify-center rounded-lg overflow-y-auto border border-purple-500/30 game-menu-container"
              style={{ 
                width: `${GAME_CONFIG.CANVAS_WIDTH}px`, 
                height: `${GAME_CONFIG.CANVAS_HEIGHT}px` 
              }}
            >
              <div className="text-center text-white w-full h-full flex flex-col justify-center px-6 py-3">
                {gameState.gameOver ? (
                  /* ===== ÉCRAN GAME OVER ULTRA COMPACT ===== */
                  <div className="space-y-3 max-h-full overflow-y-auto">
                    {/* Animation d'explosion compacte */}
                    <div className="relative">
                      <div className="text-4xl mb-1 animate-bounce">💥</div>
                    </div>
                    
                    {/* Titre Game Over compact */}
                    <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                      GAME OVER
                    </h2>

                    {/* Grille de statistiques ultra compacte */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Score de la partie */}
                      <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="text-orange-400" size={14} />
                          <span className="text-xs font-semibold text-orange-300">Score</span>
                        </div>
                        <div className="text-lg font-bold text-orange-400">{gameState.score}</div>
                      </div>

                      {/* Os de la partie */}
                      <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border border-yellow-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-yellow-400 text-sm">🦴</span>
                          <span className="text-xs font-semibold text-yellow-300">Bones</span>
                        </div>
                        <div className="text-lg font-bold text-yellow-400">{gameState.coins}</div>
                      </div>
                    </div>

                    {/* Collection totale compacte */}
                    <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
                      <div className="relative flex items-center justify-center gap-2 mb-1">
                        <Crown className="text-yellow-300" size={16} />
                        <span className="text-sm font-bold text-yellow-200">TOTAL COLLECTION</span>
                      </div>
                      <div className="text-xl font-black text-yellow-300">
                        {totalCoinsCollected} bones 🦴
                      </div>
                    </div>

                    {/* 🪙 Affichage DOGEVISION en Game Over si > 0 */}
                    {dogevisions > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <img 
                            src="/AA copy copy copy.png" 
                            alt="Doge Astronaut" 
                            className="w-6 h-6 rounded-full animate-pulse"
                          />
                          <span className="text-sm font-bold text-orange-200">YOUR DOGEVISION</span>
                          <span className="text-2xl">🚀</span>
                        </div>
                        <div className="text-xl font-black text-orange-300">
                          {dogevisions} DOGEVISION
                        </div>
                      </div>
                    )}

                    {/* 🎮 Affichage des utilisations restantes */}
                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">⚡</span>
                            <span className="text-xs font-bold text-purple-300">
                              2X COLLECTOR: {doubleCollectorPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">🧲</span>
                            <span className="text-xs font-bold text-cyan-300">
                              MAGNET: {magneticPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">🛡️</span>
                            <span className="text-xs font-bold text-red-300">
                              3 LIVES: {threeLivesPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vitesse maximale compacte */}
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-lg p-2 mb-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="text-cyan-400" size={14} />
                        <span className="text-xs font-semibold text-cyan-300">Max Speed: </span>
                        <span className="text-sm font-bold text-cyan-400">{getGameSpeed(gameState.score).toFixed(1)}x</span>
                      </div>
                    </div>

                    {/* Nouveaux records compacts */}
                    {gameState.score === gameState.highScore && gameState.score > 0 && (
                      <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 mb-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="text-purple-400" size={14} />
                          <span className="text-xs font-bold text-purple-300">SCORE RECORD!</span>
                        </div>
                      </div>
                    )}

                    {gameState.coins === gameState.highCoins && gameState.coins > 0 && (
                      <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-400/50 rounded-lg p-2 mb-3 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-green-400 text-sm">🦴</span>
                          <span className="text-xs font-bold text-green-300">BONES RECORD!</span>
                        </div>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={startGame}
                        className="flex-1 group bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-400 hover:via-red-400 hover:to-orange-400 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-orange-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <RotateCcw className="group-hover:animate-spin" size={16} />
                          <span className="text-sm">PLAY AGAIN</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={openShop}
                        className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ShoppingCart className="group-hover:animate-pulse" size={16} />
                          <span className="text-sm">SHOP</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ===== ÉCRAN MENU PRINCIPAL ULTRA COMPACT ===== */
                  <div className="space-y-3 max-h-full overflow-y-auto">
                    {/* Logo animé compact */}
                    <div className="text-4xl mb-2 animate-bounce">🚀</div>

                    {/* Titre principal compact */}
                    <div className="mb-3">
                      <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                        DOGE ASTRONAUT
                      </h2>
                      <p className="text-sm text-gray-300">🌙 Explore the moon! 🦴</p>
                    </div>

                    {/* Collection totale compacte */}
                    {totalCoinsCollected > 0 && (
                      <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <Crown className="text-yellow-300" size={16} />
                          <span className="text-sm font-bold text-yellow-200">YOUR COLLECTION</span>
                        </div>
                        <div className="text-xl font-black text-yellow-300">
                          {totalCoinsCollected} bones 🦴
                        </div>
                      </div>
                    )}

                    {/* 🪙 Affichage DOGEVISION dans le menu principal si > 0 */}
                    {dogevisions > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <img 
                            src="/AA copy copy copy.png" 
                            alt="Doge Astronaut" 
                            className="w-6 h-6 rounded-full animate-pulse"
                          />
                          <span className="text-sm font-bold text-orange-200">YOUR DOGEVISION</span>
                          <span className="text-2xl">🚀</span>
                        </div>
                        <div className="text-xl font-black text-orange-300">
                          {dogevisions} DOGEVISION
                        </div>
                      </div>
                    )}

                    {/* 🎮 Affichage des utilisations restantes dans le menu principal */}
                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 relative overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-pulse"></div>
                          <div className="relative flex items-center justify-center gap-1">
                            <span className="text-sm">⚡</span>
                            <span className="text-xs font-bold text-purple-200">
                              2X COLLECTOR: {doubleCollectorPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 rounded-lg p-2 relative overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse"></div>
                          <div className="relative flex items-center justify-center gap-1">
                            <span className="text-sm">🧲</span>
                            <span className="text-xs font-bold text-cyan-200">
                              MAGNET: {magneticPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-400/50 rounded-lg p-2 relative overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/10 to-transparent animate-pulse"></div>
                          <div className="relative flex items-center justify-center gap-1">
                            <span className="text-sm">🛡️</span>
                            <span className="text-xs font-bold text-red-200">
                              3 LIVES: {threeLivesPower.usesRemaining} game(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guide de jeu compact */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-red-600/20 border border-red-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="text-lg mb-1">⚠️</div>
                        <div className="text-red-300 font-semibold text-xs">DANGERS</div>
                        <div className="text-xs text-red-200">
                          🔴 Meteorites<br/>
                          ⚫ Rocks<br/>
                          🚩 Flags
                        </div>
                      </div>

                      <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="text-lg mb-1">🦴</div>
                        <div className="text-yellow-300 font-semibold text-xs">REWARDS</div>
                        <div className="text-xs text-yellow-200">
                          Delicious bones<br/>
                          +10 points<br/>
                          Auto-save!
                        </div>
                      </div>
                    </div>

                    {/* Défi progressif compact */}
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-lg p-2 mb-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="text-cyan-400 animate-pulse" size={16} />
                        <span className="text-xs font-bold text-cyan-300">PROGRESSIVE CHALLENGE</span>
                      </div>
                      <div className="text-cyan-200 text-xs">
                        The higher your score, the faster it gets! ⚡
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {/* 🪙 Bouton EXCHANGE en premier */}
                      <button
                        onClick={handleExchange}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-orange-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ArrowRightLeft className="group-hover:animate-pulse" size={16} />
                          <span className="text-sm font-bold">EXCHANGE</span>
                          <img 
                            src="/AA copy copy copy.png" 
                            alt="Doge" 
                            className="w-6 h-6 rounded-full animate-pulse"
                          />
                        </div>
                      </button>
                      
                      {/* Bouton START en deuxième */}
                      <button
                        onClick={startGame}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-blue-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <Play className="group-hover:animate-pulse" size={18} />
                          <span className="text-sm font-bold">START</span>
                        </div>
                      </button>
                      
                      {/* Bouton SHOP en dernier */}
                      <button
                        onClick={openShop}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ShoppingCart className="group-hover:animate-pulse" size={18} />
                          <span className="text-sm font-bold">SHOP</span>
                        </div>
                      </button>
                    </div>

                    {/* Instructions compactes */}
                    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mt-3 backdrop-blur-sm">
                      <div className="text-xs font-semibold text-white mb-2">🎮 CONTROLS</div>
                      <div className="space-y-1 text-xs text-gray-300">
                        <p>• <strong>2x Collector</strong>: Double bone value for 30s (25 bones, 2 games)</p>
                        <p>• <strong>Magnetic Collector</strong>: Auto-collect at distance (50 bones, 2 games)</p>
                        <p>• <strong>3 Lives</strong>: Survive 2 additional collisions (100 bones, 2 games)</p>
                        <p>
                          <kbd className="bg-slate-700 px-1 py-0.5 rounded text-white text-xs">SPACE</kbd>
                          <span className="ml-2">Jump</span>
                        </p>
                        <p>
                          <kbd className="bg-slate-700 px-1 py-0.5 rounded text-white text-xs">S</kbd>
                          <span className="ml-2">Open shop</span>
                        </p>
                        <p className="text-yellow-400">✅ <strong>Bones saved!</strong></p>
                        <p className="text-green-400">🎯 <strong>One bone per obstacle!</strong></p>
                        <p className="text-purple-400">🛒 <strong>Powers: 2 games each!</strong></p>
                        <p className="text-cyan-400">🧲 <strong>Magnet: Auto-collect!</strong></p>
                        <p className="text-red-400">🛡️ <strong>3 Lives: Survive collisions!</strong></p>
                        <p className="text-orange-400">🐕 <strong>Exchange: 1000 bones = 100 DOGEVISION!</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 
            🎮 INSTRUCTIONS EN JEU
            - Barre d'informations en bas d'écran pendant le jeu
            - Affichage des contrôles et statistiques en temps réel
            - Design responsive avec flex-wrap pour mobile
            - Informations contextuelles selon l'état du jeu
          */}
          {gameState.isPlaying && (
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl px-6 py-3 text-white text-sm border border-slate-600/50">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <kbd className="bg-slate-700 px-2 py-1 rounded text-white">SPACE</kbd>
                    <span>Jump</span>
                  </div>
                  <div className="text-yellow-400">🦴 Collect bones</div>
                  <div className="text-cyan-400">⚡ Speed: {currentSpeed.toFixed(1)}x</div>
                  <div className="text-green-400">🏦 Total: {totalCoinsCollected}</div>
                  {dogevisions > 0 && (
                    <div className="text-orange-400 flex items-center gap-1">
                      <img 
                        src="/AA copy copy copy.png" 
                        alt="Doge" 
                        className="w-4 h-4 rounded-full"
                      />
                      DOGEVISION: {dogevisions}
                    </div>
                  )}
                  {maxLives > 1 && (
                    <div className="text-red-400">❤️ Lives: {lives}/{maxLives}</div>
                  )}
                  {Object.keys(activePowers).length > 0 && (
                    <div className="text-purple-400">
                      {activePowers.double_collector ? '⚡ 2x Collector' : ''}
                      {activePowers.magnetic_collector ? '🧲 Magnet' : ''}
                      {activePowers.three_lives ? '🛡️ 3 Lives' : ''}
                      {' ACTIVE'}
                    </div>
                  )}
                  {/* 🎮 Affichage des utilisations restantes en jeu */}
                  {!Object.keys(activePowers).length && (
                    <div className="flex gap-2">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="text-purple-400">⚡ {doubleCollectorPower.usesRemaining} game(s)</div>
                      )}
                      {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                        <div className="text-cyan-400">🧲 {magneticPower.usesRemaining} game(s)</div>
                      )}
                      {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                        <div className="text-red-400">🛡️ {threeLivesPower.usesRemaining} game(s)</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 
          📖 DESCRIPTION DÉTAILLÉE DU JEU
          - Grille responsive avec 5 sections explicatives
          - Design avec cards et effets visuels
          - Informations complètes sur tous les aspects du jeu
        */}
        <div className="mt-8 text-center text-gray-300 text-sm max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-red-400 text-2xl mb-2">⚠️</div>
              <h3 className="text-white font-semibold mb-2">SURVIVAL</h3>
              <p>Avoid ALL obstacles: meteorites, rocks and flags. One contact = Game Over!</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-yellow-400 text-2xl mb-2">🦴</div>
              <h3 className="text-white font-semibold mb-2">COLLECTION</h3>
              <p>Collect delicious bones to earn bonus points. Each bone is worth 10 points!</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-cyan-400 text-2xl mb-2">⚡</div>
              <h3 className="text-white font-semibold mb-2">CHALLENGE</h3>
              <p>The higher your score, the faster the game becomes. Can you survive maximum speed?</p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-purple-400 text-2xl mb-2">🛒</div>
              <h3 className="text-white font-semibold mb-2">POWERS</h3>
              <p>2x Collector (25 bones), Magnetic Collector (50 bones) and 3 Lives (100 bones)! Each usable for 2 games!</p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-orange-400 text-2xl mb-2">🐕</div>
              <h3 className="text-white font-semibold mb-2">DOGEVISION</h3>
              <p>Exchange your bones for DOGEVISION! 1000 bones = 100 DOGEVISION. TO THE MOON! 🚀</p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        🌟 STYLES CSS POUR LES ANIMATIONS
        - Animations personnalisées pour les effets visuels
        - Keyframes pour scintillement et flottement
      */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * 🚀 EXPORT DU COMPOSANT PRINCIPAL
 * 
 * Ce composant App.tsx est le point d'entrée de l'application.
 * Il orchestre tous les autres composants et gère l'état global de l'interface.
 */
export default App;