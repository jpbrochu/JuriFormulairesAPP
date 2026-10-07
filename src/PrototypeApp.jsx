import { useState } from 'react';
import { Home, FileText, Coins, Mail, Users, Plus, X, AlertTriangle, Scale } from 'lucide-react';

const PALETTE = {
  ink: '#1B2A44',
  paper: '#F3F5F8',
  paperCard: '#FFFFFF',
  rule: '#C9D2DE',
  brass: '#A87C2E',
  green: '#2F6B4F',
  rust: '#9A3324',
  muted: '#5B6472',
};

const tr = (fr, en, lang) => (lang === 'fr' ? fr : en);

function currency(n, lang) {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
}

let idCounter = 100;
const nextId = () => idCounter++;

/* ---------- Shared building blocks ---------- */
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span style={{ color: PALETTE.muted }} className="text-xs block mb-1">{label}</span>
      {children}
      {hint && <span style={{ color: PALETTE.muted }} className="text-xs block mt-1 leading-snug">{hint}</span>}
    </label>
  );
}
function TextInput(props) {
  return <input {...props} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" />;
}
function NumberInput(props) {
  return <input type="number" min="0" step="10" {...props} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm tabnum" />;
}
function TextArea(props) {
  return <textarea {...props} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" />;
}
function SectionTitle({ children }) {
  return (
    <div style={{ borderBottom: `1px solid ${PALETTE.ink}` }} className="pb-1.5 mb-4">
      <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.05rem', fontWeight: 600 }}>{children}</h2>
    </div>
  );
}
function Card({ children }) {
  return <div style={{ border: `1px solid ${PALETTE.rule}`, background: PALETTE.paperCard }} className="rounded p-3 mb-3">{children}</div>;
}
function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ color: PALETTE.brass, border: `1px solid ${PALETTE.brass}` }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded">
      <Plus size={14} /> {children}
    </button>
  );
}
function RemoveButton({ onClick }) {
  return <button onClick={onClick} style={{ color: PALETTE.muted }} className="p-1.5 shrink-0"><X size={16} /></button>;
}
function SummaryPanel({ title, children }) {
  return (
    <div style={{ background: PALETTE.ink, color: PALETTE.paper }} className="rounded p-5 mt-6">
      <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.1rem', fontWeight: 600 }} className="mb-4">{title}</h2>
      {children}
    </div>
  );
}
function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline mb-2 text-sm">
      <span style={{ opacity: 0.8 }}>{label}</span>
      <span className="tabnum font-medium">{value}</span>
    </div>
  );
}
function SubHeading({ children }) {
  return <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-6">{children}</h3>;
}
function PieceRefRow({ label, demValue, defValue, onDem, onDef }) {
  return (
    <div className="mb-2">
      <p style={{ color: PALETTE.muted }} className="text-xs mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <TextInput placeholder="P-" value={demValue} onChange={onDem} />
        <TextInput placeholder="D-" value={defValue} onChange={onDef} />
      </div>
    </div>
  );
}
function Note({ children }) {
  return (
    <p style={{ color: PALETTE.muted }} className="text-xs leading-snug mb-3 flex items-start gap-1.5">
      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
      {children}
    </p>
  );
}

/* ================= Domaine 1 : Union parentale (v2 — aligné sur le vrai SJ-1337) ================= */
const UNION_CATEGORY_META = [
  { key: 'residences', fr: 'Résidences familiales', en: 'Family residences', hasEval: true },
  { key: 'meubles', fr: 'Meubles et effets familiaux', en: 'Family furniture & belongings', hasEval: false },
  { key: 'vehicules', fr: 'Véhicules familiaux', en: 'Family vehicles', hasEval: false },
];

const DEDUCTION_ROWS = [
  { key: 'a', fr: "a) Biens possédés avant l'union parentale", en: 'a) Property owned before the parental union', baseFr: "Valeur nette à l'inclusion", baseEn: 'Net value when included' },
  { key: 'a1', fr: "a.1) Remploi d'un bien possédé avant l'union", en: 'a.1) Reinvestment of pre-union property', baseFr: 'Remploi', baseEn: 'Reinvestment' },
  { key: 'b', fr: "b) Apport durant l'union par succession ou donation", en: 'b) Contribution during the union by inheritance/gift', baseFr: 'Apport', baseEn: 'Contribution' },
  { key: 'b1', fr: "b.1) Remploi d'un apport par succession ou donation", en: 'b.1) Reinvestment of an inheritance/gift contribution', baseFr: 'Remploi', baseEn: 'Reinvestment' },
];

const blankRefs = { refTitreDem: '', refTitreDef: '', refValeurDem: '', refValeurDef: '', refDettesDem: '', refDettesDef: '' };

const seedItems = () => ({
  residences: [
    { id: nextId(), description: 'Résidence principale', owner: 'commun', ...blankRefs, evalFonciereAnnee: '', demValue: 450000, demDebt: 280000, defValue: 450000, defDebt: 280000 },
  ],
  meubles: [],
  vehicules: [
    { id: nextId(), description: 'Véhicule familial', owner: 'dem', ...blankRefs, demValue: 22000, demDebt: 8000, defValue: 20000, defDebt: 8000 },
  ],
});

function UnionParentaleTab({ lang }) {
  // En-tête
  const [district, setDistrict] = useState('');
  const [localite, setLocalite] = useState('');
  const [dossierNo, setDossierNo] = useState('');
  const [division, setDivision] = useState('civile');
  const [dateEtablie, setDateEtablie] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [demandeurName, setDemandeurName] = useState(tr('Partie demanderesse', 'Claimant party', lang));
  const [defendeurName, setDefendeurName] = useState(tr('Partie défenderesse', 'Respondent party', lang));

  // Partie B — biens et valeur nette
  const [items, setItems] = useState(seedItems);

  // Partie A — exclusions (biens exclus entièrement, informatif)
  const [exclusions, setExclusions] = useState([]);

  // Déductions agrégées (art. 521.36)
  const [deductions, setDeductions] = useState(
    DEDUCTION_ROWS.map((r) => ({ key: r.key, demBase: 0, demPlus: 0, defBase: 0, defPlus: 0 }))
  );

  // Partie D — autres biens inclus par écrit
  const [autres, setAutres] = useState([]);

  // Partie E — gains RRQ/RPC (deux lignes distinctes, comme au formulaire officiel)
  const [rrqIncluded, setRrqIncluded] = useState(false);
  const [rrqDem, setRrqDem] = useState(0);
  const [rrqDef, setRrqDef] = useState(0);
  const [rpcDem, setRpcDem] = useState(0);
  const [rpcDef, setRpcDef] = useState(0);

  // Parties F/G/H/I
  const [reglesNonApplicables, setReglesNonApplicables] = useState(false);
  const [reglesMotifs, setReglesMotifs] = useState('');
  const [paiementCompDemande, setPaiementCompDemande] = useState(false);
  const [paiementCompMotifs, setPaiementCompMotifs] = useState('');
  const [partageInegalDemande, setPartageInegalDemande] = useState(false);
  const [partageInegalMotifs, setPartageInegalMotifs] = useState('');
  const [demPct, setDemPct] = useState(50);
  const [modalites, setModalites] = useState('');
  const [years, setYears] = useState(1);

  // Déclaration
  const [declarationAcceptee, setDeclarationAcceptee] = useState(false);
  const [declarantName, setDeclarantName] = useState('');

  const updateItem = (catKey, id, field, val) =>
    setItems((prev) => ({ ...prev, [catKey]: prev[catKey].map((it) => (it.id === id ? { ...it, [field]: val } : it)) }));
  const addItem = (catKey) =>
    setItems((prev) => ({ ...prev, [catKey]: [...prev[catKey], { id: nextId(), description: '', owner: 'commun', ...blankRefs, evalFonciereAnnee: '', demValue: 0, demDebt: 0, defValue: 0, defDebt: 0 }] }));
  const removeItem = (catKey, id) =>
    setItems((prev) => ({ ...prev, [catKey]: prev[catKey].filter((it) => it.id !== id) }));

  const updateList = (setter, id, field, val) => setter((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const addToList = (setter, shape) => setter((prev) => [...prev, { id: nextId(), ...shape }]);
  const removeFromList = (setter, id) => setter((prev) => prev.filter((it) => it.id !== id));

  const updateDeduction = (key, field, val) =>
    setDeductions((prev) => prev.map((d) => (d.key === key ? { ...d, [field]: val } : d)));

  // ---- Calculs ----
  let totalNetDem = 0, totalNetDef = 0;
  const perItemAvg = {};
  UNION_CATEGORY_META.forEach(({ key }) => {
    items[key].forEach((it) => {
      const netDem = Math.max(0, (Number(it.demValue) || 0) - (Number(it.demDebt) || 0));
      const netDef = Math.max(0, (Number(it.defValue) || 0) - (Number(it.defDebt) || 0));
      totalNetDem += netDem;
      totalNetDef += netDef;
      perItemAvg[it.id] = { netDem, netDef, avg: (netDem + netDef) / 2, owner: it.owner };
    });
  });

  const totalDeductDem = deductions.reduce((s, d) => s + (Number(d.demBase) || 0) + (Number(d.demPlus) || 0), 0);
  const totalDeductDef = deductions.reduce((s, d) => s + (Number(d.defBase) || 0) + (Number(d.defPlus) || 0), 0);

  const totalAutresDem = autres.reduce((s, a) => s + (Number(a.demValue) || 0), 0);
  const totalAutresDef = autres.reduce((s, a) => s + (Number(a.defValue) || 0), 0);

  const rrqDemAmt = rrqIncluded ? (Number(rrqDem) || 0) + (Number(rpcDem) || 0) : 0;
  const rrqDefAmt = rrqIncluded ? (Number(rrqDef) || 0) + (Number(rpcDef) || 0) : 0;

  const valeurPartageableDem = Math.max(0, totalNetDem - totalDeductDem) + totalAutresDem + rrqDemAmt;
  const valeurPartageableDef = Math.max(0, totalNetDef - totalDeductDef) + totalAutresDef + rrqDefAmt;

  const totalNetAvg = (totalNetDem + totalNetDef) / 2;
  const deductAvg = (totalDeductDem + totalDeductDef) / 2;
  const autresAvg = (totalAutresDem + totalAutresDef) / 2;
  const rrqAvg = (rrqDemAmt + rrqDefAmt) / 2;
  const valeurPartageableAvg = Math.max(0, totalNetAvg - deductAvg) + autresAvg + rrqAvg;

  const demSharePct = partageInegalDemande ? Number(demPct) || 50 : 50;
  const defSharePct = 100 - demSharePct;
  const demShare = valeurPartageableAvg * (demSharePct / 100);
  const defShare = valeurPartageableAvg * (defSharePct / 100);

  let demHeldRaw = 0, defHeldRaw = 0;
  Object.values(perItemAvg).forEach(({ avg, owner }) => {
    if (owner === 'dem') demHeldRaw += avg;
    else if (owner === 'def') defHeldRaw += avg;
    else { demHeldRaw += avg / 2; defHeldRaw += avg / 2; }
  });
  const adjust = (deductAvg / 2) - (autresAvg / 2) - (rrqAvg / 2);
  const demHeld = Math.max(0, demHeldRaw - adjust);
  const defHeld = Math.max(0, defHeldRaw - adjust);

  const diff = demHeld - demShare;
  const balance = Math.abs(diff);
  const debtor = diff > 0 ? demandeurName : defendeurName;
  const creditor = diff > 0 ? defendeurName : demandeurName;
  const annualPayment = years > 0 ? balance / years : balance;
  const monthlyPayment = annualPayment / 12;

  const disagreement = Math.abs(valeurPartageableDem - valeurPartageableDef) > 1;

  return (
    <div>
      <SectionTitle>{tr('Union parentale — État du patrimoine (SJ-1337)', 'Parental Union — Patrimony Statement (SJ-1337)', lang)}</SectionTitle>
      <p style={{ color: PALETTE.muted }} className="text-sm mb-4">
        {tr('Calculateur préparatoire aligné sur la structure du formulaire officiel — à valider avec un avocat ou notaire.', 'Preparatory calculator aligned with the official form structure — to be validated by a lawyer or notary.', lang)}
      </p>

      {/* En-tête */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('District', 'District', lang)}><TextInput value={district} onChange={(e) => setDistrict(e.target.value)} /></Field>
        <Field label={tr('Localité', 'Locality', lang)}><TextInput value={localite} onChange={(e) => setLocalite(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('No de dossier', 'File number', lang)}><TextInput value={dossierNo} onChange={(e) => setDossierNo(e.target.value)} /></Field>
        <Field label={tr('Division', 'Division', lang)}>
          <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
            <option value="civile">{tr('Civile', 'Civil', lang)}</option>
            <option value="jeunesse">{tr('Jeunesse', 'Youth', lang)}</option>
          </select>
        </Field>
      </div>
      <div className="mb-3">
        <Field label={tr('La valeur du patrimoine d’union parentale est établie au', 'The value of the parental union patrimony is established as of', lang)} hint={tr('Date de référence pour l’évaluation de tous les biens ci-dessous — distincte des dates de début/fin de l’union.', 'Reference date for valuing all assets below — distinct from the union’s start/end dates.', lang)}>
          <input type="date" value={dateEtablie} onChange={(e) => setDateEtablie(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr("Date de début de l'union parentale", 'Start date of the parental union', lang)}>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" />
        </Field>
        <Field label={tr("Date de fin de l'union parentale", 'End date of the parental union', lang)}>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <Field label={tr('Nom — partie demanderesse', 'Name — claimant party', lang)}><TextInput value={demandeurName} onChange={(e) => setDemandeurName(e.target.value)} /></Field>
        <Field label={tr('Nom — partie défenderesse', 'Name — respondent party', lang)}><TextInput value={defendeurName} onChange={(e) => setDefendeurName(e.target.value)} /></Field>
      </div>

      {/* Partie A — Exclusions */}
      <SubHeading>{tr('Partie A — Biens exclus du patrimoine', 'Part A — Property excluded from the patrimony', lang)}</SubHeading>
      <p style={{ color: PALETTE.muted }} className="text-xs mb-3">{tr('Liste informative — ces biens ne sont pas comptés dans le calcul ci-dessous.', 'Informational list — these assets are not counted in the calculation below.', lang)}</p>
      {exclusions.map((ex) => (
        <Card key={ex.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Bien exclu', 'Excluded asset', lang)} value={ex.description} onChange={(e) => updateList(setExclusions, ex.id, 'description', e.target.value)} />
            <RemoveButton onClick={() => removeFromList(setExclusions, ex.id)} />
          </div>
          <div className="mb-2"><TextInput placeholder={tr("Motif d'exclusion", 'Reason for exclusion', lang)} value={ex.motif} onChange={(e) => updateList(setExclusions, ex.id, 'motif', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={demandeurName}><NumberInput value={ex.demValue} onChange={(e) => updateList(setExclusions, ex.id, 'demValue', parseFloat(e.target.value) || 0)} /></Field>
            <Field label={defendeurName}><NumberInput value={ex.defValue} onChange={(e) => updateList(setExclusions, ex.id, 'defValue', parseFloat(e.target.value) || 0)} /></Field>
          </div>
        </Card>
      ))}
      <AddButton onClick={() => addToList(setExclusions, { description: '', motif: '', demValue: 0, defValue: 0 })}>{tr('Ajouter un bien exclu', 'Add an excluded asset', lang)}</AddButton>

      {/* Partie B — biens et valeur nette */}
      <SubHeading>{tr('Partie B — Valeur nette des biens', 'Part B — Net value of assets', lang)}</SubHeading>
      {UNION_CATEGORY_META.map(({ key, fr, en, hasEval }) => (
        <div key={key} className="mb-6">
          <h4 style={{ color: PALETTE.ink, borderBottom: `1px solid ${PALETTE.rule}` }} className="text-sm font-semibold pb-1.5 mb-3">{lang === 'fr' ? fr : en}</h4>
          {items[key].length >= 3 && (
            <Note>{tr('Le formulaire officiel prévoit 2 emplacements pour cette catégorie — au-delà, joignez une annexe.', 'The official form provides 2 slots for this category — beyond that, attach a schedule.', lang)}</Note>
          )}
          {items[key].length === 0 && <p style={{ color: PALETTE.muted }} className="text-sm italic mb-3">{tr('Aucun bien', 'No assets', lang)}</p>}
          <div className="space-y-3">
            {items[key].map((it) => {
              const netDem = Math.max(0, (Number(it.demValue) || 0) - (Number(it.demDebt) || 0));
              const netDef = Math.max(0, (Number(it.defValue) || 0) - (Number(it.defDebt) || 0));
              return (
                <Card key={it.id}>
                  <div className="flex items-start gap-2 mb-2.5">
                    <TextInput value={it.description} onChange={(e) => updateItem(key, it.id, 'description', e.target.value)} placeholder={tr('Description du bien', 'Asset description', lang)} />
                    <RemoveButton onClick={() => removeItem(key, it.id)} />
                  </div>
                  <div className="mb-2.5">
                    <Field label={tr('Détenu actuellement par', 'Currently held by', lang)}>
                      <select value={it.owner} onChange={(e) => updateItem(key, it.id, 'owner', e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
                        <option value="dem">{demandeurName}</option>
                        <option value="def">{defendeurName}</option>
                        <option value="commun">{tr('Commun', 'Joint', lang)}</option>
                      </select>
                    </Field>
                  </div>
                  {hasEval && (
                    <div className="mb-2.5">
                      <Field label={tr('Éval. foncière (année)', 'Municipal assessment (year)', lang)}>
                        <TextInput value={it.evalFonciereAnnee} onChange={(e) => updateItem(key, it.id, 'evalFonciereAnnee', e.target.value)} />
                      </Field>
                    </div>
                  )}
                  <div style={{ borderTop: `1px dashed ${PALETTE.rule}` }} className="pt-2.5 mt-1 mb-1">
                    <p style={{ color: PALETTE.ink }} className="text-xs font-semibold mb-2">{tr('Références de pièces (P- / D-)', 'Exhibit references (P- / D-)', lang)}</p>
                    {hasEval && (
                      <>
                        <PieceRefRow
                          label={tr('Titre de propriété', 'Title deed', lang)}
                          demValue={it.refTitreDem} defValue={it.refTitreDef}
                          onDem={(e) => updateItem(key, it.id, 'refTitreDem', e.target.value)}
                          onDef={(e) => updateItem(key, it.id, 'refTitreDef', e.target.value)}
                        />
                        <PieceRefRow
                          label={tr('Valeur marchande', 'Market value', lang)}
                          demValue={it.refValeurDem} defValue={it.refValeurDef}
                          onDem={(e) => updateItem(key, it.id, 'refValeurDem', e.target.value)}
                          onDef={(e) => updateItem(key, it.id, 'refValeurDef', e.target.value)}
                        />
                      </>
                    )}
                    <PieceRefRow
                      label={tr('Dettes', 'Debts', lang)}
                      demValue={it.refDettesDem} defValue={it.refDettesDef}
                      onDem={(e) => updateItem(key, it.id, 'refDettesDem', e.target.value)}
                      onDef={(e) => updateItem(key, it.id, 'refDettesDef', e.target.value)}
                    />
                  </div>

                  <div style={{ borderTop: `1px dashed ${PALETTE.rule}` }} className="pt-2.5 mt-1 grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{demandeurName}</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Field label={tr('Valeur marchande', 'Market value', lang)}><NumberInput value={it.demValue} onChange={(e) => updateItem(key, it.id, 'demValue', parseFloat(e.target.value) || 0)} /></Field>
                        <Field label={tr('Dettes', 'Debts', lang)}><NumberInput value={it.demDebt} onChange={(e) => updateItem(key, it.id, 'demDebt', parseFloat(e.target.value) || 0)} /></Field>
                      </div>
                      <p style={{ color: PALETTE.green }} className="text-xs font-medium tabnum mt-1.5">{tr('Net', 'Net', lang)}: {currency(netDem, lang)}</p>
                    </div>
                    <div>
                      <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{defendeurName}</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Field label={tr('Valeur marchande', 'Market value', lang)}><NumberInput value={it.defValue} onChange={(e) => updateItem(key, it.id, 'defValue', parseFloat(e.target.value) || 0)} /></Field>
                        <Field label={tr('Dettes', 'Debts', lang)}><NumberInput value={it.defDebt} onChange={(e) => updateItem(key, it.id, 'defDebt', parseFloat(e.target.value) || 0)} /></Field>
                      </div>
                      <p style={{ color: PALETTE.green }} className="text-xs font-medium tabnum mt-1.5">{tr('Net', 'Net', lang)}: {currency(netDef, lang)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <AddButton onClick={() => addItem(key)}>{tr('Ajouter un bien', 'Add asset', lang)}</AddButton>
        </div>
      ))}

      {/* Déductions */}
      <SubHeading>{tr('Déductions (art. 521.36 C.c.Q.)', 'Deductions (art. 521.36 C.C.Q.)', lang)}</SubHeading>
      {DEDUCTION_ROWS.map((row) => {
        const d = deductions.find((x) => x.key === row.key);
        return (
          <Card key={row.key}>
            <p style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2">{lang === 'fr' ? row.fr : row.en}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{demandeurName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={lang === 'fr' ? row.baseFr : row.baseEn}><NumberInput value={d.demBase} onChange={(e) => updateDeduction(row.key, 'demBase', parseFloat(e.target.value) || 0)} /></Field>
                  <Field label={tr('Plus-value', 'Appreciation', lang)}><NumberInput value={d.demPlus} onChange={(e) => updateDeduction(row.key, 'demPlus', parseFloat(e.target.value) || 0)} /></Field>
                </div>
              </div>
              <div>
                <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{defendeurName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={lang === 'fr' ? row.baseFr : row.baseEn}><NumberInput value={d.defBase} onChange={(e) => updateDeduction(row.key, 'defBase', parseFloat(e.target.value) || 0)} /></Field>
                  <Field label={tr('Plus-value', 'Appreciation', lang)}><NumberInput value={d.defPlus} onChange={(e) => updateDeduction(row.key, 'defPlus', parseFloat(e.target.value) || 0)} /></Field>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Partie D — autres biens */}
      <SubHeading>{tr("Partie D — Autres biens inclus par écrit", 'Part D — Other assets included in writing', lang)}</SubHeading>
      {autres.length >= 3 && <Note>{tr('Le formulaire officiel prévoit 2 emplacements ici.', 'The official form provides 2 slots here.', lang)}</Note>}
      {autres.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Description', 'Description', lang)} value={a.description} onChange={(e) => updateList(setAutres, a.id, 'description', e.target.value)} />
            <RemoveButton onClick={() => removeFromList(setAutres, a.id)} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={demandeurName}><NumberInput value={a.demValue} onChange={(e) => updateList(setAutres, a.id, 'demValue', parseFloat(e.target.value) || 0)} /></Field>
            <Field label={defendeurName}><NumberInput value={a.defValue} onChange={(e) => updateList(setAutres, a.id, 'defValue', parseFloat(e.target.value) || 0)} /></Field>
          </div>
        </Card>
      ))}
      <AddButton onClick={() => addToList(setAutres, { description: '', demValue: 0, defValue: 0 })}>{tr('Ajouter un bien', 'Add an asset', lang)}</AddButton>

      {/* Partie E — RRQ/RPC */}
      <SubHeading>{tr('Partie E — Gains inscrits durant l\u2019union (RRQ / RPC)', 'Part E — Earnings recorded during the union (QPP / CPP)', lang)}</SubHeading>
      <label className="flex items-center gap-2 text-sm mb-3">
        <input type="checkbox" checked={rrqIncluded} onChange={(e) => setRrqIncluded(e.target.checked)} />
        {tr('Inclus par entente entre les parties', 'Included by agreement between the parties', lang)}
      </label>
      {rrqIncluded && (
        <>
          <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{tr('Régie des rentes du Québec (R.R.Q.)', 'Québec Pension Plan (QPP)', lang)}</p>
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Field label={demandeurName}><NumberInput value={rrqDem} onChange={(e) => setRrqDem(parseFloat(e.target.value) || 0)} /></Field>
            <Field label={defendeurName}><NumberInput value={rrqDef} onChange={(e) => setRrqDef(parseFloat(e.target.value) || 0)} /></Field>
          </div>
          <p style={{ color: PALETTE.brass }} className="text-xs font-semibold mb-1.5">{tr('Régime de pension du Canada (R.P.C.)', 'Canada Pension Plan (CPP)', lang)}</p>
          <div className="grid grid-cols-2 gap-2.5 mb-2">
            <Field label={demandeurName}><NumberInput value={rpcDem} onChange={(e) => setRpcDem(parseFloat(e.target.value) || 0)} /></Field>
            <Field label={defendeurName}><NumberInput value={rpcDef} onChange={(e) => setRpcDef(parseFloat(e.target.value) || 0)} /></Field>
          </div>
        </>
      )}

      {/* Parties F, G, H, I */}
      <SubHeading>{tr('Partie F — Application des règles', 'Part F — Application of the rules', lang)}</SubHeading>
      <label className="flex items-center gap-2 text-sm mb-2">
        <input type="checkbox" checked={reglesNonApplicables} onChange={(e) => setReglesNonApplicables(e.target.checked)} />
        {tr("Je suis d'avis que les règles ne sont pas applicables en l'espèce", 'I believe the rules do not apply in this case', lang)}
      </label>
      {reglesNonApplicables && <TextArea rows={2} placeholder={tr('Motifs', 'Reasons', lang)} value={reglesMotifs} onChange={(e) => setReglesMotifs(e.target.value)} />}

      <SubHeading>{tr('Partie G — Demande de paiement compensatoire', 'Part G — Compensatory payment request', lang)}</SubHeading>
      <label className="flex items-center gap-2 text-sm mb-2">
        <input type="checkbox" checked={paiementCompDemande} onChange={(e) => setPaiementCompDemande(e.target.checked)} />
        {tr('Je demande un paiement compensatoire (art. 521.39 C.c.Q.)', 'I am requesting a compensatory payment (art. 521.39 C.C.Q.)', lang)}
      </label>
      {paiementCompDemande && <TextArea rows={2} placeholder={tr('Motifs', 'Reasons', lang)} value={paiementCompMotifs} onChange={(e) => setPaiementCompMotifs(e.target.value)} />}

      <SubHeading>{tr('Partie H — Demande de partage inégal', 'Part H — Unequal division request', lang)}</SubHeading>
      <label className="flex items-center gap-2 text-sm mb-2">
        <input type="checkbox" checked={partageInegalDemande} onChange={(e) => setPartageInegalDemande(e.target.checked)} />
        {tr('Je demande un partage inégal (art. 521.40 C.c.Q.) — par défaut, le partage est de 50 / 50', 'I am requesting an unequal division (art. 521.40 C.C.Q.) — the default split is 50 / 50', lang)}
      </label>
      {partageInegalDemande && (
        <>
          <div className="mb-2"><Field label={tr(`Part demandée pour ${demandeurName} (%)`, `Share requested for ${demandeurName} (%)`, lang)}><NumberInput min="0" max="100" value={demPct} onChange={(e) => setDemPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} /></Field></div>
          <TextArea rows={2} placeholder={tr('Motifs', 'Reasons', lang)} value={partageInegalMotifs} onChange={(e) => setPartageInegalMotifs(e.target.value)} />
        </>
      )}

      <SubHeading>{tr("Partie I — Modalités d'exécution du partage", 'Part I — Terms for carrying out the division', lang)}</SubHeading>
      <TextArea rows={2} placeholder={tr('Modalités de paiement, sûreté, etc.', 'Payment terms, security, etc.', lang)} value={modalites} onChange={(e) => setModalites(e.target.value)} />

      {/* Déclaration */}
      <SubHeading>{tr('Déclaration', 'Declaration', lang)}</SubHeading>
      <label className="flex items-start gap-2 text-sm mb-2">
        <input type="checkbox" className="mt-0.5" checked={declarationAcceptee} onChange={(e) => setDeclarationAcceptee(e.target.checked)} />
        {tr('Je déclare que les renseignements fournis sont exacts et complets, au meilleur de ma connaissance.', 'I declare that the information provided is accurate and complete, to the best of my knowledge.', lang)}
      </label>
      <TextInput placeholder={tr('Nom du déclarant', 'Declarant name', lang)} value={declarantName} onChange={(e) => setDeclarantName(e.target.value)} />

      {/* Sommaire */}
      <SummaryPanel title={tr('Sommaire du partage', 'Partition summary', lang)}>
        {disagreement && (
          <p style={{ color: PALETTE.brass }} className="text-xs mb-4 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            {tr('Les valeurs déclarées par les deux parties diffèrent — le calcul ci-dessous utilise leur moyenne à titre illustratif seulement.', "The two parties' declared values differ — the calculation below uses their average for illustration only.", lang)}
          </p>
        )}
        <SummaryRow label={tr(`Valeur partageable — ${demandeurName}`, `Shareable value — ${demandeurName}`, lang)} value={currency(valeurPartageableDem, lang)} />
        <SummaryRow label={tr(`Valeur partageable — ${defendeurName}`, `Shareable value — ${defendeurName}`, lang)} value={currency(valeurPartageableDef, lang)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }} className="pt-3 mt-1">
          <SummaryRow label={tr('Valeur partageable (moyenne retenue)', 'Shareable value (average used)', lang)} value={currency(valeurPartageableAvg, lang)} />
          <SummaryRow label={tr(`Part de ${demandeurName} (${demSharePct}%)`, `${demandeurName}'s share (${demSharePct}%)`, lang)} value={currency(demShare, lang)} />
          <SummaryRow label={tr(`Part de ${defendeurName} (${defSharePct}%)`, `${defendeurName}'s share (${defSharePct}%)`, lang)} value={currency(defShare, lang)} />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }} className="pt-4 mt-3">
          {balance < 1 ? (
            <p className="text-sm">{tr('Aucun solde dû — le partage est déjà équilibré', 'No balance owed — the partition is already even', lang)}</p>
          ) : (
            <>
              <p style={{ color: PALETTE.brass }} className="text-base font-semibold mb-3">
                {lang === 'fr' ? `${debtor} doit verser ${currency(balance, lang)} à ${creditor}` : `${debtor} owes ${currency(balance, lang)} to ${creditor}`}
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} className="pt-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span style={{ opacity: 0.8 }} className="text-xs">{tr('Étaler sur (années, max. 10)', 'Spread over (years, max. 10)', lang)}</span>
                  <input type="number" min="1" max="10" value={years} onChange={(e) => setYears(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: PALETTE.paper }}
                    className="w-16 px-2 py-1 rounded text-sm text-right tabnum" />
                </div>
                <SummaryRow label={tr('Versement annuel', 'Annual payment', lang)} value={currency(annualPayment, lang)} />
                <SummaryRow label={tr('Versement mensuel', 'Monthly payment', lang)} value={currency(monthlyPayment, lang)} />
              </div>
            </>
          )}
        </div>
      </SummaryPanel>
    </div>
  );
}

/* ---------- Domaine 2 : Logement / TAL ---------- */
function LogementTab({ lang }) {
  const [userType, setUserType] = useState('locataire');
  const [issueType, setIssueType] = useState('nonpaiement');
  const [address, setAddress] = useState('');
  const [otherParty, setOtherParty] = useState('');
  const [amount, setAmount] = useState(0);
  const [facts, setFacts] = useState('');

  const FORMS = {
    nonpaiement: { code: tr('Demande relative au non-paiement de loyer ou à une clause résolutoire', 'Application regarding non-payment of rent or a resolutory clause', lang), label: tr('Non-paiement de loyer', 'Non-payment of rent', lang) },
    resiliation: { code: tr('Demande (formulaire général)', 'Application (general form)', lang), label: tr('Résiliation de bail', 'Lease termination', lang) },
    reparations: { code: tr('Demande (formulaire général)', 'Application (general form)', lang), label: tr('Réparations, insalubrité ou harcèlement', 'Repairs, unsanitary conditions or harassment', lang) },
    reprise: { code: tr('Demande de reprise de logement', 'Application to repossess a dwelling', lang), label: tr('Reprise de logement', 'Repossession of a dwelling', lang) },
    eviction: { code: tr('Demande d’éviction pour subdivision, agrandissement ou changement d’affectation', 'Application for eviction for subdivision, enlargement or change of use', lang), label: tr('Éviction (subdivision / agrandissement)', 'Eviction (subdivision / enlargement)', lang) },
    expulsion: { code: tr('Demande d’expulsion du locataire après la fin du bail', 'Application to evict a tenant after the end of the lease', lang), label: tr('Expulsion après fin de bail', 'Eviction after end of lease', lang) },
    relocation: { code: tr('Demande en indemnité de relocation et de dommages', 'Application for relocation indemnity and damages', lang), label: tr('Indemnité de relocation et dommages', 'Relocation indemnity and damages', lang) },
    cession: { code: tr('Contrat de cession de bail et avis de sous-location', 'Lease assignment contract and sublease notice', lang), label: tr('Cession de bail ou sous-location', 'Lease assignment or sublease', lang) },
    autre: { code: tr('Demande (formulaire général)', 'Application (general form)', lang), label: tr('À préciser avec le TAL', 'To be specified with the TAL', lang) },
  };
  const rec = FORMS[issueType];

  return (
    <div>
      <SectionTitle>{tr('Logement — Tribunal administratif du logement', 'Housing — Administrative Housing Tribunal', lang)}</SectionTitle>
      <p style={{ color: PALETTE.muted }} className="text-sm mb-4">
        {tr('Répondez aux questions pour identifier le bon formulaire du TAL et préparer les faits essentiels.', 'Answer the questions to identify the right TAL form and prepare the key facts.', lang)}
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('Vous êtes', 'You are the', lang)}>
          <select value={userType} onChange={(e) => setUserType(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
            <option value="locataire">{tr('Locataire', 'Tenant', lang)}</option>
            <option value="locateur">{tr('Locateur', 'Landlord', lang)}</option>
          </select>
        </Field>
        <Field label={tr('Nature du problème', 'Nature of the issue', lang)}>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
            <option value="nonpaiement">{tr('Non-paiement de loyer', 'Non-payment of rent', lang)}</option>
            <option value="resiliation">{tr('Résiliation de bail', 'Lease termination', lang)}</option>
            <option value="reparations">{tr('Réparations / insalubrité / harcèlement', 'Repairs / unsanitary / harassment', lang)}</option>
            <option value="reprise">{tr('Reprise de logement', 'Repossession of dwelling', lang)}</option>
            <option value="eviction">{tr('Éviction (subdivision / agrandissement)', 'Eviction (subdivision / enlargement)', lang)}</option>
            <option value="expulsion">{tr('Expulsion après fin de bail', 'Eviction after end of lease', lang)}</option>
            <option value="relocation">{tr('Indemnité de relocation et dommages', 'Relocation indemnity and damages', lang)}</option>
            <option value="cession">{tr('Cession / sous-location', 'Assignment / sublease', lang)}</option>
            <option value="autre">{tr('Autre', 'Other', lang)}</option>
          </select>
        </Field>
      </div>
      <div className="mb-3"><Field label={tr('Adresse du logement', 'Rental address', lang)}><TextInput value={address} onChange={(e) => setAddress(e.target.value)} /></Field></div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('Nom de l\u2019autre partie', 'Other party\u2019s name', lang)}><TextInput value={otherParty} onChange={(e) => setOtherParty(e.target.value)} /></Field>
        <Field label={tr('Montant en jeu (si applicable)', 'Amount involved (if applicable)', lang)}><NumberInput value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} /></Field>
      </div>
      <div className="mb-4"><Field label={tr('Résumé des faits', 'Summary of facts', lang)}><TextArea rows={4} value={facts} onChange={(e) => setFacts(e.target.value)} /></Field></div>
      <SummaryPanel title={tr('Formulaire recommandé', 'Recommended form', lang)}>
        <p style={{ color: PALETTE.brass }} className="text-base font-semibold mb-1">{rec.code}</p>
        <p className="text-sm mb-4" style={{ opacity: 0.9 }}>{rec.label}</p>
        <SummaryRow label={tr('Partie', 'Party', lang)} value={userType === 'locataire' ? tr('Locataire', 'Tenant', lang) : tr('Locateur', 'Landlord', lang)} />
        {amount > 0 && <SummaryRow label={tr('Montant réclamé', 'Amount claimed', lang)} value={currency(amount, lang)} />}
      </SummaryPanel>
    </div>
  );
}

/* ---------- Domaine 3 : Successions ---------- */
function SuccessionTab({ lang }) {
  const [hasWill, setHasWill] = useState(true);
  const [heirs, setHeirs] = useState([{ id: nextId(), name: '', relation: '', share: 100, mineur: false }]);
  const [assets, setAssets] = useState([{ id: nextId(), description: '', value: 0 }]);
  const [debts, setDebts] = useState([{ id: nextId(), description: '', value: 0 }]);
  const [demarches, setDemarches] = useState({});

  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const netEstate = Math.max(0, totalAssets - totalDebts);
  const totalShares = heirs.reduce((sum, h) => sum + (Number(h.share) || 0), 0);

  const updateList = (setter, id, field, val) => setter((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const addToList = (setter, shape) => setter((prev) => [...prev, { id: nextId(), ...shape }]);
  const removeFromList = (setter, id) => setter((prev) => prev.filter((it) => it.id !== id));
  const toggleDemarche = (key) => setDemarches((prev) => ({ ...prev, [key]: !prev[key] }));

  const DEMARCHE_LABELS = {
    testament: tr('Rechercher un testament (registres de la Chambre des notaires et du Barreau du Québec)', 'Search for a will (registers of the Chambre des notaires and Barreau du Québec)', lang),
    deces: tr('Obtenir le certificat de décès', 'Obtain the death certificate', lang),
    heritiers: tr('Identifier et convoquer les héritiers', 'Identify and convene the heirs', lang),
    inventaire: tr('Dresser l’inventaire des biens et des dettes', 'Prepare the inventory of assets and debts', lang),
    compte: tr('Ouvrir un compte bancaire successoral', 'Open an estate bank account', lang),
    rdprm: tr('Publier un avis de clôture d’inventaire au RDPRM', 'Publish a notice of closure of inventory in the RDPRM', lang),
    dettes: tr('Payer les dettes et obtenir les quittances', 'Pay the debts and obtain releases', lang),
    revenus: tr('Produire les déclarations de revenus du défunt (fédérale et provinciale)', 'File the deceased’s income tax returns (federal and provincial)', lang),
    certificat: tr('Obtenir le certificat autorisant la distribution des biens (Revenu Québec)', 'Obtain the certificate authorizing distribution of property (Revenu Québec)', lang),
    partage: tr('Partager les biens entre les héritiers et clôturer la succession', 'Distribute the property among the heirs and close the estate', lang),
  };
  const minorHeirs = heirs.filter((h) => h.mineur);
  const minorShareValue = minorHeirs.reduce((sum, h) => sum + netEstate * ((Number(h.share) || 0) / 100), 0);

  return (
    <div>
      <SectionTitle>{tr('Successions — Inventaire et partage', 'Estates — Inventory and distribution', lang)}</SectionTitle>
      <div className="mb-4">
        <Field label={tr('Un testament existe-t-il ?', 'Is there a will?', lang)}>
          <select value={hasWill ? 'oui' : 'non'} onChange={(e) => setHasWill(e.target.value === 'oui')} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
            <option value="oui">{tr('Oui', 'Yes', lang)}</option>
            <option value="non">{tr('Non', 'No', lang)}</option>
          </select>
        </Field>
        {!hasWill && <Note>{tr('Sans testament, les parts sont fixées par la dévolution légale — les pourcentages ci-dessous sont indicatifs. Consultez un notaire.', 'Without a will, shares are set by intestate succession rules — the percentages below are indicative. Consult a notary.', lang)}</Note>}
      </div>
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2">{tr('Actifs de la succession', 'Estate assets', lang)}</h3>
      {assets.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Description', 'Description', lang)} value={a.description} onChange={(e) => updateList(setAssets, a.id, 'description', e.target.value)} />
            <RemoveButton onClick={() => removeFromList(setAssets, a.id)} />
          </div>
          <NumberInput value={a.value} onChange={(e) => updateList(setAssets, a.id, 'value', parseFloat(e.target.value) || 0)} />
        </Card>
      ))}
      <AddButton onClick={() => addToList(setAssets, { description: '', value: 0 })}>{tr('Ajouter un actif', 'Add an asset', lang)}</AddButton>
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-6">{tr('Dettes de la succession', 'Estate debts', lang)}</h3>
      {debts.map((d) => (
        <Card key={d.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Description', 'Description', lang)} value={d.description} onChange={(e) => updateList(setDebts, d.id, 'description', e.target.value)} />
            <RemoveButton onClick={() => removeFromList(setDebts, d.id)} />
          </div>
          <NumberInput value={d.value} onChange={(e) => updateList(setDebts, d.id, 'value', parseFloat(e.target.value) || 0)} />
        </Card>
      ))}
      <AddButton onClick={() => addToList(setDebts, { description: '', value: 0 })}>{tr('Ajouter une dette', 'Add a debt', lang)}</AddButton>
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-6">{tr('Héritiers', 'Heirs', lang)}</h3>
      {heirs.map((h) => (
        <Card key={h.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Nom', 'Name', lang)} value={h.name} onChange={(e) => updateList(setHeirs, h.id, 'name', e.target.value)} />
            <RemoveButton onClick={() => removeFromList(setHeirs, h.id)} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2">
            <TextInput placeholder={tr('Lien de parenté', 'Relationship', lang)} value={h.relation} onChange={(e) => updateList(setHeirs, h.id, 'relation', e.target.value)} />
            <NumberInput placeholder="%" value={h.share} onChange={(e) => updateList(setHeirs, h.id, 'share', parseFloat(e.target.value) || 0)} />
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}>
            <input type="checkbox" checked={!!h.mineur} onChange={(e) => updateList(setHeirs, h.id, 'mineur', e.target.checked)} />
            {tr('Héritier mineur', 'Minor heir', lang)}
          </label>
        </Card>
      ))}
      <AddButton onClick={() => addToList(setHeirs, { name: '', relation: '', share: 0, mineur: false })}>{tr('Ajouter un héritier', 'Add an heir', lang)}</AddButton>
      {totalShares !== 100 && <Note>{tr(`Le total des parts est de ${totalShares}% (devrait être 100%)`, `Shares total ${totalShares}% (should be 100%)`, lang)}</Note>}
      {minorHeirs.length > 0 && minorShareValue > 40000 && (
        <Note>
          {tr(
            `La part revenant à un héritier mineur est estimée à ${currency(minorShareValue, lang)}, au-delà du seuil de 40 000 $ : un conseil de tutelle et l'intervention du curateur public (ou du tuteur légal, selon le cas) seront requis avant le partage.`,
            `A minor heir's share is estimated at ${currency(minorShareValue, lang)}, above the $40,000 threshold: a tutorship council and the involvement of the Public Curator (or the legal tutor, as applicable) will be required before distribution.`,
            lang
          )}
        </Note>
      )}
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-6">{tr('Démarches de liquidation', 'Estate settlement steps', lang)}</h3>
      <Card>
        {Object.entries(DEMARCHE_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-start gap-2 text-sm mb-2 last:mb-0" style={{ color: PALETTE.ink }}>
            <input type="checkbox" checked={!!demarches[key]} onChange={() => toggleDemarche(key)} className="mt-0.5" />
            <span>{label}</span>
          </label>
        ))}
      </Card>
      <SummaryPanel title={tr('Sommaire de la succession', 'Estate summary', lang)}>
        <SummaryRow label={tr('Total des actifs', 'Total assets', lang)} value={currency(totalAssets, lang)} />
        <SummaryRow label={tr('Total des dettes', 'Total debts', lang)} value={currency(totalDebts, lang)} />
        <SummaryRow label={tr('Valeur nette successorale', 'Net estate value', lang)} value={currency(netEstate, lang)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }} className="pt-3 mt-2">
          {heirs.filter((h) => h.name).map((h) => (<SummaryRow key={h.id} label={h.name} value={currency(netEstate * ((Number(h.share) || 0) / 100), lang)} />))}
        </div>
      </SummaryPanel>
    </div>
  );
}

/* ---------- Domaine 4 : Petites créances ---------- */
function PetitesCreancesTab({ lang }) {
  const CAP = 15000;
  const [claimant, setClaimant] = useState('');
  const [defendant, setDefendant] = useState('');
  const [items, setItems] = useState([{ id: nextId(), description: '', amount: 0 }]);
  const [demandSent, setDemandSent] = useState(false);
  const [demandDate, setDemandDate] = useState('');
  const [checklist, setChecklist] = useState({ contrat: false, factures: false, photos: false, correspondance: false, temoins: false });
  const [claimNature, setClaimNature] = useState('contrat');

  const total = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const overCap = total > CAP;
  const inadmissible = claimNature === 'bail' || claimNature === 'alimentaire';

  const updateItem = (id, field, val) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const addItem = () => setItems((prev) => [...prev, { id: nextId(), description: '', amount: 0 }]);
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const CHECK_LABELS = {
    contrat: tr('Contrat ou entente', 'Contract or agreement', lang),
    factures: tr('Factures ou reçus', 'Invoices or receipts', lang),
    photos: tr('Photos', 'Photos', lang),
    correspondance: tr('Correspondance (courriels, textos)', 'Correspondence (emails, texts)', lang),
    temoins: tr('Liste de témoins', 'List of witnesses', lang),
  };

  return (
    <div>
      <SectionTitle>{tr('Petites créances — Fiche de préparation', 'Small Claims — Preparation sheet', lang)}</SectionTitle>
      <p style={{ color: PALETTE.muted }} className="text-sm mb-4">{tr('Rassemblez l\u2019essentiel ici, puis transcrivez-le dans le formulaire officiel en ligne SJ-870E.', 'Gather the essentials here, then transcribe them into the official online form SJ-870E.', lang)}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Field label={tr('Demandeur', 'Claimant', lang)}><TextInput value={claimant} onChange={(e) => setClaimant(e.target.value)} /></Field>
        <Field label={tr('Défendeur', 'Defendant', lang)}><TextInput value={defendant} onChange={(e) => setDefendant(e.target.value)} /></Field>
      </div>
      <div className="mb-4">
        <Field label={tr('Nature de la réclamation', 'Nature of the claim', lang)}>
          <select value={claimNature} onChange={(e) => setClaimNature(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm bg-white">
            <option value="contrat">{tr('Contrat / vente / service', 'Contract / sale / service', lang)}</option>
            <option value="dommages">{tr('Dommages matériels', 'Property damage', lang)}</option>
            <option value="bail">{tr('Litige de bail (logement)', 'Lease dispute (housing)', lang)}</option>
            <option value="alimentaire">{tr('Pension alimentaire', 'Alimony / support', lang)}</option>
            <option value="autre">{tr('Autre', 'Other', lang)}</option>
          </select>
        </Field>
        {inadmissible && (
          <Note>
            {tr(
              'Les litiges de bail (compétence exclusive du Tribunal administratif du logement) et les pensions alimentaires (compétence de la Cour supérieure / Cour du Québec, chambre de la famille) ne sont pas admissibles à la Division des petites créances.',
              'Lease disputes (exclusive jurisdiction of the Administrative Housing Tribunal) and alimony/support claims (jurisdiction of the Superior Court / Court of Québec, family division) are not eligible for the Small Claims Division.',
              lang
            )}
          </Note>
        )}
      </div>
      <Note>
        {tr(
          'Aux petites créances, les parties doivent se représenter elles-mêmes : un avocat ne peut pas représenter une partie à l’audience (art. 543 C.p.c.), sauf exceptions limitées (ex. personne morale dans certains cas). Un avocat peut toutefois conseiller et préparer le dossier en amont.',
          'In Small Claims, parties must represent themselves: a lawyer cannot represent a party at the hearing (art. 543 C.C.P.), subject to limited exceptions (e.g. a legal person in certain cases). A lawyer may, however, advise and prepare the file beforehand.',
          lang
        )}
      </Note>
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-4">{tr('Éléments de la réclamation', 'Claim items', lang)}</h3>
      {items.map((it) => (
        <Card key={it.id}>
          <div className="flex items-start gap-2 mb-2">
            <TextInput placeholder={tr('Description', 'Description', lang)} value={it.description} onChange={(e) => updateItem(it.id, 'description', e.target.value)} />
            <RemoveButton onClick={() => removeItem(it.id)} />
          </div>
          <NumberInput value={it.amount} onChange={(e) => updateItem(it.id, 'amount', parseFloat(e.target.value) || 0)} />
        </Card>
      ))}
      <AddButton onClick={addItem}>{tr('Ajouter un élément', 'Add an item', lang)}</AddButton>
      <div className="mt-6 mb-2">
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={demandSent} onChange={(e) => setDemandSent(e.target.checked)} />
          {tr('Une mise en demeure a été envoyée', 'A demand letter was sent', lang)}
        </label>
        {demandSent && <Field label={tr('Date d\u2019envoi', 'Date sent', lang)}><input type="date" value={demandDate} onChange={(e) => setDemandDate(e.target.value)} style={{ border: `1px solid ${PALETTE.rule}` }} className="w-full px-2 py-1.5 rounded text-sm" /></Field>}
      </div>
      <h3 style={{ color: PALETTE.ink }} className="text-sm font-semibold mb-2 mt-5">{tr('Preuves à rassembler', 'Evidence to gather', lang)}</h3>
      <div className="space-y-1.5 mb-4">
        {Object.keys(checklist).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={checklist[k]} onChange={(e) => setChecklist((prev) => ({ ...prev, [k]: e.target.checked }))} />
            {CHECK_LABELS[k]}
          </label>
        ))}
      </div>
      <SummaryPanel title={tr('Sommaire de la réclamation', 'Claim summary', lang)}>
        <SummaryRow label={tr('Montant total réclamé', 'Total amount claimed', lang)} value={currency(total, lang)} />
        <SummaryRow label={tr('Plafond aux petites créances', 'Small claims cap', lang)} value={currency(CAP, lang)} />
        {overCap && <Note>{tr('Ce montant dépasse le plafond de 15 000 $ — cette réclamation n\u2019est pas admissible aux petites créances.', 'This amount exceeds the $15,000 cap — this claim is not eligible for small claims.', lang)}</Note>}
      </SummaryPanel>
    </div>
  );
}

/* ---------- Domaine 5 : Mise en demeure ---------- */
function MiseEnDemeureTab({ lang }) {
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [facts, setFacts] = useState('');
  const [amountOrAction, setAmountOrAction] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(10);
  const [city, setCity] = useState('');

  const today = new Date();
  const deadlineDate = new Date(today.getTime() + deadlineDays * 86400000);
  const fmtDate = (d) => d.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  const letter = lang === 'fr'
    ? `${city || '[Ville]'}, le ${fmtDate(today)}\n\n${recipientName || '[Nom du destinataire]'}\n${recipientAddress || '[Adresse du destinataire]'}\n\nOBJET : Mise en demeure — ${subject || '[objet]'}\n\nMadame, Monsieur,\n\n${facts || '[Exposé des faits]'}\n\nPar la présente, je vous mets en demeure de ${amountOrAction || '[action demandée ou montant réclamé]'} dans un délai de ${deadlineDays} jours de la présente, soit au plus tard le ${fmtDate(deadlineDate)}.\n\nÀ défaut de vous conformer dans ce délai, je me verrai dans l\u2019obligation d\u2019entreprendre les recours appropriés, sans autre avis ni délai, avec tous les frais à votre charge.\n\nVeuillez agir en conséquence.\n\n${senderName || '[Votre nom]'}\n${senderAddress || '[Votre adresse]'}`
    : `${city || '[City]'}, ${fmtDate(today)}\n\n${recipientName || '[Recipient name]'}\n${recipientAddress || '[Recipient address]'}\n\nRE: Formal Notice — ${subject || '[subject]'}\n\nDear Sir or Madam,\n\n${facts || '[Statement of facts]'}\n\nYou are hereby formally notified to ${amountOrAction || '[requested action or amount claimed]'} within ${deadlineDays} days of this notice, no later than ${fmtDate(deadlineDate)}.\n\nShould you fail to comply within this time, I will have no choice but to pursue appropriate remedies, without further notice, at your expense.\n\nPlease act accordingly.\n\n${senderName || '[Your name]'}\n${senderAddress || '[Your address]'}`;

  return (
    <div>
      <SectionTitle>{tr('Mise en demeure', 'Formal Notice (Mise en demeure)', lang)}</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('Votre nom', 'Your name', lang)}><TextInput value={senderName} onChange={(e) => setSenderName(e.target.value)} /></Field>
        <Field label={tr('Votre adresse', 'Your address', lang)}><TextInput value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('Nom du destinataire', 'Recipient name', lang)}><TextInput value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></Field>
        <Field label={tr('Adresse du destinataire', 'Recipient address', lang)}><TextInput value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Field label={tr('Ville (pour la date)', 'City (for the date)', lang)}><TextInput value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label={tr('Délai (jours)', 'Deadline (days)', lang)}><NumberInput min="1" value={deadlineDays} onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 1)} /></Field>
      </div>
      <div className="mb-3"><Field label={tr('Objet', 'Subject', lang)}><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} /></Field></div>
      <div className="mb-3"><Field label={tr('Exposé des faits', 'Statement of facts', lang)}><TextArea rows={3} value={facts} onChange={(e) => setFacts(e.target.value)} /></Field></div>
      <div className="mb-5"><Field label={tr('Action demandée ou montant réclamé', 'Requested action or amount claimed', lang)}><TextInput value={amountOrAction} onChange={(e) => setAmountOrAction(e.target.value)} /></Field></div>
      <div style={{ border: `1px solid ${PALETTE.rule}`, background: PALETTE.paperCard }} className="rounded p-4">
        <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: PALETTE.muted }} className="text-xs uppercase tracking-wide mb-3">{tr('Aperçu de la lettre', 'Letter preview', lang)}</h3>
        <pre style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: PALETTE.ink, whiteSpace: 'pre-wrap' }} className="text-sm leading-relaxed">{letter}</pre>
      </div>
    </div>
  );
}

/* ---------- App shell ---------- */
function PrototypeApp() {
  const [lang, setLang] = useState('fr');
  const [tab, setTab] = useState('union');

  const TABS = [
    { key: 'union', icon: Users, label: tr('Union parentale', 'Parental union', lang) },
    { key: 'logement', icon: Home, label: tr('Logement', 'Housing', lang) },
    { key: 'succession', icon: FileText, label: tr('Successions', 'Estates', lang) },
    { key: 'petites', icon: Coins, label: tr('Petites créances', 'Small claims', lang) },
    { key: 'demeure', icon: Mail, label: tr('Mise en demeure', 'Formal notice', lang) },
  ];

  return (
    <div style={{ background: PALETTE.paper, minHeight: '100vh', fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif", color: PALETTE.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .tabnum { font-variant-numeric: tabular-nums; }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <Scale size={22} color={PALETTE.brass} strokeWidth={1.75} />
            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.15 }}>
              {tr('JuriFormulaires', 'JuriForms', lang)}
            </span>
          </div>
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} style={{ border: `1px solid ${PALETTE.rule}`, color: PALETTE.muted, background: PALETTE.paperCard }} className="text-xs px-2 py-1 rounded shrink-0 ml-2">
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
        <p style={{ color: PALETTE.muted }} className="text-sm mb-4">
          {tr('juriformulaires.com  ·  L\u2019onglet union parentale est aligné sur la structure du vrai formulaire SJ-1337.', 'easylegalforms.ai  ·  The parental union tab now mirrors the structure of the real SJ-1337 form.', lang)}
        </p>
        <div style={{ borderBottom: `1px solid ${PALETTE.rule}` }} className="flex gap-1 mb-6 overflow-x-auto pb-px">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ color: tab === key ? PALETTE.ink : PALETTE.muted, borderBottom: tab === key ? `2px solid ${PALETTE.brass}` : '2px solid transparent' }} className="flex items-center gap-1.5 text-sm px-3 py-2 shrink-0">
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        {tab === 'union' && <UnionParentaleTab lang={lang} />}
        {tab === 'logement' && <LogementTab lang={lang} />}
        {tab === 'succession' && <SuccessionTab lang={lang} />}
        {tab === 'petites' && <PetitesCreancesTab lang={lang} />}
        {tab === 'demeure' && <MiseEnDemeureTab lang={lang} />}
        <p style={{ color: PALETTE.muted, borderTop: `1px solid ${PALETTE.rule}` }} className="text-xs leading-relaxed mt-8 pt-4">
          {tr('Ces cinq modules sont des échantillons préparatoires — information générale, pas un avis juridique. À faire valider par un avocat ou notaire avant tout dépôt officiel.', 'These five modules are preparatory samples — general information, not legal advice. Have them validated by a lawyer or notary before any official filing.', lang)}
        </p>
      </div>
    </div>
  );
}

export default PrototypeApp;
