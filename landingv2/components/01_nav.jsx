/* global React */
const { useState, useEffect, useRef } = React;

// ===== Logo =====
function Logo({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size,
        background: 'var(--ink)',
        color: 'var(--paper)',
        borderRadius: 7,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--serif)',
        fontSize: size * 0.6,
        fontStyle: 'italic',
        lineHeight: 1,
        paddingTop: 2,
      }}>Dr</div>
      <span style={{ fontSize: 17, letterSpacing: '-0.02em', fontWeight: 500 }}>
        Cliniq
      </span>
    </div>
  );
}

// ===== Live IST clock + ticker =====
function useISTClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  // IST = UTC+5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const h = ist.getHours();
  const m = ist.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, '0');
  return { time: `${h12}:${mm} ${ampm}`, h, after: h >= 19 || h < 7 };
}

function LiveTicker() {
  const { time, after } = useISTClock();
  const [count, setCount] = useState(2847);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3) + 1), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
      background: 'var(--paper-2)',
      fontFamily: 'var(--mono)',
      fontSize: 12,
      letterSpacing: '0.02em',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      color: 'var(--ink-2)',
    }}>
      <div style={{
        display: 'inline-flex',
        animation: 'marquee 60s linear infinite',
        gap: 56,
        padding: '10px 0',
      }}>
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} style={{ display: 'inline-flex', gap: 56 }}>
            <span><span className="live-dot" style={{ marginRight: 8, verticalAlign: 'middle' }} /> IST {time} — it's {after ? 'after-hours' : 'clinic-hours'}, AI is on duty</span>
            <span>{count.toLocaleString('en-IN')} replies handled today</span>
            <span>1,284 doctors are off-clock right now. Their inboxes aren't.</span>
            <span>Dr Sharma, Lucknow — 47 messages auto-handled in the last hour</span>
            <span>Monsoon protocol active in 6 cities</span>
            <span>NMC + DPDP + ABDM compliant</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Nav =====
function Nav({ onSignup }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in oklch, var(--paper) 92%, transparent)',
      backdropFilter: 'saturate(140%) blur(14px)',
      WebkitBackdropFilter: 'saturate(140%) blur(14px)',
      borderBottom: scrolled ? '1px solid var(--rule)' : '1px solid transparent',
      transition: 'border-color 200ms',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <Logo />
        <nav style={{ display: 'flex', gap: 28, fontSize: 14, color: 'var(--ink-2)' }}>
          {['Live demo', 'AI', 'Features', 'How it works', 'Pricing'].map(l => (
            <a key={l} href={`#${l.replace(/\s+/g,'-').toLowerCase()}`} className="u-link">{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a className="u-link" style={{ fontSize: 14, color: 'var(--ink-2)' }}>Log in</a>
          <button className="btn btn-accent" onClick={onSignup}>
            Start in 60 sec
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

window.Logo = Logo;
window.Nav = Nav;
window.LiveTicker = LiveTicker;
window.useISTClock = useISTClock;
