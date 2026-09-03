let currentMode = 'diretto';

function euro(n){
  return n.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0});
}

function pct(n){
  return n.toLocaleString('it-IT', {maximumFractionDigits:1, minimumFractionDigits:1}) + '%';
}

function progressivo(base, scaglioni){
  // scaglioni: array di [soglia_inferiore, soglia_superiore, aliquota]
  let imposta = 0;
  for(const [da, a, aliquota] of scaglioni){
    if(base > da){
      const quota = Math.min(base, a) - da;
      imposta += quota * aliquota;
    }
  }
  return imposta;
}

const SCAGLIONI_IRPEF = [
  [0, 28000, 0.23],
  [28000, 50000, 0.33],
  [50000, Infinity, 0.43]
];

const SCAGLIONI_REGIONALE_LOMBARDIA = [
  [0, 15000, 0.0123],
  [15000, 28000, 0.0158],
  [28000, 50000, 0.0172],
  [50000, Infinity, 0.0173]
];

function detrazioneLavoroDipendente(rc){
  if(rc <= 15000) return 1955;
  if(rc <= 28000) return 1910 + 1190 * (28000 - rc) / 13000;
  if(rc <= 50000) return 1910 * (50000 - rc) / 22000;
  return 0;
}

function trattamentoIntegrativo(rc){
  // Bonus esentasse su redditi fino a 20.000 (non riduce l'IRPEF, si somma al netto)
  if(rc <= 8500) return rc * 0.071;
  if(rc <= 15000) return rc * 0.053;
  if(rc <= 20000) return rc * 0.048;
  return 0;
}

function ulterioreDetrazione(rc){
  // Detrazione aggiuntiva cuneo fiscale tra 20.000 e 40.000 (riduce l'IRPEF, non genera credito)
  if(rc > 20000 && rc <= 32000) return 1000;
  if(rc > 32000 && rc <= 40000) return 1000 * (40000 - rc) / 8000;
  return 0;
}

// Funzione pura: dato un RAL, restituisce l'intero dettaglio del calcolo.
// Usata sia dal calcolo diretto sia, tramite ricerca numerica, dal calcolo inverso.
function calcolaDaRAL(ral){
  const inps = ral * 0.0919;
  const rc = ral - inps;

  let irpefLorda = 0, detrLavoro = 0, ulterioreDetr = 0, irpefNetta = 0;
  let addRegionale = 0, addComunale = 0, bonusIntegrativo = 0;
  let noTaxArea = false;

  if(rc <= 8500){
    noTaxArea = true;
    bonusIntegrativo = trattamentoIntegrativo(rc);
  } else {
    irpefLorda = progressivo(rc, SCAGLIONI_IRPEF);
    detrLavoro = detrazioneLavoroDipendente(rc);
    ulterioreDetr = ulterioreDetrazione(rc);
    irpefNetta = Math.max(0, irpefLorda - detrLavoro - ulterioreDetr);

    addRegionale = progressivo(rc, SCAGLIONI_REGIONALE_LOMBARDIA);
    addComunale = rc > 23000 ? rc * 0.008 : 0;

    bonusIntegrativo = trattamentoIntegrativo(rc);
  }

  const totaleImposte = irpefNetta + addRegionale + addComunale;
  const nettoAnnuo = ral - inps - totaleImposte + bonusIntegrativo;
  const totaleTrattenute = ral - nettoAnnuo;

  return {
    ral, inps, rc, noTaxArea,
    irpefLorda, detrLavoro, ulterioreDetr, irpefNetta,
    addRegionale, addComunale, bonusIntegrativo,
    totaleImposte, nettoAnnuo, totaleTrattenute
  };
}

// Ricerca numerica (bisezione): trova la RAL che produce il netto annuo target.
// Necessaria perché il sistema a scaglioni/soglie non è invertibile con una formula chiusa.
function trovaRALDaNettoAnnuo(nettoAnnuoTarget){
  let lo = 0, hi = 1000000;
  for(let i = 0; i < 60; i++){
    const mid = (lo + hi) / 2;
    const res = calcolaDaRAL(mid);
    if(res.nettoAnnuo < nettoAnnuoTarget){
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function setMode(mode){
  currentMode = mode;
  document.getElementById('mode-diretto').classList.toggle('active', mode === 'diretto');
  document.getElementById('mode-inverso').classList.toggle('active', mode === 'inverso');
  document.getElementById('field-ral').style.display = mode === 'diretto' ? 'flex' : 'none';
  document.getElementById('field-netto-target').style.display = mode === 'inverso' ? 'flex' : 'none';
  document.getElementById('inverse-callout').style.display = 'none';
  calcola();
}

function renderRisultato(dati, mensilita){
  const { ral, inps, rc, noTaxArea, irpefLorda, detrLavoro, ulterioreDetr, irpefNetta,
          addRegionale, addComunale, bonusIntegrativo, totaleImposte, nettoAnnuo, totaleTrattenute } = dati;

  const nettoMensile = nettoAnnuo / mensilita;
  const aliquotaEffettiva = (totaleTrattenute / ral) * 100;

  document.getElementById('out-netto-annuo').textContent = euro(nettoAnnuo);
  document.getElementById('out-netto-mensile').textContent = euro(nettoMensile);
  document.getElementById('out-trattenute').textContent = euro(totaleTrattenute);
  document.getElementById('out-aliquota').textContent = pct(aliquotaEffettiva);

  const inverseCallout = document.getElementById('inverse-callout');
  if(currentMode === 'inverso'){
    document.getElementById('out-ral-trovata').textContent = euro(ral);
    inverseCallout.style.display = 'flex';
  } else {
    inverseCallout.style.display = 'none';
  }

  // Bar chart
  const bar = document.getElementById('bar');
  const pNetto = (nettoAnnuo / ral) * 100;
  const pInps = (inps / ral) * 100;
  const pTax = (totaleImposte / ral) * 100;
  bar.innerHTML =
    '<div class="bar-net" style="width:' + pNetto + '%"></div>' +
    '<div class="bar-inps" style="width:' + pInps + '%"></div>' +
    '<div class="bar-tax" style="width:' + pTax + '%"></div>';

  // Tabella con valori assoluti + percentuale sulla RAL
  const rows = [];
  rows.push(['Retribuzione Annua Lorda (RAL)', ral, '']);
  rows.push(['− Contributi INPS a carico lavoratore (9,19%)', -inps, 'deduction']);
  rows.push(['= Reddito imponibile fiscale', rc, 'subtotal']);

  if(noTaxArea){
    rows.push(['IRPEF lorda', 0, '']);
    rows.push(['IRPEF netta (no tax area, reddito ≤ 8.500 €)', 0, '']);
    rows.push(['Addizionale regionale Lombardia', 0, '']);
    rows.push(['Addizionale comunale Milano', 0, '']);
  } else {
    rows.push(['IRPEF lorda (scaglioni 23% / 33% / 43%)', irpefLorda, '']);
    rows.push(['− Detrazione lavoro dipendente (art. 13 TUIR)', -detrLavoro, 'deduction']);
    if(ulterioreDetr > 0){
      rows.push(['− Ulteriore detrazione cuneo fiscale (20.000–40.000 €)', -ulterioreDetr, 'deduction']);
    }
    rows.push(['= IRPEF netta', irpefNetta, 'subtotal']);
    rows.push(['+ Addizionale regionale Lombardia', addRegionale, 'deduction']);
    rows.push(['+ Addizionale comunale Milano (0,8%, esente sotto 23.000 €)', addComunale, 'deduction']);
  }

  if(bonusIntegrativo > 0){
    rows.push(['+ Trattamento integrativo / bonus busta paga (esentasse)', bonusIntegrativo, 'credit']);
  }

  rows.push(['= Totale contributi e imposte trattenute', totaleTrattenute, 'subtotal']);
  rows.push(['= Netto annuale', nettoAnnuo, 'subtotal']);
  rows.push(['≈ Netto mensile (su ' + mensilita + ' mensilità)', nettoMensile, '']);

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  for(const [label, value, cls] of rows){
    const tr = document.createElement('tr');
    if(cls) tr.className = cls;
    const tdLabel = document.createElement('td');
    tdLabel.textContent = label;
    const tdValue = document.createElement('td');
    tdValue.className = 'num';
    tdValue.textContent = euro(value);
    const tdPct = document.createElement('td');
    tdPct.className = 'num pct';
    tdPct.textContent = pct((value / ral) * 100);
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    tr.appendChild(tdPct);
    tbody.appendChild(tr);
  }

  document.getElementById('results').classList.add('visible');
}

function calcola(){
  const errorEl = document.getElementById('error');
  const resultsEl = document.getElementById('results');
  const mensilita = parseInt(document.getElementById('mensilita').value, 10);

  if(currentMode === 'diretto'){
    const ral = parseFloat(document.getElementById('ral').value);
    if(isNaN(ral) || ral <= 0){
      errorEl.style.display = 'block';
      resultsEl.classList.remove('visible');
      return;
    }
    errorEl.style.display = 'none';
    const dati = calcolaDaRAL(ral);
    renderRisultato(dati, mensilita);
  } else {
    const nettoMensileTarget = parseFloat(document.getElementById('netto-target').value);
    if(isNaN(nettoMensileTarget) || nettoMensileTarget <= 0){
      errorEl.style.display = 'block';
      resultsEl.classList.remove('visible');
      return;
    }
    errorEl.style.display = 'none';
    const nettoAnnuoTarget = nettoMensileTarget * mensilita;
    const ralTrovata = trovaRALDaNettoAnnuo(nettoAnnuoTarget);
    const dati = calcolaDaRAL(ralTrovata);
    renderRisultato(dati, mensilita);
  }
}

// Calcolo automatico al primo caricamento con i valori di default
window.addEventListener('DOMContentLoaded', calcola);
