import React from 'react';
import { Player, Obstacle, Collectible, Particle } from '../types/GameTypes';
import { GAME_CONFIG } from '../utils/GameUtils';

/**
 * 🎨 COMPOSANT DE RENDU GRAPHIQUE - GameRenderer
 * 
 * Ce composant gère tout le rendu visuel du jeu sur Canvas HTML5 :
 * 
 * 🎯 RESPONSABILITÉS PRINCIPALES :
 * - Rendu du background spatial (étoiles, surface lunaire)
 * - Animation du joueur avec alternance de skins
 * - Rendu des obstacles avec images ou fallback code
 * - Rendu des collectibles (os) avec effet flottant
 * - Système de particules pour les effets visuels
 * - Gestion du parallax et du scrolling
 * 
 * 🎬 SYSTÈME D'ANIMATION :
 * - Animation du joueur : alternance entre 2 skins toutes les 8 frames
 * - Effet flottant pour les os avec oscillation sinusoïdale
 * - Particules avec physique simple (vélocité, friction, fade)
 * - Parallax des étoiles pour l'effet de profondeur
 * 
 * 🖼️ GESTION DES ASSETS :
 * - Chargement conditionnel des images (joueur, obstacles, os)
 * - Fallback vers rendu par code si les images échouent
 * - Optimisation avec états de chargement
 * 
 * 📱 ADAPTATIONS MOBILES NÉCESSAIRES :
 * - Réduire le nombre de particules pour les performances
 * - Simplifier les animations sur les appareils bas de gamme
 * - Adapter la taille du Canvas selon la résolution d'écran
 * - Optimiser le rendu pour les GPU mobiles
 * 
 * 🎮 INTÉGRATION AVEC LE JEU :
 * - Reçoit les données du jeu via props (player, obstacles, etc.)
 * - Utilise useEffect pour le rendu à chaque frame
 * - Synchronisé avec la boucle de jeu principale
 */
interface GameRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;     // Référence au Canvas HTML5
  player: Player;                                    // État du joueur (position, taille, etc.)
  obstacles: Obstacle[];                             // Tableau des obstacles à rendre
  collectibles: Collectible[];                       // Tableau des os à rendre
  particles: Particle[];                             // Système de particules pour les effets
  stars: Array<{ x: number; y: number; size: number; opacity: number }>; // Étoiles du background
  worldOffset: number;                               // Décalage du monde pour le scrolling
}

export const GameRenderer: React.FC<GameRendererProps> = ({
  canvasRef,
  player,
  obstacles,
  collectibles,
  particles,
  stars,
  worldOffset,
}) => {
  // 🎬 ANIMATION DU JOUEUR
  // Frame d'animation pour l'alternance des skins et les effets
  const [animationFrame, setAnimationFrame] = React.useState(0);

  // 🎮 CHARGEMENT DES SKINS DU JOUEUR
  // Deux skins pour créer une animation de course fluide
  const [playerSkin1Image, setPlayerSkin1Image] = React.useState<HTMLImageElement | null>(null);
  const [playerSkin2Image, setPlayerSkin2Image] = React.useState<HTMLImageElement | null>(null);
  const [skin1Loaded, setSkin1Loaded] = React.useState(false);
  const [skin2Loaded, setSkin2Loaded] = React.useState(false);
  const [bothSkinsLoaded, setBothSkinsLoaded] = React.useState(false);

  // 🖼️ CHARGEMENT DES IMAGES D'OBSTACLES
  // Mapping des types d'obstacles vers leurs images respectives
  const [obstacleImages, setObstacleImages] = React.useState<{[key: string]: HTMLImageElement | null}>({
    meteorite: null,  // Météorite en rotation
    rock: null,       // Rocher lunaire statique
    flag: null,       // Drapeau avec animation de flottement
  });

  // 🦴 CHARGEMENT DE L'IMAGE DE L'OS
  // Asset principal pour les collectibles
  const [boneImage, setBoneImage] = React.useState<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const [boneImageLoaded, setBoneImageLoaded] = React.useState(false);

  // 🖼️ CHARGEMENT DES IMAGES D'OBSTACLES
  /**
   * Charge les images des obstacles depuis le dossier public
   * Gère les erreurs de chargement avec fallback vers rendu par code
   */
  React.useEffect(() => {
    console.log('🚀 Loading obstacle images with correct filenames...');
    
    // Mapping des types vers les fichiers d'images
    const imageMap = {
      meteorite: '/aaobstacle122.png',
      rock: '/aaobstacle133.png', 
      flag: '/aaaobstacle155.png',
    };

    const loadedImages: {[key: string]: HTMLImageElement | null} = {};
    let loadCount = 0;
    const totalImages = Object.keys(imageMap).length;

    // Chargement asynchrone de chaque image
    Object.entries(imageMap).forEach(([type, src]) => {
      console.log(`🔄 Loading ${type} from ${src}`);
      
      const img = new Image();
      
      // Succès du chargement
      img.onload = () => {
        console.log(`✅ SUCCESS: ${type} loaded from ${src}`);
        loadedImages[type] = img;
        loadCount++;
        
        if (loadCount === totalImages) {
          console.log('🎉 All obstacle images loaded successfully!');
          setObstacleImages(loadedImages);
          setImagesLoaded(true);
        }
      };
      
      // Échec du chargement (fallback vers rendu par code)
      img.onerror = (error) => {
        console.log(`❌ FAILED: Could not load ${type} from ${src}`);
        console.log('Error details:', error);
        loadedImages[type] = null;
        loadCount++;
        
        if (loadCount === totalImages) {
          console.log('⚠️ Image loading completed (some failed)');
          setObstacleImages(loadedImages);
          setImagesLoaded(true);
        }
      };
      
      img.src = src;
    });
  }, []);

  // 🦴 CHARGEMENT DE L'IMAGE DE L'OS
  /**
   * Charge l'image de l'os depuis /os.png
   * Fallback vers rendu par code si échec
   */
  React.useEffect(() => {
    console.log('🦴 Loading bone image...');
    
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ SUCCESS: Bone image loaded from /os.png');
      setBoneImage(img);
      setBoneImageLoaded(true);
    };
    
    img.onerror = (error) => {
      console.log('❌ FAILED: Could not load bone image from /os.png');
      console.log('Error details:', error);
      setBoneImage(null);
      setBoneImageLoaded(true); // Marquer comme terminé même en cas d'échec
    };
    
    img.src = '/os.png';
  }, []);

  // 🎮 CHARGEMENT DES SKINS DU JOUEUR
  /**
   * Charge les deux skins du joueur pour l'animation de course
   * aaaskin1.png et aaaskin2.png alternent pour créer le mouvement
   */
  React.useEffect(() => {
    console.log('🎬 Loading player skin images for animation...');
    
    // Chargement du premier skin
    const img1 = new Image();
    img1.onload = () => {
      console.log('✅ SUCCESS: Animation skin 1 loaded from /aaaskin1.png');
      setPlayerSkin1Image(img1);
      setSkin1Loaded(true);
    };
    img1.onerror = (error) => {
      console.log('❌ FAILED: Could not load animation skin 1 from /aaaskin1.png');
      console.log('Error details:', error);
      setPlayerSkin1Image(null);
      setSkin1Loaded(true);
    };
    img1.src = '/aaaskin1.png';
    
    // Chargement du deuxième skin
    const img2 = new Image();
    img2.onload = () => {
      console.log('✅ SUCCESS: Animation skin 2 loaded from /aaaskin2.png');
      setPlayerSkin2Image(img2);
      setSkin2Loaded(true);
    };
    img2.onerror = (error) => {
      console.log('❌ FAILED: Could not load animation skin 2 from /aaaskin2.png');
      console.log('Error details:', error);
      setPlayerSkin2Image(null);
      setSkin2Loaded(true);
    };
    img2.src = '/aaaskin2.png';
  }, []);

  // 🎬 VÉRIFICATION DU CHARGEMENT COMPLET DES SKINS
  React.useEffect(() => {
    if (skin1Loaded && skin2Loaded) {
      setBothSkinsLoaded(true);
      console.log('🎬 Both animation skins loaded, ready to animate!');
    }
  }, [skin1Loaded, skin2Loaded]);

  // 🎬 BOUCLE D'ANIMATION PRINCIPALE
  /**
   * Met à jour la frame d'animation toutes les 16ms (60 FPS)
   * Cycle de 24 frames pour l'alternance des skins (8 frames par skin)
   */
  React.useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 24); // Cycle de 24 frames (0.4 seconde complète)
    }, 16); // 60 FPS pour une animation fluide

    return () => clearInterval(animationInterval);
  }, []);

  // 🎨 RENDU PRINCIPAL DU JEU
  /**
   * Fonction de rendu principale exécutée à chaque frame
   * Dessine tous les éléments du jeu sur le Canvas dans l'ordre correct
   */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 🌌 BACKGROUND SPATIAL
    // Gradient complexe pour simuler l'espace profond
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // 🌟 ÉTOILES AVEC EFFET PARALLAX
    // Les étoiles bougent à une vitesse différente pour créer la profondeur
    stars.forEach(star => {
      const parallaxX = (star.x - worldOffset * 0.1) % (GAME_CONFIG.CANVAS_WIDTH + 100);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.beginPath();
      ctx.arc(parallaxX, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 🌙 SURFACE LUNAIRE
    // Sol gris avec texture pour simuler la poussière lunaire
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, GAME_CONFIG.GROUND_Y, GAME_CONFIG.CANVAS_WIDTH, 100);

    // Texture de la surface lunaire (petits rectangles répétés)
    ctx.fillStyle = '#4b5563';
    for (let i = 0; i < GAME_CONFIG.CANVAS_WIDTH; i += 20) {
      const x = (i - (worldOffset % 20));
      if (x > -20 && x < GAME_CONFIG.CANVAS_WIDTH + 20) {
        ctx.fillRect(x, GAME_CONFIG.GROUND_Y, 10, 5);
      }
    }

    // 🦴 RENDU DES COLLECTIBLES (OS)
    // Rendus avant les obstacles pour l'ordre de profondeur correct
    collectibles.forEach(bone => {
      if (!bone.collected) {
        ctx.save();
        
        // ✨ EFFET FLOTTANT
        // Oscillation sinusoïdale pour un mouvement naturel
        const floatOffset = Math.sin(bone.animation) * 8; // Amplitude de 8px pour un effet visible mais doux
        
        const boneX = bone.position.x;
        const boneY = bone.position.y + floatOffset;
        
        if (boneImageLoaded && boneImage) {
          // 🖼️ RENDU AVEC IMAGE
          console.log('🦴 Rendering bone with IMAGE');
          ctx.drawImage(
            boneImage,
            boneX,
            boneY,
            bone.width,
            bone.height
          );
        } else {
          // 🎨 FALLBACK VERS RENDU PAR CODE
          console.log('🦴 Rendering bone with CODE FALLBACK');
          ctx.translate(
            boneX + bone.width / 2,
            boneY + bone.height / 2
          );
          
          // Dessin d'un os stylisé en code
          const boneWidth = bone.width + 30; // +30px pour le fallback (au lieu de +20px)
          const boneHeight = bone.height + 30;
          
          ctx.fillStyle = '#f5f5dc'; // Couleur os (beige)
          ctx.strokeStyle = '#8b7355'; // Bordure marron
          ctx.lineWidth = 4; // Bordure encore plus épaisse
          
          // Corps de l'os (rectangle arrondi central)
          ctx.beginPath();
          ctx.roundRect(-boneWidth/2 + 10, -5, boneWidth - 20, 10, 5);
          ctx.fill();
          ctx.stroke();
          
          // Extrémités de l'os (cercles aux deux bouts)
          ctx.beginPath();
          ctx.arc(-boneWidth/2 + 8, -4, 8, 0, Math.PI * 2);
          ctx.arc(-boneWidth/2 + 8, 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(boneWidth/2 - 8, -4, 8, 0, Math.PI * 2);
          ctx.arc(boneWidth/2 - 8, 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        
        ctx.restore();
      }
    });

    // 🎮 RENDU DU JOUEUR
    // Animation avec alternance de skins ou fallback vers rendu par code
    ctx.save();
    
    if (bothSkinsLoaded && playerSkin1Image && playerSkin2Image) {
      // 🎬 ANIMATION AVEC DEUX SKINS
      // Alternance toutes les 8 frames (plus rapide pour plus de fluidité)
      const currentSkin = Math.floor(animationFrame / 8) % 2 === 0 ? playerSkin1Image : playerSkin2Image;
      const skinName = Math.floor(animationFrame / 8) % 2 === 0 ? 'aaaskin1' : 'aaaskin2';
      console.log('🎬 Rendering player with ANIMATED SKIN:', skinName);
      
      // Effet de rebond subtil pendant la course
      const bounce = Math.sin(animationFrame * 0.4) * 2;
      
      ctx.drawImage(
        currentSkin,
        player.position.x,
        player.position.y + bounce,
        player.width,
        player.height
      );
    } else if (playerSkin1Image && skin1Loaded) {
      // 🖼️ FALLBACK VERS UN SEUL SKIN
      console.log('🎮 Rendering player with SKIN 1 ONLY (animation fallback)');
      
      const bounce = Math.sin(animationFrame * 0.4) * 2;
      
      ctx.drawImage(
        playerSkin1Image,
        player.position.x,
        player.position.y + bounce,
        player.width,
        player.height
      );
    } else {
      // 🎨 FALLBACK FINAL VERS RENDU PAR CODE
      console.log('🎮 Rendering player with CODE FALLBACK (no images)');
      
      ctx.translate(player.position.x + player.width / 2, player.position.y + player.height / 2);
      
      // Animation simple pour le fallback
      const bounce = Math.sin(animationFrame * 0.4) * 2; // Plus rapide
      ctx.translate(0, bounce);
      
      // Corps du Doge (forme elliptique orange)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(0, 5, 30, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Casque d'astronaute (cercle transparent)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(0, -10, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Visage du Doge (cercle rouge)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -10, 18, 0, Math.PI * 2);
      ctx.fill();

      // Yeux avec clignotement animé
      ctx.fillStyle = '#000';
      const eyeHeight = Math.abs(Math.sin(animationFrame * 0.1)) > 0.9 ? 1 : 2.5;
      ctx.beginPath();
      ctx.ellipse(-6, -15, 2.5, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(6, -15, 2.5, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nez (petit cercle noir)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, -8, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Pattes avec animation de course
      ctx.fillStyle = '#f97316';
      const legOffset = Math.sin(animationFrame * 0.6) * 3;
      ctx.fillRect(-22, 20 + legOffset, 10, 18);
      ctx.fillRect(-6, 20 - legOffset, 10, 18);
      ctx.fillRect(6, 20 + legOffset, 10, 18);
      ctx.fillRect(20, 20 - legOffset, 10, 18);
    }

    ctx.restore();

    // 🖼️ RENDU DES OBSTACLES
    // Utilise les images chargées ou fallback vers rendu par code
    obstacles.forEach((obstacle) => {
      ctx.save();
      
      const obstacleImage = obstacleImages[obstacle.type];
      
      if (imagesLoaded && obstacleImage) {
        // 🖼️ RENDU AVEC IMAGE
        console.log(`🎯 Rendering obstacle ${obstacle.type} with IMAGE`);
        ctx.drawImage(
          obstacleImage,
          obstacle.position.x,
          obstacle.position.y,
          obstacle.width,
          obstacle.height
        );
      } else {
        // 🎨 FALLBACK VERS RENDU PAR CODE
        console.log(`🎯 Rendering obstacle ${obstacle.type} with CODE FALLBACK`);
        renderObstacleWithCode(ctx, obstacle, animationFrame);
      }
      
      ctx.restore();
    });

    // ✨ RENDU DES PARTICULES
    // Système de particules pour les effets visuels (explosions, collections)
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [canvasRef, player, obstacles, collectibles, particles, stars, worldOffset, animationFrame, obstacleImages, imagesLoaded, boneImage, boneImageLoaded, bothSkinsLoaded, playerSkin1Image, playerSkin2Image]);
  
  return null;
};

/**
 * 🎨 FONCTION DE RENDU PAR CODE DES OBSTACLES
 * 
 * Fallback utilisé quand les images ne se chargent pas
 * Dessine les obstacles avec du code Canvas pur
 * 
 * @param ctx - Contexte Canvas 2D
 * @param obstacle - Obstacle à rendre
 * @param animationFrame - Frame d'animation actuelle
 */
function renderObstacleWithCode(ctx: CanvasRenderingContext2D, obstacle: Obstacle, animationFrame: number) {
  ctx.translate(
    obstacle.position.x + obstacle.width / 2,
    obstacle.position.y + obstacle.height / 2
  );

  if (obstacle.type === 'meteorite') {
    // 🌠 MÉTÉORITE avec rotation animée
    ctx.rotate(animationFrame * 0.1);
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cratères sur la météorite
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(5, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, 5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (obstacle.type === 'rock') {
    // 🪨 ROCHER LUNAIRE statique
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Détails du rocher
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(-obstacle.width / 2 + 5, -obstacle.height / 2 + 5, 8, 8);
    ctx.fillRect(-obstacle.width / 2 + 15, -obstacle.height / 2 + 10, 6, 6);
    
    // Ombre du rocher
    ctx.fillStyle = '#374151';
    ctx.fillRect(-obstacle.width / 2, obstacle.height / 2 - 8, obstacle.width, 8);
  } else if (obstacle.type === 'flag') {
    // 🚩 DRAPEAU avec animation de flottement
    const flagWave = Math.sin(animationFrame * 0.6) * 3;
    ctx.translate(-obstacle.width / 2, -obstacle.height / 2);
    
    // Mât du drapeau
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 4, obstacle.height);

    // Tissu du drapeau avec effet de vent
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(obstacle.width + flagWave, 5);
    ctx.lineTo(obstacle.width + flagWave, 20);
    ctx.lineTo(4, 15);
    ctx.closePath();
    ctx.fill();

    // Symbole d'avertissement sur le drapeau
    ctx.fillStyle = '#fbbf24';
    ctx.font = '12px Arial';
    ctx.fillText('⚠', obstacle.width - 15 + flagWave, 12);
  }
}