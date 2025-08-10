import { useState, useEffect, useCallback } from 'react';

/**
 * 📱 HOOK RESPONSIVE CANVAS - useResponsiveCanvas
 * 
 * Gère le redimensionnement automatique du canvas pour mobile
 * Maintient le ratio d'aspect et évite le scroll
 * 
 * 🎯 FONCTIONNALITÉS :
 * - Canvas responsive avec ratio maintenu
 * - Détection d'orientation (portrait/landscape)
 * - Calcul automatique des dimensions optimales
 * - Prévention du scroll sur mobile
 * - Support multi-résolutions
 */

interface CanvasSize {
  width: number;
  height: number;
  scale: number;
}

interface OrientationInfo {
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
}

export const useResponsiveCanvas = (baseWidth: number = 800, baseHeight: number = 600) => {
  // 📱 État du canvas responsive
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: baseWidth,
    height: baseHeight,
    scale: 1
  });

  // 🔄 État de l'orientation
  const [orientation, setOrientation] = useState<OrientationInfo>({
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth > window.innerHeight,
    angle: 0
  });

  // 📐 Calcul des dimensions optimales du canvas
  const calculateCanvasSize = useCallback((): CanvasSize => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = baseWidth / baseHeight;
    
    // 📱 Padding pour éviter les bords sur mobile
    const padding = 16;
    const availableWidth = screenWidth - padding * 2;
    const availableHeight = screenHeight - padding * 2;
    
    // 🎯 Calcul responsive avec ratio maintenu
    let finalWidth: number;
    let finalHeight: number;
    
    if (availableWidth / aspectRatio <= availableHeight) {
      // Limité par la largeur
      finalWidth = availableWidth;
      finalHeight = availableWidth / aspectRatio;
    } else {
      // Limité par la hauteur
      finalHeight = availableHeight;
      finalWidth = availableHeight * aspectRatio;
    }
    
    // 📏 Calcul du facteur d'échelle
    const scale = finalWidth / baseWidth;
    
    return {
      width: Math.floor(finalWidth),
      height: Math.floor(finalHeight),
      scale: scale
    };
  }, [baseWidth, baseHeight]);

  // 🔄 Mise à jour de l'orientation
  const updateOrientation = useCallback(() => {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isLandscape = window.innerWidth > window.innerHeight;
    
    // 📱 Détection de l'angle d'orientation (si disponible)
    let angle = 0;
    if (screen.orientation) {
      angle = screen.orientation.angle;
    } else if (window.orientation !== undefined) {
      angle = window.orientation;
    }
    
    setOrientation({
      isPortrait,
      isLandscape,
      angle
    });
    
    console.log('📱 Orientation changed:', {
      isPortrait,
      isLandscape,
      angle,
      dimensions: `${window.innerWidth}x${window.innerHeight}`
    });
  }, []);

  // 📐 Gestionnaire de redimensionnement
  const handleResize = useCallback(() => {
    const newSize = calculateCanvasSize();
    setCanvasSize(newSize);
    updateOrientation();
    
    console.log('📐 Canvas resized:', newSize);
  }, [calculateCanvasSize, updateOrientation]);

  // 🎯 Initialisation et événements
  useEffect(() => {
    // Calcul initial
    handleResize();
    
    // 📱 Événements de redimensionnement
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // 🚫 Prévention du scroll sur mobile
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    // Désactiver le scroll tactile
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    // 🧹 Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [handleResize]);

  // 📱 Fonction utilitaire pour forcer le plein écran
  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  }, []);

  return {
    canvasSize,
    orientation,
    requestFullscreen,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
};