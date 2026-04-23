/* global React */
const { useState: useStateT, useEffect: useEffectT } = React;

// ===== Tweaks panel =====
function Tweaks() {
  const [open, setOpen] = useStateT(false);
  const [active, setActive] = useStateT(false);
  const [theme, setTheme] = useStateT(() => document.documentElement.dataset.theme || 'light');
  const [accent, setAccent] = useStateT('emerald');
  const [anim, setAnim] = useStateT(true);
  const [headline, setHeadline] = useStateT('A');

  useEffectT(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') { setActive(true); setOpen(true); }
      if (e.data?.type === '__deactivate_edit_mode') { setActive(false); setOpen(false); }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffectT(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffectT(() => {
    const map = {
      emerald: { a: 'oklch(0.55 0.12 165)', d: 'oklch(0.42 0.11 165)', s: 'oklch(0.92 0.04 165)' },
      teal:    { a: 'oklch(0.62 0.10 195)', d: 'oklch(0.48 0.10 195)', s: 'oklch(0.92 0.04 195)' },
      saffron: { a: 'oklch(0.68 0.13 55)',  d: 'oklch(0.52 0.13 55)',  s: 'oklch(0.94 0.05 65)'  },
      indigo:  { a: 'oklch(0.55 0.14 270)', d: 'oklch(0.40 0.14 270)', s: 'oklch(0.92 0.05 270)' },
    };
    const c = map[accent];
    document.documentElement.style.setProperty('--accent', c.a);
    document.documentElement.style.setProperty('--accent-deep', c.d);
    document.documentElement.style.setProperty('--accent-soft', c.s);
  }, [accent]);

  useEffectT(() => {
    document.documentElement.dataset.anim = anim ? 'on' : 'off';
  }, [anim]);

  useEffectT(() => {
    window.dispatchEvent(new CustomEvent('headline-change', { detail: headline }));
  }, [headline]);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      background: 'var(--paper)', color: 'var(--ink)',
      border: '1px solid var(--rule)', borderRadius: 14,
      boxShadow: 'var(--shadow-lg)',
      width: open ? 280 : 'auto',
      fontFamily: 'var(--sans)',
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', borderBottom: open ? '1px solid var(--rule)' : 'none',
      }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tweaks</span>
        <span style={{ fontSize: 14 }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
          <Row label="Theme">
            {['light', 'dark'].map(t => (
              <Pill key={t} active={theme === t} onClick={() => setTheme(t)}>{t}</Pill>
            ))}
          </Row>
          <Row label="Accent">
            {['emerald', 'teal', 'saffron', 'indigo'].map(c => (
              <Pill key={c} active={accent === c} onClick={() => setAccent(c)}>{c}</Pill>
            ))}
          </Row>
          <Row label="Hero headline">
            {['A', 'B', 'C'].map(h => (
              <Pill key={h} active={headline === h} onClick={() => setHeadline(h)}>{h}</Pill>
            ))}
          </Row>
          <Row label="Animations">
            <Pill active={anim} onClick={() => setAnim(true)}>on</Pill>
            <Pill active={!anim} onClick={() => setAnim(false)}>off</Pill>
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 10px',
      borderRadius: 999,
      border: '1px solid var(--rule)',
      background: active ? 'var(--ink)' : 'var(--paper-2)',
      color: active ? 'var(--paper)' : 'var(--ink-2)',
      fontSize: 11,
      transition: 'all 150ms',
    }}>{children}</button>
  );
}

window.Tweaks = Tweaks;
