# Calcolatore RAL → Netto

Calcolatore che simula la proiezione di retribuzione netta annuale a partire da una Retribuzione Annua Lorda (RAL) — e viceversa — mostrando in dettaglio tutte le voci trattenute al lordo (contributi INPS, IRPEF, addizionali regionale e comunale).

**[👉 Prova il calcolatore](https://marci6.github.io/calcola-ral-netta/)** *https://marci6.github.io/calcola-ral-netta/*

# RAL ↔ Netto

## Cosa fa

L'utente sceglie una modalità e il numero di mensilità (12, 13 o 14), preme "Calcola" e ottiene:

- **Modalità RAL → Netto**: inserisce una RAL e ottiene netto annuale e mensile stimati.
- **Modalità Netto → RAL**: inserisce il netto mensile che vorrebbe percepire e il prototipo trova, tramite ricerca numerica, la RAL necessaria a produrlo.

In entrambi i casi il risultato include:

- netto annuale e netto mensile stimati
- totale delle trattenute (contributi + imposte) e aliquota effettiva sul lordo
- una barra visiva che mostra la ripartizione tra netto, contributi INPS e imposte
- una tabella riga per riga che ricostruisce il percorso completo dalla RAL al netto — ogni voce con **importo assoluto e relativa percentuale sulla RAL**, per capire subito il peso di ogni trattenuta: contributi INPS → reddito imponibile → IRPEF lorda → detrazioni → IRPEF netta → addizionali locali → bonus in busta paga → netto finale

## Caso coperto

Il prototipo copre un caso standard e semplice, esplicitamente definito in fase di scoping:

- dipendente privato con contratto **a tempo indeterminato**
- residente a **Milano** (Lombardia)
- **nessuna agevolazione particolare** (no carichi di famiglia, no welfare, no detrazioni per spese, nessun altro reddito)

Il dominio della busta paga italiana è molto più ampio di questo: il prototipo non intende coprire tutti i casi, ma dimostrare la logica di calcolo su uno scenario realistico e verificabile.

## Logica di calcolo

1. **Contributi INPS a carico del lavoratore**: aliquota unica 9,19% sull'intera RAL.
2. **Reddito imponibile fiscale**: RAL − contributi INPS.
3. **IRPEF lorda**: applicazione progressiva degli scaglioni 2026 (23% fino a 28.000 €, 33% da 28.001 a 50.000 €, 43% oltre 50.000 €).
4. **Detrazioni da lavoro dipendente** (art. 13 TUIR): formula a scaglioni su reddito imponibile ≤15.000 € / 15.000–28.000 € / 28.000–50.000 € / oltre 50.000 €.
5. **Riduzione del cuneo fiscale 2025–2026**:
   - **trattamento integrativo** (bonus esentasse) per redditi imponibili fino a 20.000 €, con percentuali decrescenti (7,1% / 5,3% / 4,8%) al crescere del reddito;
   - **ulteriore detrazione** per redditi imponibili tra 20.000 € e 40.000 € (1.000 € fissi fino a 32.000 €, poi decrescente fino ad azzerarsi a 40.000 €).
6. **No tax area**: reddito imponibile ≤ 8.500 € → nessuna IRPEF, nessuna addizionale, solo il bonus esentasse.
7. **Addizionale regionale Lombardia**: aliquota progressiva 1,23% / 1,58% / 1,72% / 1,73% sugli stessi scaglioni IRPEF.
8. **Addizionale comunale Milano**: aliquota unica 0,8%, con soglia di esenzione totale a 23.000 € di reddito imponibile.
9. **Netto annuale** = RAL − contributi INPS − IRPEF netta − addizionali + bonus esentasse.
10. **Netto mensile** = netto annuale / numero di mensilità scelto (la scelta non modifica il netto annuo, solo la sua ripartizione).

### Calcolo inverso: Netto → RAL

Il sistema fiscale italiano è a scaglioni e soglie discontinue (IRPEF, detrazioni, addizionali, cuneo fiscale cambiano formula a ogni soglia di reddito): non esiste quindi una formula chiusa per invertire "da netto a RAL". Il prototipo risolve il problema con una **ricerca numerica per bisezione**:

1. il netto mensile desiderato viene moltiplicato per il numero di mensilità, ottenendo un netto annuo target;
2. la funzione di calcolo diretto (`calcolaDaRAL`) viene eseguita ripetutamente su un intervallo di RAL candidate, dimezzando l'intervallo a ogni iterazione (60 iterazioni, sufficienti per una precisione ben sotto il centesimo di euro);
3. la funzione netto(RAL) è monotona crescente — a parità di condizioni, più RAL implica sempre più netto, perché nessuna aliquota marginale nel sistema può superare il 100% — quindi la bisezione converge in modo affidabile.

## Percentuali

Ogni riga della tabella di dettaglio mostra, oltre all'importo assoluto, la sua incidenza percentuale sulla RAL di partenza. Questo rende immediato capire, ad esempio, quanto pesano da soli i contributi INPS rispetto all'IRPEF, o quanto valgono le addizionali locali in proporzione al lordo — un dato che il solo importo in euro non comunica altrettanto bene, specialmente confrontando RAL diverse.

## Semplificazioni assunte

Elencate anche direttamente in pagina, nel pannello "Ipotesi e semplificazioni":

- l'aliquota INPS è trattata come flat 9,19% su tutta la RAL: non si applica il contributo aggiuntivo dell'1% oltre 52.190 €, né il massimale contributivo (~120.000 €); sopra queste soglie il netto reale sarebbe leggermente più alto di quello stimato
- nessun carico di famiglia, nessuna detrazione per spese, nessun altro reddito: la RAL coincide con il reddito complessivo ai fini delle soglie IRPEF
- non sono simulati: TFR, welfare aziendale, fringe benefit, straordinari, premi di produttività, part-time, giorni di assenza o rapporti di lavoro non annuali
- il numero di mensilità è una scelta dell'utente e serve solo a ripartire il netto annuo, senza modellare eventuali differenze di trattamento fiscale della quattordicesima

Ogni ulteriore semplificazione è discutibile in sede di colloquio.

## Approccio al prodotto

Basandosi sui dati aggregati delle ricerche relative alle keyword "Ral", "Ral netta", "calcolo ral", è chiaro che il problema piu commune per gli utenti è calcolare la propria RAL netta.

Quali sono le soluzioni giá sul mercato? Vari sito offrono calcolatore pi`u o meno complessi che tengono in considerazioni i vari fattori di tassazione.

Cosa serve realmente all' utente e cosa si chiederà dopo aver usato il calcolatore?

Se il calcolatore fa bene il suo lavoro, l'utente non si ferma al primo numero. Le domande naturali che seguono possono essere:

- "Perché questo numero è diverso da quello che mi ha detto un altro sito/il mio consulente?" → da qui l'importanza di esporre il dettaglio riga per riga, non solo il totale. 
- "E se guadagnassi X in più, quanto mi resta davvero in tasca?" → interesse a confrontare scenari (aumento, cambio offerta), non solo un valore statico.
- "Quanto costo io all'azienda, non solo quanto ricevo io?" → collegamento naturale al costo-azienda (esattamente il secondo tool che Jet HR offre in coppia con questo).
- "Cosa cambia se vivo in un altro comune / ho un contratto diverso / ho figli a carico?" → il limite più immediato di un prototipo semplificato, ed è la ragione per cui è importante dichiarare esplicitamente cosa non è coperto, invece di dare un falso senso di precisione.
- "Posso fidarmi di questo per negoziare?" → torna il tema della fiducia: la fonte normativa citata (Legge di Bilancio, INPS, TUIR) conta quanto il numero stesso.

## Fonti

- Legge di Bilancio 2026 (L. 199/2025) — scaglioni IRPEF, no tax area, detrazioni da lavoro dipendente, cuneo fiscale
- Art. 13 TUIR (DPR 917/1986) — detrazioni da lavoro dipendente
- Regione Lombardia, art. 72 L.R. 10/2003 — addizionale regionale IRPEF
- Delibera del Comune di Milano — addizionale comunale IRPEF e soglia di esenzione
- INPS — aliquota contributiva IVS a carico del lavoratore dipendente (9,19%)

## Disclaimer

Questo è un prototipo a scopo dimostrativo. I valori calcolati sono stime basate su regole generali e semplificate: non sostituiscono un cedolino ufficiale né una consulenza del lavoro o fiscale.
