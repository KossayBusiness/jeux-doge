import React, { useRef, useState, useEffect } from 'react';
import { Rocket, Trophy, Star, Zap, Coins, Wallet, Play, RotateCcw, Sparkles, Target, Award, Crown, ShoppingCart, X, Clock, ArrowRightLeft, Heart } from 'lucide-react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameRenderer } from './components/GameRenderer';
import { GAME_CONFIG, getGameSpeed } from './utils/GameUtils';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameState,
    player,
    obstacles,
    collectibles,
    particles,
    stars,
    worldOffset,
    currentSpeed,
    totalCoinsCollected,
    dogecoins,
    shopState,
    activePowers,
    lives,
    maxLives,
    startGame,
    jump,
    openShop,
    closeShop,
    buyPower,
    exchangeForDogecoin,
  } = useGameLogic();

  // 🌟 NOUVEAU : État pour les étoiles animées du background
  const [backgroundStars, setBackgroundStars] = useState<Array<{
    x: number;
    y: number;
    size: number;
    opacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
  }>>([]);

  // 🌟 NOUVEAU : Initialiser les étoiles du background
  useEffect(() => {
    const newBackgroundStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
    setBackgroundStars(newBackgroundStars);
  }, []);

  // 🌟 NOUVEAU : Animation des étoiles
  useEffect(() => {
    const animateStars = () => {
      setBackgroundStars(prev => prev.map(star => ({
        ...star,
        twinklePhase: star.twinklePhase + star.twinkleSpeed,
        opacity: 0.3 + Math.sin(star.twinklePhase) * 0.5,
      })));
    };

    const interval = setInterval(animateStars, 50);
    return () => clearInterval(interval);
  }, []);

  // 🪙 NOUVEAU : État pour l'animation d'échange
  const [exchangeAnimation, setExchangeAnimation] = useState<{
    show: boolean;
    dogecoinsAdded: number;
    osSpent: number;
  }>({ show: false, dogecoinsAdded: 0, osSpent: 0 });

  const speedPercentage = Math.round((currentSpeed / GAME_CONFIG.MAX_SCROLL_SPEED) * 100);

  // 🎮 NOUVEAU : Calculer le temps restant pour les pouvoirs actifs
  const getPowerTimeRemaining = (powerId: string): number => {
    if (!activePowers[powerId]) return 0;
    return Math.max(0, Math.ceil((activePowers[powerId] - Date.now()) / 1000));
  };

  // 🎮 NOUVEAU : Obtenir les pouvoirs
  const doubleCollectorPower = shopState.availablePowers.find(p => p.id === 'double_collector');
  const magneticPower = shopState.availablePowers.find(p => p.id === 'magnetic_collector');
  const threeLivesPower = shopState.availablePowers.find(p => p.id === 'three_lives');

  // 🪙 NOUVEAU : Fonction pour gérer l'échange avec animation
  const handleExchange = () => {
    // Si pas assez d'os, afficher un message informatif
    if (maxExchangeable === 0) {
      setExchangeAnimation({
        show: true,
        dogecoinsAdded: 0,
        osSpent: 0,
      });
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setExchangeAnimation({ show: false, dogecoinsAdded: 0, osSpent: 0 });
      }, 3000);
      return;
    }
    
    const result = exchangeForDogecoin();
    if (result.success) {
      setExchangeAnimation({
        show: true,
        dogecoinsAdded: result.dogecoinsAdded,
        osSpent: result.osSpent,
      });
      
      // Masquer l'animation après 3 secondes
      setTimeout(() => {
        setExchangeAnimation({ show: false, dogecoinsAdded: 0, osSpent: 0 });
      }, 3000);
    }
  };

  // 🪙 NOUVEAU : Calculer combien de Dogecoins on peut obtenir
  const maxExchangeable = Math.floor(totalCoinsCollected / 1000);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 🌟 NOUVEAU : Background avec dégradé bleu-violet-noir et étoiles animées */}
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
      
      {/* 🌟 NOUVEAU : Étoiles animées */}
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

      {/* 🌟 NOUVEAU : Effet de nébuleuse flottante */}
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

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3 drop-shadow-2xl">
            <Rocket className="text-orange-500 animate-pulse drop-shadow-lg" size={40} />
            <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Doge Astronaute
            </span>
            <Star className="text-yellow-400 animate-spin drop-shadow-lg" size={40} />
          </h1>
          <p className="text-gray-200 drop-shadow-lg">Aide notre doge astronaute à explorer la lune et collecter des os ! 🦴</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-yellow-400/30">
              <Wallet className="text-yellow-200" size={20} />
              <span className="font-bold">Total: {totalCoinsCollected} os 🦴</span>
              <Coins className="text-yellow-200" size={20} />
            </div>
            
            {/* 🪙 NOUVEAU : Affichage des Dogecoins SEULEMENT si > 0 */}
            {dogecoins > 0 && (
              <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-orange-400/30">
                <span className="text-2xl">🐕</span>
                <span className="font-bold">{dogecoins} DOGE</span>
                <span className="text-2xl">🚀</span>
              </div>
            )}
          </div>

          {/* 🎮 NOUVEAU : Affichage des utilisations restantes des pouvoirs */}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-purple-400/30">
                <span className="text-sm">⚡</span>
                <span className="font-bold text-sm">Collecteur x2: {doubleCollectorPower.usesRemaining} partie(s)</span>
              </div>
            )}
            
            {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-cyan-400/30">
                <span className="text-sm">🧲</span>
                <span className="font-bold text-sm">Aimant: {magneticPower.usesRemaining} partie(s)</span>
              </div>
            )}

            {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
              <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-2xl animate-pulse backdrop-blur-sm border border-red-400/30">
                <span className="text-sm">🛡️</span>
                <span className="font-bold text-sm">3 Vies: {threeLivesPower.usesRemaining} partie(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* 🪙 NOUVEAU : Animation d'échange réussi */}
        {exchangeAnimation.show && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white px-8 py-6 rounded-xl shadow-2xl border-4 animate-bounce backdrop-blur-md ${
            exchangeAnimation.dogecoinsAdded > 0 
              ? 'bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 border-yellow-300'
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border-red-300'
          }`}>
            <div className="text-center">
              {exchangeAnimation.dogecoinsAdded > 0 ? (
                <>
                  <div className="text-4xl mb-2">🎉 ÉCHANGE RÉUSSI ! 🎉</div>
                  <div className="text-xl font-bold mb-2">
                    {exchangeAnimation.osSpent} os 🦴 → {exchangeAnimation.dogecoinsAdded} DOGE 🐕🚀
                  </div>
                  <div className="text-sm text-yellow-200">TO THE MOON! 🌙</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">⚠️ PAS ASSEZ D'OS ! ⚠️</div>
                  <div className="text-xl font-bold mb-2">
                    Il vous faut au moins 1000 os 🦴
                  </div>
                  <div className="text-sm text-red-200">
                    Vous avez: {totalCoinsCollected} os 🦴<br/>
                    Collectez encore {1000 - totalCoinsCollected} os !
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="relative bg-slate-800/80 backdrop-blur-md rounded-lg shadow-2xl p-4 border border-slate-600/50">
          <canvas
            ref={canvasRef}
            width={GAME_CONFIG.CANVAS_WIDTH}
            height={GAME_CONFIG.CANVAS_HEIGHT}
            className="rounded-lg cursor-pointer"
            onClick={gameState.isPlaying ? jump : (shopState.isOpen ? undefined : startGame)}
          />
          
          <GameRenderer
            canvasRef={canvasRef}
            player={player}
            obstacles={obstacles}
            collectibles={collectibles}
            particles={particles}
            stars={stars}
            worldOffset={worldOffset}
          />

          {/* Game UI */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white border border-orange-500/30">
              <div className="text-sm text-gray-300">Score</div>
              <div className="text-xl font-bold text-orange-400">{gameState.score}</div>
            </div>
            
            {/* Compteur d'os (session actuelle) */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-yellow-500/30">
              <span className="text-yellow-400 text-lg">🦴</span>
              <div>
                <div className="text-sm text-gray-300">Cette partie</div>
                <div className="text-xl font-bold text-yellow-400">{gameState.coins}</div>
              </div>
            </div>
            
            {/* 🛡️ NOUVEAU : Affichage des vies */}
            {gameState.isPlaying && maxLives > 1 && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-red-500/30">
                <Heart className="text-red-400" size={20} />
                <div>
                  <div className="text-sm text-gray-300">Vies</div>
                  <div className="text-xl font-bold text-red-400">{lives}/{maxLives}</div>
                </div>
              </div>
            )}
            
            {/* Indicateur de vitesse */}
            {gameState.isPlaying && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 border border-cyan-500/30">
                <Zap className="text-yellow-400 animate-pulse" size={20} />
                <div>
                  <div className="text-sm text-gray-300">Vitesse</div>
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

          {/* 🎮 NOUVEAU : Indicateur de pouvoirs actifs amélioré */}
          {gameState.isPlaying && Object.keys(activePowers).length > 0 && (
            <div className="absolute top-20 left-6 space-y-2">
              {Object.entries(activePowers).map(([powerId, endTime]) => {
                const timeRemaining = getPowerTimeRemaining(powerId);
                if (timeRemaining <= 0) return null;
                
                // 🧲 NOUVEAU : Affichage différent selon le type de pouvoir
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
                          {isDoubleCollector ? 'COLLECTEUR x2' : isMagnetic ? 'AIMANT MAGNÉTIQUE' : '3 VIES ACTIVES'}
                        </div>
                        <div className="text-xs text-gray-200 flex items-center gap-1">
                          <Clock size={12} />
                          {(isMagnetic || isThreeLives) && timeRemaining > 900 ? 'TOUTE LA PARTIE' : `${timeRemaining}s`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🛒 NOUVEAU : Boutique de pouvoirs avec système d'utilisations + POUVOIR 3 VIES */}
          {!gameState.isPlaying && shopState.isOpen && (
            <div 
              className="absolute inset-4 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-md flex items-center justify-center rounded-lg overflow-y-auto border border-purple-500/30"
              style={{ 
                width: `${GAME_CONFIG.CANVAS_WIDTH}px`, 
                height: `${GAME_CONFIG.CANVAS_HEIGHT}px` 
              }}
            >
              <div className="text-center text-white w-full h-full flex flex-col justify-center px-6 py-4">
                <div className="space-y-4 max-h-full overflow-y-auto">
                  {/* En-tête de la boutique */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="text-purple-400" size={32} />
                      <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                        BOUTIQUE DE POUVOIRS
                      </h2>
                    </div>
                    <button
                      onClick={closeShop}
                      className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg p-2 transition-all duration-200"
                    >
                      <X className="text-red-400" size={20} />
                    </button>
                  </div>

                  {/* Solde actuel + Dogecoins */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Wallet className="text-yellow-300" size={20} />
                        <span className="text-lg font-bold text-yellow-200">Votre solde: {totalCoinsCollected} os 🦴</span>
                      </div>
                    </div>
                    
                    {/* 🪙 NOUVEAU : Affichage des Dogecoins dans la boutique SEULEMENT si > 0 */}
                    {dogecoins > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">🐕</span>
                          <span className="text-lg font-bold text-orange-200">Vos Dogecoins: {dogecoins} DOGE 🚀</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🎮 NOUVEAU : Affichage des utilisations restantes */}
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">⚡</span>
                          <span className="text-xs font-bold text-purple-300">
                            COLLECTEUR x2: {doubleCollectorPower.usesRemaining} partie(s)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">🧲</span>
                          <span className="text-xs font-bold text-cyan-300">
                            AIMANT: {magneticPower.usesRemaining} partie(s)
                          </span>
                        </div>
                      </div>
                    )}

                    {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                      <div className="bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">🛡️</span>
                          <span className="text-xs font-bold text-red-300">
                            3 VIES: {threeLivesPower.usesRemaining} partie(s)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🪙 NOUVEAU : Section d'échange Dogecoin */}
                  <div className="bg-gradient-to-r from-orange-600/20 via-yellow-500/20 to-orange-600/20 border border-orange-400/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <ArrowRightLeft className="text-orange-400" size={24} />
                      <h3 className="text-xl font-bold text-orange-300">ÉCHANGE DOGECOIN</h3>
                      <span className="text-2xl">🐕🚀</span>
                    </div>
                    
                    <div className="text-center mb-3">
                      <div className="text-sm text-orange-200 mb-2">Taux d'échange: 1000 os 🦴 = 1 DOGE 🐕</div>
                      {maxExchangeable > 0 ? (
                        <div className="text-lg font-bold text-orange-300 mb-3">
                          Vous pouvez obtenir: {maxExchangeable} DOGE 🚀
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 mb-3">
                          Collectez au moins 1000 os pour échanger !
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleExchange}
                      className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                        'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white border border-orange-400/50 hover:scale-105'
                      }`}
                    >
                      {maxExchangeable > 0 ? `ÉCHANGER ${maxExchangeable * 1000} OS → ${maxExchangeable} DOGE` : 'ÉCHANGER (1000 OS = 1 DOGE)'}
                    </button>
                  </div>

                  {/* Liste des pouvoirs */}
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
                                
                                {/* 🎮 NOUVEAU : Affichage des utilisations restantes */}
                                {hasUses && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <span className="text-green-300">✅ {power.usesRemaining} partie(s) disponible(s)</span>
                                  </div>
                                )}
                                
                                {isActive && (
                                  <div className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    Actif - {(power.id === 'magnetic_collector' || power.id === 'three_lives') && timeRemaining > 900 ? 'Toute la partie' : `${timeRemaining}s restantes`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400 mb-2">
                                {power.cost} os 🦴
                              </div>
                              
                              {/* 🎮 NOUVEAU : Logique de bouton améliorée */}
                              {hasUses ? (
                                <div className="bg-green-600/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg font-bold">
                                  POSSÉDÉ
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
                                  {canAfford ? 'ACHETER' : 'TROP CHER'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Instructions */}
                  <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mt-4 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-white mb-2">💡 SYSTÈME DE POUVOIRS</div>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>• <strong>Collecteur x2</strong> : Double la valeur des os pendant 30s (25 os, 2 parties)</p>
                      <p>• <strong>Aimant Magnétique</strong> : Collecte automatique à distance (50 os, 2 parties)</p>
                      <p>• <strong>3 Vies</strong> : Survivez à 2 collisions supplémentaires (100 os, 2 parties)</p>
                      <p>• <strong>Échange Dogecoin</strong> : 1000 os = 1 DOGE 🐕🚀</p>
                      <p>• Les pouvoirs s'activent automatiquement au début de chaque partie</p>
                      <p>• Rachetez quand vous n'avez plus d'utilisations !</p>
                    </div>
                  </div>

                  {/* Bouton retour */}
                  <button
                    onClick={closeShop}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 border border-slate-500/50"
                  >
                    RETOUR AU MENU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over / Start Screen */}
          {!gameState.isPlaying && !shopState.isOpen && (
            <div 
              className="absolute inset-4 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-md flex items-center justify-center rounded-lg overflow-y-auto border border-purple-500/30"
              style={{ 
                width: `${GAME_CONFIG.CANVAS_WIDTH}px`, 
                height: `${GAME_CONFIG.CANVAS_HEIGHT}px` 
              }}
            >
              <div className="text-center text-white w-full h-full flex flex-col justify-center px-6 py-3">
                {gameState.gameOver ? (
                  /* ===== ÉCRAN GAME OVER ULTRA COMPACT ===== */
                  <div className="space-y-3 max-h-full overflow-y-auto">
                    {/* Animation d'explosion très compacte */}
                    <div className="relative">
                      <div className="text-4xl mb-1 animate-bounce">💥</div>
                    </div>
                    
                    {/* Titre Game Over très compact */}
                    <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                      GAME OVER
                    </h2>

                    {/* Statistiques ultra compactes en grille */}
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
                          <span className="text-xs font-semibold text-yellow-300">Os</span>
                        </div>
                        <div className="text-lg font-bold text-yellow-400">{gameState.coins}</div>
                      </div>
                    </div>

                    {/* Collection totale très compacte */}
                    <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
                      <div className="relative flex items-center justify-center gap-2 mb-1">
                        <Crown className="text-yellow-300" size={16} />
                        <span className="text-sm font-bold text-yellow-200">COLLECTION TOTALE</span>
                      </div>
                      <div className="text-xl font-black text-yellow-300">
                        {totalCoinsCollected} os 🦴
                      </div>
                    </div>

                    {/* 🪙 NOUVEAU : Affichage des Dogecoins dans Game Over SEULEMENT si > 0 */}
                    {dogecoins > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <span className="text-2xl">🐕</span>
                          <span className="text-sm font-bold text-orange-200">VOS DOGECOINS</span>
                          <span className="text-2xl">🚀</span>
                        </div>
                        <div className="text-xl font-black text-orange-300">
                          {dogecoins} DOGE
                        </div>
                      </div>
                    )}

                    {/* 🎮 NOUVEAU : Affichage des utilisations restantes */}
                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">⚡</span>
                            <span className="text-xs font-bold text-purple-300">
                              COLLECTEUR x2: {doubleCollectorPower.usesRemaining} partie(s)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">🧲</span>
                            <span className="text-xs font-bold text-cyan-300">
                              AIMANT: {magneticPower.usesRemaining} partie(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-400/50 rounded-lg p-2 animate-pulse backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg">🛡️</span>
                            <span className="text-xs font-bold text-red-300">
                              3 VIES: {threeLivesPower.usesRemaining} partie(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vitesse max très compacte */}
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-lg p-2 mb-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="text-cyan-400" size={14} />
                        <span className="text-xs font-semibold text-cyan-300">Vitesse Max: </span>
                        <span className="text-sm font-bold text-cyan-400">{getGameSpeed(gameState.score).toFixed(1)}x</span>
                      </div>
                    </div>

                    {/* Nouveaux records très compacts */}
                    {gameState.score === gameState.highScore && gameState.score > 0 && (
                      <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 mb-2 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="text-purple-400" size={14} />
                          <span className="text-xs font-bold text-purple-300">RECORD SCORE !</span>
                        </div>
                      </div>
                    )}

                    {gameState.coins === gameState.highCoins && gameState.coins > 0 && (
                      <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-400/50 rounded-lg p-2 mb-3 animate-pulse backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-green-400 text-sm">🦴</span>
                          <span className="text-xs font-bold text-green-300">RECORD OS !</span>
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
                          <span className="text-sm">REJOUER</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={openShop}
                        className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ShoppingCart className="group-hover:animate-pulse" size={16} />
                          <span className="text-sm">BOUTIQUE</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ===== ÉCRAN MENU PRINCIPAL ULTRA COMPACT ===== */
                  <div className="space-y-3 max-h-full overflow-y-auto">
                    {/* Logo animé très compact */}
                    <div className="text-4xl mb-2 animate-bounce">🚀</div>

                    {/* Titre principal très compact */}
                    <div className="mb-3">
                      <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                        DOGE ASTRONAUTE
                      </h2>
                      <p className="text-sm text-gray-300">🌙 Explorez la lune ! 🦴</p>
                    </div>

                    {/* Collection totale très compacte */}
                    {totalCoinsCollected > 0 && (
                      <div className="bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-yellow-600/30 border border-yellow-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <Crown className="text-yellow-300" size={16} />
                          <span className="text-sm font-bold text-yellow-200">VOTRE COLLECTION</span>
                        </div>
                        <div className="text-xl font-black text-yellow-300">
                          {totalCoinsCollected} os 🦴
                        </div>
                      </div>
                    )}

                    {/* 🪙 NOUVEAU : Affichage des Dogecoins dans le menu principal SEULEMENT si > 0 */}
                    {dogecoins > 0 && (
                      <div className="bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-orange-600/30 border border-orange-400/50 rounded-lg p-3 mb-3 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent animate-pulse"></div>
                        <div className="relative flex items-center justify-center gap-2 mb-1">
                          <span className="text-2xl">🐕</span>
                          <span className="text-sm font-bold text-orange-200">VOS DOGECOINS</span>
                          <span className="text-2xl">🚀</span>
                        </div>
                        <div className="text-xl font-black text-orange-300">
                          {dogecoins} DOGE
                        </div>
                      </div>
                    )}

                    {/* 🎮 NOUVEAU : Affichage des utilisations restantes dans le menu principal */}
                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-lg p-2 relative overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-pulse"></div>
                          <div className="relative flex items-center justify-center gap-1">
                            <span className="text-sm">⚡</span>
                            <span className="text-xs font-bold text-purple-200">
                              COLLECTEUR x2: {doubleCollectorPower.usesRemaining} partie(s)
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
                              AIMANT: {magneticPower.usesRemaining} partie(s)
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
                              3 VIES: {threeLivesPower.usesRemaining} partie(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guide de jeu très compact */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-red-600/20 border border-red-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="text-lg mb-1">⚠️</div>
                        <div className="text-red-300 font-semibold text-xs">DANGERS</div>
                        <div className="text-xs text-red-200">
                          🔴 Météorites<br/>
                          ⚫ Roches<br/>
                          🚩 Drapeaux
                        </div>
                      </div>

                      <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-lg p-2 backdrop-blur-sm">
                        <div className="text-lg mb-1">🦴</div>
                        <div className="text-yellow-300 font-semibold text-xs">RÉCOMPENSES</div>
                        <div className="text-xs text-yellow-200">
                          Os délicieux<br/>
                          +10 points<br/>
                          Sauvegarde auto !
                        </div>
                      </div>
                    </div>

                    {/* Défi progressif très compact */}
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-lg p-2 mb-3 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="text-cyan-400 animate-pulse" size={16} />
                        <span className="text-xs font-bold text-cyan-300">DÉFI PROGRESSIF</span>
                      </div>
                      <div className="text-cyan-200 text-xs">
                        Plus votre score augmente, plus c'est rapide ! ⚡
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <button
                        onClick={startGame}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-400 hover:via-emerald-400 hover:to-green-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-green-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <Play className="group-hover:animate-pulse" size={18} />
                          <span className="text-sm font-bold">COMMENCER</span>
                        </div>
                      </button>
                      
                      {/* 🪙 NOUVEAU : Bouton ÉCHANGER entre COMMENCER et BOUTIQUE */}
                      <button
                        onClick={handleExchange}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-orange-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ArrowRightLeft className="group-hover:animate-pulse" size={16} />
                          <span className="text-sm font-bold">ÉCHANGER</span>
                          <img 
                            src="/AA.png" 
                            alt="Doge" 
                            className="w-6 h-6 rounded-full animate-pulse"
                          />
                        </div>
                      </button>
                      
                      <button
                        onClick={openShop}
                        className="flex-1 min-w-[120px] group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-400/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <ShoppingCart className="group-hover:animate-pulse" size={18} />
                          <span className="text-sm font-bold">BOUTIQUE</span>
                        </div>
                      </button>
                    </div>

                    {/* Instructions très compactes */}
                    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 mt-3 backdrop-blur-sm">
                      <div className="text-xs font-semibold text-white mb-2">🎮 CONTRÔLES</div>
                      <div className="space-y-1 text-xs text-gray-300">
                        <p>• <strong>Collecteur x2</strong> : Double la valeur des os pendant 30s (25 os, 2 parties)</p>
                        <p>• <strong>Aimant Magnétique</strong> : Collecte automatique à distance (50 os, 2 parties)</p>
                        <p>• <strong>3 Vies</strong> : Survivez à 2 collisions supplémentaires (100 os, 2 parties)</p>
                        <p>
                          <kbd className="bg-slate-700 px-1 py-0.5 rounded text-white text-xs">ESPACE</kbd>
                          <span className="ml-2">Faire sauter</span>
                        </p>
                        <p>
                          <kbd className="bg-slate-700 px-1 py-0.5 rounded text-white text-xs">S</kbd>
                          <span className="ml-2">Ouvrir la boutique</span>
                        </p>
                        <p className="text-yellow-400">✅ <strong>Os sauvegardés !</strong></p>
                        <p className="text-green-400">🎯 <strong>Un os par obstacle !</strong></p>
                        <p className="text-purple-400">🛒 <strong>Pouvoirs : 2 parties chacun !</strong></p>
                        <p className="text-cyan-400">🧲 <strong>Aimant : Collection auto !</strong></p>
                        <p className="text-red-400">🛡️ <strong>3 Vies : Survivez aux collisions !</strong></p>
                        <p className="text-orange-400">🐕 <strong>Échange : 1000 os = 1 DOGE !</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions en jeu */}
          {gameState.isPlaying && (
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl px-6 py-3 text-white text-sm border border-slate-600/50">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <kbd className="bg-slate-700 px-2 py-1 rounded text-white">ESPACE</kbd>
                    <span>Sauter</span>
                  </div>
                  <div className="text-yellow-400">🦴 Collectez les os</div>
                  <div className="text-cyan-400">⚡ Vitesse: {currentSpeed.toFixed(1)}x</div>
                  <div className="text-green-400">🏦 Total: {totalCoinsCollected}</div>
                  {dogecoins > 0 && (
                    <div className="text-orange-400">🐕 DOGE: {dogecoins}</div>
                  )}
                  {maxLives > 1 && (
                    <div className="text-red-400">❤️ Vies: {lives}/{maxLives}</div>
                  )}
                  {Object.keys(activePowers).length > 0 && (
                    <div className="text-purple-400">
                      {activePowers.double_collector ? '⚡ Collecteur x2' : ''}
                      {activePowers.magnetic_collector ? '🧲 Aimant' : ''}
                      {activePowers.three_lives ? '🛡️ 3 Vies' : ''}
                      {' ACTIF'}
                    </div>
                  )}
                  {/* 🎮 NOUVEAU : Affichage des utilisations restantes en jeu */}
                  {!Object.keys(activePowers).length && (
                    <div className="flex gap-2">
                      {doubleCollectorPower && doubleCollectorPower.usesRemaining && doubleCollectorPower.usesRemaining > 0 && (
                        <div className="text-purple-400">⚡ {doubleCollectorPower.usesRemaining} partie(s)</div>
                      )}
                      {magneticPower && magneticPower.usesRemaining && magneticPower.usesRemaining > 0 && (
                        <div className="text-cyan-400">🧲 {magneticPower.usesRemaining} partie(s)</div>
                      )}
                      {threeLivesPower && threeLivesPower.usesRemaining && threeLivesPower.usesRemaining > 0 && (
                        <div className="text-red-400">🛡️ {threeLivesPower.usesRemaining} partie(s)</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description du jeu */}
        <div className="mt-8 text-center text-gray-300 text-sm max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-red-400 text-2xl mb-2">⚠️</div>
              <h3 className="text-white font-semibold mb-2">SURVIE</h3>
              <p>Évitez TOUS les obstacles : météorites, roches et drapeaux. Un seul contact = Game Over !</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-yellow-400 text-2xl mb-2">🦴</div>
              <h3 className="text-white font-semibold mb-2">COLLECTION</h3>
              <p>Collectez les os délicieux pour gagner des points bonus. Chaque os vaut 10 points !</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-cyan-400 text-2xl mb-2">⚡</div>
              <h3 className="text-white font-semibold mb-2">DÉFI</h3>
              <p>Plus votre score augmente, plus le jeu devient rapide. Survivrez-vous à la vitesse maximale ?</p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-purple-400 text-2xl mb-2">🛒</div>
              <h3 className="text-white font-semibold mb-2">POUVOIRS</h3>
              <p>Collecteur x2 (50 os), Aimant Magnétique (100 os) et 3 Vies (200 os) ! Chacun utilisable pour 2 parties !</p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="text-orange-400 text-2xl mb-2">🐕</div>
              <h3 className="text-white font-semibold mb-2">DOGECOIN</h3>
              <p>Échangez vos os contre des Dogecoins ! 1000 os = 1 DOGE. TO THE MOON ! 🚀</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 NOUVEAU : Styles CSS pour les animations */}
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

export default App;