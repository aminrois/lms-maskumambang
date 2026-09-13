import { forwardRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err: string) => void;
}

/**
 * Wrapper hCaptcha widget.
 * Jika VITE_HCAPTCHA_SITE_KEY tidak diisi, widget otomatis dianggap terverifikasi.
 */
const HCaptchaWidget = forwardRef<HCaptcha, HCaptchaWidgetProps>(
  ({ onVerify, onExpire, onError }, ref) => {
    const siteKey = (import.meta.env.VITE_HCAPTCHA_SITE_KEY as string) || '';

    useEffect(() => {
      // Jika tidak ada site key yang dikonfigurasi, bypass otomatis
      if (!siteKey) {
        onVerify('disabled');
      }
    }, [siteKey, onVerify]);

    if (!siteKey) {
      return null;
    }

    return (
      <div className="flex justify-start">
        <HCaptcha
          ref={ref}
          sitekey={siteKey}
          onVerify={onVerify}
          onExpire={onExpire}
          onError={onError}
          theme="light"
          size="normal"
        />
      </div>
    );
  }
);

HCaptchaWidget.displayName = 'HCaptchaWidget';

export default HCaptchaWidget;

