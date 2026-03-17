import { DisposableStore } from "./disposables";

const isMobileClient = (): boolean => {
  const userAgent = navigator.userAgent || "";
  const isTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
  return isTouch && (isMobileUserAgent || isSmallScreen);
};

export const installBrowserChrome = (): (() => void) => {
  const disposables = new DisposableStore();
  const setViewportHeight = () => {
    try {
      const viewport = window.visualViewport;
      const unit = viewport ? viewport.height / 100 : window.innerHeight / 100;
      document.documentElement.style.setProperty("--vvh", `${unit}px`);
    } catch {}
  };

  const addDomListener = <K extends keyof WindowEventMap>(
    target: Window | VisualViewport,
    eventName: K,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ) => {
    target.addEventListener(eventName, listener, options);
    disposables.add(() => target.removeEventListener(eventName, listener, options));
  };

  const addDocumentListener = (
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ) => {
    document.addEventListener(eventName, listener, options);
    disposables.add(() => document.removeEventListener(eventName, listener, options));
  };

  setViewportHeight();
  addDomListener(window, "resize", setViewportHeight);
  if (window.visualViewport) {
    addDomListener(window.visualViewport, "resize", setViewportHeight);
    addDomListener(window.visualViewport, "scroll", setViewportHeight);
  }

  const preventDefault = (event: Event) => event.preventDefault();
  addDocumentListener("contextmenu", preventDefault, { capture: true });
  addDocumentListener("selectstart", preventDefault, { capture: true });
  addDocumentListener("gesturestart", preventDefault, { capture: true });
  addDocumentListener("gesturechange", preventDefault, { capture: true });
  addDocumentListener("gestureend", preventDefault, { capture: true });

  const isTopWindow = window.top === window;
  const query = window.location.search + window.location.hash;
  const hasNoEmbedFlag = !/[?&#]embed=1\b/.test(query);
  const disableFullscreen = /[?&#]nofullscreen=1\b/.test(query);

  if (isTopWindow && hasNoEmbedFlag && !disableFullscreen && isMobileClient()) {
    const requestFullscreen = () => {
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        return;
      }
      if (!document.hasFocus()) {
        return;
      }
      const target = document.getElementById("app-container") || document.documentElement;
      const request =
        target.requestFullscreen ||
        (target as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        }).webkitRequestFullscreen ||
        (target as HTMLElement & {
          mozRequestFullScreen?: () => Promise<void>;
        }).mozRequestFullScreen ||
        (target as HTMLElement & {
          msRequestFullscreen?: () => Promise<void>;
        }).msRequestFullscreen;

      if (!request) {
        return;
      }

      try {
        const result = request.call(target);
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch {}
    };

    const fullscreenOptions: AddEventListenerOptions = { capture: true, passive: true, once: true };
    addDocumentListener("pointerdown", requestFullscreen, fullscreenOptions);
    addDocumentListener("touchstart", requestFullscreen, fullscreenOptions);
    addDocumentListener("click", requestFullscreen, fullscreenOptions);
    addDocumentListener("keydown", requestFullscreen, { capture: true, once: true });
  }

  return () => disposables.dispose();
};
