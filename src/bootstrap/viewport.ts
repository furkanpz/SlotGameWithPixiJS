import { Application } from "pixi.js";
import { GameConstants } from "../GameConstants";
import { DisposableStore } from "./disposables";

export type DeviceProfile = {
  isMobile: boolean;
  baseWidth: number;
  baseHeight: number;
};

export const detectDeviceProfile = (): DeviceProfile => {
  const userAgent = navigator.userAgent || "";
  const isTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
  const isMobile = isTouch && (isMobileUserAgent || isSmallScreen);
  GameConstants.setIsMobile(isMobile);
  return {
    isMobile,
    baseWidth: isMobile ? GameConstants.MOBILE_SCREEN.BASE_WIDTH : GameConstants.SCREEN.BASE_WIDTH,
    baseHeight: isMobile ? GameConstants.MOBILE_SCREEN.BASE_HEIGHT : GameConstants.SCREEN.BASE_HEIGHT,
  };
};

export class PixiViewportController {
  private disposables = new DisposableStore();

  public constructor(
    private readonly app: Application,
    private readonly container: HTMLElement,
    private readonly profile: DeviceProfile,
  ) {
    this.resize();
    this.registerListeners();
    if (this.profile.isMobile) {
      this.attachAdaptiveResolutionTuner();
    }
  }

  private registerListeners(): void {
    const addWindowListener = (
      eventName: keyof WindowEventMap,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) => {
      window.addEventListener(eventName, listener, options);
      this.disposables.add(() => window.removeEventListener(eventName, listener, options));
    };

    const addDocumentListener = (
      eventName: keyof DocumentEventMap,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) => {
      document.addEventListener(eventName, listener, options);
      this.disposables.add(() => document.removeEventListener(eventName, listener, options));
    };

    addWindowListener("resize", this.resize);
    addWindowListener("orientationchange", this.resize);
    addDocumentListener("fullscreenchange", this.resize);
    addDocumentListener("webkitfullscreenchange" as keyof DocumentEventMap, this.resize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.resize);
      window.visualViewport.addEventListener("scroll", this.resize);
      this.disposables.add(() => window.visualViewport?.removeEventListener("resize", this.resize));
      this.disposables.add(() => window.visualViewport?.removeEventListener("scroll", this.resize));
    }
  }

  private getViewportRect(): { width: number; height: number } {
    const wrapper = document.getElementById("app-container");
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      return {
        width: Math.floor(visualViewport.width),
        height: Math.floor(visualViewport.height),
      };
    }
    const rect = (wrapper ?? this.container).getBoundingClientRect();
    return {
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    };
  }

  private resize = (): void => {
    const rect = this.getViewportRect();
    const scale = Math.min(rect.width / this.profile.baseWidth, rect.height / this.profile.baseHeight);
    const cssWidth = Math.max(1, Math.floor(this.profile.baseWidth * scale));
    const cssHeight = Math.max(1, Math.floor(this.profile.baseHeight * scale));
    const canvas = this.app.canvas as HTMLCanvasElement;
    this.app.stage.scale.set(1);
    this.app.stage.position.set(0, 0);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
  };

  private attachAdaptiveResolutionTuner(): void {
    const renderer = this.app.renderer as Application["renderer"] & { resolution: number };
    const minResolution = 0.75;
    const maxResolution = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    const samples: number[] = [];
    const timer = window.setInterval(() => {
      const fps = this.app.ticker.FPS || 0;
      samples.push(fps);
      if (samples.length > 4) {
        samples.shift();
      }
      const averageFps = samples.reduce((sum, value) => sum + value, 0) / samples.length || 0;
      let nextResolution = renderer.resolution;
      if (averageFps < 48) {
        nextResolution = renderer.resolution * 0.9;
      } else if (averageFps > 58) {
        nextResolution = renderer.resolution * 1.04;
      }
      const clampedResolution = Math.max(minResolution, Math.min(maxResolution, Number(nextResolution.toFixed(2))));
      if (Math.abs(clampedResolution - renderer.resolution) < 0.01) {
        return;
      }
      try {
        renderer.resolution = clampedResolution;
        renderer.resize(this.profile.baseWidth, this.profile.baseHeight);
      } catch {}
    }, 1000);

    this.disposables.add(() => window.clearInterval(timer));
  }

  public destroy(): void {
    this.disposables.dispose();
  }
}
