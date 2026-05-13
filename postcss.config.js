export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Auto-generates [dir="rtl"] variants for direction-sensitive CSS
    // (margin/padding/text-align/float/transform, etc.). The i18n provider
    // sets <html dir="rtl"> for Arabic/Hebrew/Persian/Urdu so these rules
    // activate automatically — no per-component changes needed.
    'postcss-rtlcss': {
      mode: 'combined',
      ltrPrefix: '[dir="ltr"]',
      rtlPrefix: '[dir="rtl"]',
      processUrls: false,
      useCalc: true,
    },
  },
};
