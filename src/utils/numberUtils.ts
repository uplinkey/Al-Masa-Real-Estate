/**
 * Utility functions for Arabic/English digit normalization and system-wide number formatting.
 * Enforces English (Western Arabic 0-9) digits as the standard across the entire platform.
 */

// Mapping of Eastern Arabic (٠-٩) and Persian (۰-۹) numerals to Western English numerals (0-9)
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts any Arabic/Indic or Persian digits in a string or number into standard English digits (0-9).
 * Also replaces Arabic decimal point (٫) with standard dot (.).
 */
export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Convert Arabic-Indic (٠-٩)
  for (let i = 0; i < 10; i++) {
    str = str.split(ARABIC_INDIC_DIGITS[i]).join(String(i));
  }

  // Convert Persian (۰-۹)
  for (let i = 0; i < 10; i++) {
    str = str.split(PERSIAN_DIGITS[i]).join(String(i));
  }

  // Convert Arabic decimal separator (٫) to dot (.)
  str = str.replace(/[\u066B]/g, '.');
  // Remove Arabic thousand separator (٬)
  str = str.replace(/[\u066C]/g, '');

  return str;
}

/**
 * Normalizes user input and parses it as a clean float/integer.
 * Handles inputs with Arabic digits, spaces, and currency symbols.
 */
export function parseArabicNumber(input: string | number | null | undefined, defaultValue = 0): number {
  if (input === null || input === undefined) return defaultValue;
  const normalized = toEnglishDigits(input).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Formats a currency amount in Egyptian Pounds using standard English digits:
 * e.g. 1500000 -> "1,500,000 ج.م"
 */
export function formatEGP(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : parseArabicNumber(amount, 0);
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 0 })} ج.م`;
}

/**
 * Formats a number with thousand separators using standard English digits:
 * e.g. 185 -> "185", 2500 -> "2,500"
 */
export function formatEnglishNumber(
  amount: number | string | null | undefined,
  maximumFractionDigits = 0
): string {
  const num = typeof amount === 'number' ? amount : parseArabicNumber(amount, 0);
  return num.toLocaleString('en-US', { maximumFractionDigits });
}

/**
 * Global DOM interceptor:
 * Automatically intercepts any input typed or pasted containing Arabic-Indic digits
 * and immediately converts it into English digits (0-9) so that both the DOM element
 * and React state handlers receive standard English digits instantly.
 */
export function initializeGlobalArabicDigitConverter(): () => void {
  const hasArabicDigits = (str: string) => /[\u0660-\u0669\u06F0-\u06F9]/.test(str);

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !('value' in target)) return;

    const currentVal = target.value;
    if (typeof currentVal === 'string' && hasArabicDigits(currentVal)) {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const converted = toEnglishDigits(currentVal);

      // Only update if changed
      if (converted !== currentVal) {
        // Set value directly via native setter to notify React's internal tracker
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(target, converted);
        } else {
          target.value = converted;
        }

        // Restore cursor position
        if (start !== null && end !== null) {
          try {
            target.setSelectionRange(start, end);
          } catch (_) {
            // Some input types (e.g. number/email) do not support setSelectionRange
          }
        }

        // Dispatch a synthetic input event so React state updates
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text');
    if (text && hasArabicDigits(text)) {
      e.preventDefault();
      const converted = toEnglishDigits(text);
      document.execCommand('insertText', false, converted);
    }
  };

  document.addEventListener('input', handleInput, true);
  document.addEventListener('paste', handlePaste as EventListener, true);

  return () => {
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('paste', handlePaste as EventListener, true);
  };
}
