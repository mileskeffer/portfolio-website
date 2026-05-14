/// <reference types="astro/client" />

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      action?: string;
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      sitekey: string;
      size?: 'normal' | 'compact' | 'flexible';
      theme?: 'light' | 'dark' | 'auto';
    }
  ): string | number;
  remove(widgetId: string | number): void;
  reset(widgetId: string | number): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export {};
