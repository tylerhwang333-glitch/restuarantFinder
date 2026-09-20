// Wire Tailwind into Create React App's PostCSS pipeline.
//
// We do NOT use craco's `style.postcss.plugins` option: craco 7 injects the
// plugins as a FUNCTION (`() => [...]`), but the postcss-loader 6.x that ships
// with react-scripts 5 only expands an *array* (a function falls through to its
// object branch -> `Object.entries(fn)` -> `[]` -> zero plugins). The result is
// that every PostCSS plugin, Tailwind included, gets silently dropped and the
// app renders as unstyled HTML.
//
// Instead we reach into the finished webpack config and prepend `tailwindcss`
// to each postcss-loader's existing plugin array. Tailwind must run first so
// the utilities it generates are then processed (and autoprefixed via CRA's
// postcss-preset-env) by the plugins that follow.
const tailwindcss = require('tailwindcss');

function injectTailwind(rules) {
  for (const rule of rules || []) {
    if (Array.isArray(rule.use)) injectTailwind(rule.use);
    if (Array.isArray(rule.oneOf)) injectTailwind(rule.oneOf);

    const loader = typeof rule.loader === 'string' ? rule.loader : '';
    if (loader.includes('postcss-loader') && rule.options && rule.options.postcssOptions) {
      const postcssOptions = rule.options.postcssOptions;
      const existing =
        typeof postcssOptions.plugins === 'function'
          ? postcssOptions.plugins()
          : postcssOptions.plugins || [];
      if (!existing.includes(tailwindcss)) {
        postcssOptions.plugins = [tailwindcss, ...existing];
      }
    }
  }
}

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      injectTailwind(webpackConfig.module.rules);
      return webpackConfig;
    },
  },
};
