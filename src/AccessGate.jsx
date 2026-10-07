import { useState, useEffect } from 'react';
import PrototypeApp from './PrototypeApp.jsx';

// ────────────────────────────────────────────────────────────
// Codes d'accès valides pour cette démo.
// Ajoute ou retire des codes ici — un par personne à qui tu envoies la démo,
// pour savoir facilement qui a utilisé quel accès.
// ────────────────────────────────────────────────────────────
const VALID_CODES = [
  'CLAUDIA2026',
];

const PALETTE = {
  ink: '#1B2A44',
  paper: '#F3F5F8',
  brass: '#A87C2E',
  rule: '#C9D2DE',
  muted: '#5B6472',
};

function AccessGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('jf_demo_access');
    if (saved && VALID_CODES.includes(saved)) {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (VALID_CODES.includes(trimmed)) {
      sessionStorage.setItem('jf_demo_access', trimmed);
      setUnlocked(true);
      setError('');
    } else {
      setError("Ce code d'accès n'est pas valide. Vérifiez auprès de la personne qui vous l'a transmis.");
    }
  };

  if (unlocked) {
    return <PrototypeApp />;
  }

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: '420px', width: '100%', background: '#FFFFFF', borderRadius: '8px', padding: '36px 32px', boxShadow: '0 2px 10px rgba(27,42,68,0.08)', border: `1px solid ${PALETTE.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>⚖️</span>
          <span style={{ fontWeight: 700, fontSize: '20px', color: PALETTE.ink }}>JuriFormulaires</span>
        </div>
        <p style={{ color: PALETTE.muted, fontSize: '14px', marginTop: '0', marginBottom: '22px' }}>
          Démonstration privée — accès par invitation seulement.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '13px', color: PALETTE.ink, fontWeight: 600, marginBottom: '6px' }}>
            Code d'accès
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Entrez votre code"
            autoFocus
            style={{ width: '100%', padding: '10px 12px', fontSize: '15px', border: `1px solid ${PALETTE.rule}`, borderRadius: '6px', boxSizing: 'border-box', marginBottom: '14px' }}
          />
          {error && (
            <p style={{ color: '#B23A3A', fontSize: '13px', marginTop: '-6px', marginBottom: '14px' }}>{error}</p>
          )}
          <button
            type="submit"
            style={{ width: '100%', padding: '11px', fontSize: '15px', fontWeight: 600, color: '#FFFFFF', background: PALETTE.ink, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Accéder à la démo
          </button>
        </form>
        <p style={{ color: PALETTE.muted, fontSize: '12px', marginTop: '20px', marginBottom: 0, lineHeight: 1.5 }}>
          Ceci est un prototype à des fins de démonstration — information générale, pas un avis juridique. À valider par un avocat ou notaire avant tout usage officiel.
        </p>
      </div>
    </div>
  );
}

export default AccessGate;
