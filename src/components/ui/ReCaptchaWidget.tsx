import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact';
          tabindex?: number;
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onRecaptchaLoadedCallback?: () => void;
  }
}

export interface ReCaptchaRef {
  resetCaptcha: () => void;
  getResponse: () => string;
}

interface ReCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

const DEFAULT_SITE_KEY = '6LesLNgtAAAAABTM_pOOGpt58UpV6iMBwHRLKL9k';

export const ReCaptchaWidget = forwardRef<ReCaptchaRef, ReCaptchaWidgetProps>(
  ({ onVerify, onExpire, onError, theme = 'light', size = 'normal', className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.endsWith('.local'));

    const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) || DEFAULT_SITE_KEY;

    useImperativeHandle(ref, () => ({
      resetCaptcha: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            console.error('Failed to reset reCAPTCHA widget:', e);
          }
        }
      },
      getResponse: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          return window.grecaptcha.getResponse(widgetIdRef.current) || '';
        }
        return '';
      },
    }));

    // 1. Muat skrip Google reCAPTCHA v2 jika bukan di localhost
    useEffect(() => {
      if (isLocalhost) {
        onVerify('disabled');
        return;
      }

      if (!siteKey) {
        onVerify('disabled');
        return;
      }

      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        setIsScriptLoaded(true);
        return;
      }

      const scriptId = 'google-recaptcha-v2-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(() => {
              setIsScriptLoaded(true);
            });
          }
        };
        script.onerror = () => {
          if (onError) onError();
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            setIsScriptLoaded(true);
            clearInterval(interval);
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }, [siteKey, onError, onVerify]);

    // 2. Render widget ketika skrip sudah siap dan container tersedia
    useEffect(() => {
      if (!isScriptLoaded || !containerRef.current || !window.grecaptcha || !siteKey) {
        return;
      }

      // Hindari duplikasi render jika widget sudah ada
      if (widgetIdRef.current !== null) {
        return;
      }

      try {
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            onVerify(token);
          },
          'expired-callback': () => {
            if (onExpire) onExpire();
          },
          'error-callback': () => {
            if (onError) onError();
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error('Error rendering reCAPTCHA:', err);
      }
    }, [isScriptLoaded, siteKey, theme, size, onVerify, onExpire, onError]);

    if (!siteKey || isLocalhost) {
      return null;
    }

    return (
      <div className={`recaptcha-wrapper flex justify-center sm:justify-start overflow-x-auto py-1 ${className}`}>
        <div ref={containerRef} className="recaptcha-inner" />
      </div>
    );
  }
);

ReCaptchaWidget.displayName = 'ReCaptchaWidget';

export default ReCaptchaWidget;
