import { forwardRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err: string) => void;
}

/**
 * Wrapper hCaptcha widget.
 * Expose ref ke parent agar bisa di-reset setelah login gagal:
 *   hcaptchaRef.current?.resetCaptcha()
 */
const HCaptchaWidget = forwardRef<HCaptcha, HCaptchaWidgetProps>(
  ({ onVerify, onExpire, onError }, ref) => {
    const siteKey = (import.meta.env.VITE_HCAPTCHA_SITE_KEY as string);

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
