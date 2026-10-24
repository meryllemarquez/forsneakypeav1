// Logs Core Web Vitals (LCP, INP, CLS) to the browser console while developing. In a production
// build `import.meta.env.DEV` is replaced with `false`, so this whole branch - including the
// web-vitals library - is removed by the bundler and nothing extra ships to users.
export function reportWebVitals() {
  if (!import.meta.env.DEV) return;

  import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
    const log = (metric) => {
      const value = metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)} ms`;
      console.log(`[web-vitals] ${metric.name}: ${value} (${metric.rating})`);
    };
    onLCP(log);
    onINP(log);
    onCLS(log);
  });
}
