export const DASHBOARD_HTML:string = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wiki|Docs Metrics</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f8fafc; color: #172033; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(1rem, 4vw, 3rem); }
    main { max-width: 1440px; margin: auto; }
    h1 { margin: 0; font-size: clamp(1.7rem, 4vw, 2.4rem); letter-spacing: -.04em; font-weight: 720; }
    header p { color: #64748b; margin: .45rem 0 2rem; }
    .charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    section { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; box-shadow: 0 1px 2px rgb(15 23 42 / .04); padding: 1.25rem; min-width: 0; }
    h2 { margin: 0 0 1rem; font-size: .9rem; color: #475569; font-weight: 650; letter-spacing: .01em; }
    svg { display: block; width: 100%; min-height: 250px; overflow: visible; }
    .axis { stroke: #cbd5e1; stroke-width: 1; } .grid { stroke: #e2e8f0; stroke-width: 1; }
    .line { fill: none; stroke: #4e79a7; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
    .dot { fill: #4e79a7; } .label, .value { fill: #94a3b8; font-size: 11px; } .value { text-anchor: end; }
    .x-label { fill: #94a3b8; font-size: 10px; text-anchor: end; } .bar-label { fill: #94a3b8; font-size: 10px; text-anchor: middle; }
    .legend { display: flex; flex-wrap: wrap; gap: .45rem .8rem; margin-top: .6rem; font-size: .78rem; color: #64748b; }
    .legend span { display: inline-flex; align-items: center; gap: .3rem; } .swatch { width: .7rem; height: .7rem; border-radius: 2px; }
    .empty, .error { margin: 0; min-height: 250px; display: grid; place-items: center; color: #94a3b8; text-align: center; }
    .error { color: #dc2626; }
    @media (max-width: 720px) { body { padding: 1rem; } .charts { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header><h1>Wiki|Docs Metrics</h1><p>Active clients by period and application version.</p></header>
    <div id="charts" class="charts" aria-live="polite"></div>
  </main>
  <script>
    const MAX_VERSION_COLORS = 9;
    const OTHER_VERSIONS = 'Others';
    const PALETTE = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f'];
    const charts = document.getElementById('charts');
    const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
    const compareVersions = (left, right) => {
      const leftParts = left.split('.').map(Number); const rightParts = right.split('.').map(Number);
      return leftParts[0] - rightParts[0] || leftParts[1] - rightParts[1] || leftParts[2] - rightParts[2];
    };
    const formatPeriod = (period, kind) => kind === 'daily' ? new Date(period + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : period.replace('-', ' ');
    const groupPeriods = (items, key) => Object.values(items.reduce((groups, item) => {
      const period = item[key]; (groups[period] ??= { period, total: 0, versions: {} });
      groups[period].total += item.count; groups[period].versions[item.version] = (groups[period].versions[item.version] ?? 0) + item.count;
      return groups;
    }, {}));
    const card = (title, body, legend = '') => '<section><h2>' + title + '</h2>' + body + legend + '</section>';
    const empty = (title) => card(title, '<p class="empty">No metrics available yet.</p>');
    const lineChart = (title, periods, kind) => {
      if (!periods.length) return empty(title);
      const width = 640, height = 270, left = 42, right = 16, top = 16, bottom = 46, plotWidth = width - left - right, plotHeight = height - top - bottom;
      const maximum = Math.max(...periods.map((period) => period.total), 1); const y = (value) => top + plotHeight - value / maximum * plotHeight;
      const x = (index) => left + (periods.length === 1 ? plotWidth / 2 : index * plotWidth / (periods.length - 1));
      const points = periods.map((period, index) => x(index).toFixed(1) + ',' + y(period.total).toFixed(1)).join(' ');
      const grid = [0, .5, 1].map((ratio) => { const value = Math.round(maximum * ratio); const position = y(value); return '<line class="grid" x1="' + left + '" x2="' + (width-right) + '" y1="' + position + '" y2="' + position + '"></line><text class="value" x="' + (left-6) + '" y="' + (position+4) + '">' + value + '</text>'; }).join('');
      const labels = periods.map((period, index) => index % Math.max(1, Math.ceil(periods.length / 7)) ? '' : '<text class="x-label" transform="translate(' + x(index) + ',' + (height-8) + ') rotate(-40)">' + formatPeriod(period.period, kind) + '</text>').join('');
      const dots = periods.map((period, index) => '<circle class="dot" cx="' + x(index) + '" cy="' + y(period.total) + '" r="3"><title>' + escapeHtml(formatPeriod(period.period, kind)) + ': ' + period.total + '</title></circle>').join('');
      return card(title, '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Total active clients over time"><line class="axis" x1="' + left + '" x2="' + (width-right) + '" y1="' + (top+plotHeight) + '" y2="' + (top+plotHeight) + '"></line>' + grid + '<polyline class="line" points="' + points + '"></polyline>' + dots + labels + '</svg>');
    };
    const stackedChart = (title, periods, versions, colors, kind) => {
      if (!periods.length) return empty(title);
      const width = 640, height = 270, left = 12, right = 12, top = 12, bottom = 46, plotWidth = width - left - right, plotHeight = height - top - bottom;
      const gap = Math.min(8, plotWidth / periods.length / 3); const barWidth = Math.max(2, (plotWidth - gap * (periods.length - 1)) / periods.length);
      const bars = periods.map((period, index) => { let cursor = top + plotHeight; const x = left + index * (barWidth + gap); const segments = versions.map((version) => { const count = version === OTHER_VERSIONS ? Object.entries(period.versions).filter(([periodVersion]) => !versions.includes(periodVersion)).reduce((total, [, value]) => total + value, 0) : period.versions[version] ?? 0; if (!count) return ''; const segmentHeight = count / period.total * plotHeight; cursor -= segmentHeight; return '<rect x="' + x + '" y="' + cursor + '" width="' + barWidth + '" height="' + segmentHeight + '" fill="' + colors[version] + '"><title>' + escapeHtml(formatPeriod(period.period, kind) + ' · ' + version + ': ' + (count / period.total * 100).toFixed(1) + '%') + '</title></rect>'; }).join(''); const label = index % Math.max(1, Math.ceil(periods.length / 7)) ? '' : '<text class="bar-label" transform="translate(' + (x + barWidth / 2) + ',' + (height-8) + ') rotate(-40)">' + formatPeriod(period.period, kind) + '</text>'; return segments + label; }).join('');
      const legend = '<div class="legend">' + versions.map((version) => '<span><i class="swatch" style="background:' + colors[version] + '"></i>' + escapeHtml(version) + '</span>').join('') + '</div>';
      return card(title, '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Version share per period"><line class="axis" x1="' + left + '" x2="' + (width-right) + '" y1="' + (top+plotHeight) + '" y2="' + (top+plotHeight) + '"></line><text class="label" x="' + left + '" y="' + (top+10) + '">100%</text>' + bars + '</svg>', legend);
    };
    fetch('/api/stats').then((response) => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); }).then((stats) => {
      const daily = groupPeriods(stats.daily, 'date'); const weekly = groupPeriods(stats.weekly, 'week');
      const versionNames = [...new Set([...daily, ...weekly].flatMap((period) => Object.keys(period.versions)))].sort(compareVersions);
      const versions = versionNames.length > MAX_VERSION_COLORS ? [OTHER_VERSIONS, ...versionNames.slice(-(MAX_VERSION_COLORS - 1))] : versionNames;
      const colors = Object.fromEntries(versions.map((version, index) => [version, PALETTE[index % PALETTE.length]]));
      charts.innerHTML = lineChart('Daily total', daily, 'daily') + lineChart('Weekly total', weekly, 'weekly') + stackedChart('Daily versions', daily, versions, colors, 'daily') + stackedChart('Weekly versions', weekly, versions, colors, 'weekly');
    }).catch((error) => { charts.innerHTML = '<section class="error">Unable to load metrics: ' + escapeHtml(error.message) + '</section>'; });
  </script>
</body>
</html>`;
