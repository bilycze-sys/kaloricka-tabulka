document.addEventListener('DOMContentLoaded', () => {
    const chartInstances = {};
    let vsechnaData = [];
    const vyberMesiceEl = document.getElementById('vyber-mesice');
    const vyberDatumEl = document.getElementById('vyber-datum');

    const definiceGrafu = {
        telo: { id: 'graf-telo', ovladaceId: 'ovladace-telo', labels: ['Váha', 'Míry', 'Body Fat %', 'Síla'] },
        prace: { id: 'graf-prace', ovladaceId: 'ovladace-prace', labels: ['Příjem', 'Čas. náročnost', 'Remote', 'Zábavnost'] },
        jazyk: { id: 'graf-jazyk', ovladaceId: 'ovladace-jazyk', labels: ['Slovní zásoba', 'Komunikace', 'Časování', 'Předložky'] }
    };

    // === NOVÁ FUNKCE PRO GENERÁTOR BAREV ===
    const generujBarvu = (index, total) => {
        const progress = total > 1 ? index / (total - 1) : 1;
        
        const startHue = 210; // Modrá
        const saturation = 30 + (60 * progress); // Od méně syté k plně syté
        const lightness = 85 - (35 * progress); // Od světlé k tmavší
        const alphaFill = 0.1 + (0.2 * progress); // Od téměř průhledné k viditelnější výplni
        const alphaBorder = 0.3 + (0.7 * progress); // Od slabého k plnému okraji

        return {
            vypln: `hsla(${startHue}, ${saturation}%, ${lightness}%, ${alphaFill})`,
            okraj: `hsla(${startHue}, ${saturation}%, ${lightness}%, ${alphaBorder})`
        };
    };

    // === PŘEPRACOVANÁ FUNKCE PRO VYKRESLENÍ VŠECH ZÁZNAMŮ ===
    const vykresliVse = () => {
        if (vsechnaData.length === 0) return;

        // Vždy pracujeme s daty seřazenými od nejstaršího
        vsechnaData.sort((a, b) => new Date(a.datum) - new Date(b.datum));
        
        // Zobrazíme maximálně posledních 12 záznamů
        const dataKVykresleni = vsechnaData.slice(-12);

        for (const [nazev, definice] of Object.entries(definiceGrafu)) {
            const datasets = dataKVykresleni.map((zaznam, index) => {
                const { vypln, okraj } = generujBarvu(index, dataKVykresleni.length);
                return {
                    label: zaznam.datum,
                    data: Object.values(zaznam[nazev]),
                    fill: true,
                    backgroundColor: vypln,
                    borderColor: okraj,
                    pointRadius: 2 // Menší body pro přehlednost
                };
            });

            if (chartInstances[nazev]) chartInstances[nazev].destroy();
            const ctx = document.getElementById(definice.id).getContext('2d');
            chartInstances[nazev] = new Chart(ctx, {
                type: 'radar', 
                data: { labels: definice.labels, datasets },
                options: { 
                    scales: { r: { min: 0, max: 10, ticks: { stepSize: 1 } } },
                    plugins: { legend: { display: false } } // Skryjeme nepřehlednou legendu
                }
            });
        }
        // Ovládací prvky vždy ukazují hodnoty nejnovějšího záznamu
        const nejnovejsiZaznam = vsechnaData[vsechnaData.length - 1];
        for (const nazev in definiceGrafu) {
            vyplnOvladace(nazev, nejnovejsiZaznam[nazev]);
        }
    };

    const vyplnOvladace = (nazev, data) => {
        const kontejner = document.getElementById(definiceGrafu[nazev].ovladaceId);
        kontejner.innerHTML = '';
        for (const [label, hodnota] of Object.entries(data)) {
            const div = document.createElement('div');
            div.className = 'ovladaci-prvek';
            div.innerHTML = `<label for="${nazev}-${label}">${label.charAt(0).toUpperCase() + label.slice(1)}:</label>
                             <input type="number" id="${nazev}-${label}" value="${hodnota}" min="0" max="10" step="1">`;
            kontejner.appendChild(div);
        }
    };
    
    // Zbytek kódu pro načítání a ukládání zůstává téměř stejný,
    // protože už pracuje s celým polem `vsechnaData`.

    const ulozVsechnaData = async (dataKUlozeni, zprava) => {
        try {
            await fetch('/api/grafy-data', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dataKUlozeni)
            });
            alert(zprava);
            nactiData();
        } catch (error) { console.error("Chyba při ukládání:", error); alert('Chyba při ukládání!'); }
    };

    const nactiData = async () => {
        try {
            const response = await fetch('/api/grafy-data');
            vsechnaData = await response.json();
            vykresliVse(); // Jednoduše překreslíme vše s načtenými daty
        } catch (error) { console.error("Chyba při načítání dat:", error); }
    };
    
    function pridejNovyZaznam() {
        const zvoleneDatum = vyberDatumEl.value;
        if (!zvoleneDatum) return alert("Prosím, vyberte datum pro nový záznam.");

        const posledniZaznam = vsechnaData.length > 0 ? vsechnaData[vsechnaData.length - 1] : definiceGrafu;
        const novyZaznam = JSON.parse(JSON.stringify(posledniZaznam));
        novyZaznam.datum = zvoleneDatum;
        
        vsechnaData.push(novyZaznam);
        ulozVsechnaData(vsechnaData, `Nový záznam pro datum ${zvoleneDatum} byl přidán.`);
    }

    function ulozAktualniZaznam() {
        if (vsechnaData.length === 0) return alert("Není co ukládat.");
        
        // Ukládáme vždy data nejnovějšího záznamu z ovládacích prvků
        const nejnovejsiIndex = vsechnaData.length - 1;
        for (const [nazev] of Object.entries(definiceGrafu)) {
            for (const label of Object.keys(vsechnaData[nejnovejsiIndex][nazev])) {
                const inputEl = document.getElementById(`${nazev}-${label}`);
                vsechnaData[nejnovejsiIndex][nazev][label] = Number(inputEl.value);
            }
        }
        ulozVsechnaData(vsechnaData, `Změny pro nejnovější záznam (${vsechnaData[nejnovejsiIndex].datum}) byly uloženy.`);
    }

    function vymazPosledniZaznam() {
        if(vsechnaData.length === 0) return alert("Není co mazat.");

        const zaznamK_smazani = vsechnaData[vsechnaData.length - 1];
        const potvrzeni = confirm(`Opravdu si přejete trvale smazat poslední záznam pro datum ${zaznamK_smazani.datum}?`);

        if (potvrzeni) {
            vsechnaData.pop(); // Odebere poslední prvek
            ulozVsechnaData(vsechnaData, `Záznam ${zaznamK_smazani.datum} byl smazán.`);
        }
    }

    // Zjednodušení ovládání: Odstraníme roletku, není už potřeba.
    // Uživatel vidí historii a ovládá vždy jen nejnovější záznam.
    document.getElementById('ulozit-grafy').addEventListener('click', ulozAktualniZaznam);
    document.getElementById('pridat-zaznam').addEventListener('click', pridejNovyZaznam);
    document.getElementById('vymazat-zaznam').addEventListener('click', vymazPosledniZaznam);

    // Nastavíme dnešní datum jako výchozí pro nový záznam
    vyberDatumEl.value = new Date().toISOString().split('T')[0];
    
    nactiData();
});