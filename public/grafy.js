document.addEventListener('DOMContentLoaded', () => {
    const chartInstances = {};
    let vsechnaData = [];
    const vyberDatumEl = document.getElementById('vyber-datum');

    const definiceGrafu = {
        telo: { id: 'graf-telo', ovladaceId: 'ovladace-telo', labels: ['Váha', 'Míry', 'Body Fat %', 'Síla'] },
        prace: { id: 'graf-prace', ovladaceId: 'ovladace-prace', labels: ['Příjem', 'Čas. náročnost', 'Remote', 'Zábavnost'] },
        jazyk: { id: 'graf-jazyk', ovladaceId: 'ovladace-jazyk', labels: ['Slovní zásoba', 'Komunikace', 'Časování', 'Předložky'] }
    };

    const generujBarvu = (index, total) => {
        const progress = total > 1 ? index / (total - 1) : 1;
        const startHue = 210; const saturation = 30 + (60 * progress); const lightness = 85 - (35 * progress);
        const alphaFill = 0.1 + (0.2 * progress); const alphaBorder = 0.3 + (0.7 * progress);
        return { vypln: `hsla(${startHue}, ${saturation}%, ${lightness}%, ${alphaFill})`, okraj: `hsla(${startHue}, ${saturation}%, ${lightness}%, ${alphaBorder})` };
    };

    const vykresliVse = () => {
        if (vsechnaData.length === 0) return;
        vsechnaData.sort((a, b) => new Date(a.datum) - new Date(b.datum));
        const dataKVykresleni = vsechnaData.slice(-12);

        for (const [nazev, definice] of Object.entries(definiceGrafu)) {
            const datasets = dataKVykresleni.map((zaznam, index) => {
                const { vypln, okraj } = generujBarvu(index, dataKVykresleni.length);
                return {
                    label: zaznam.datum, data: Object.values(zaznam[nazev]), fill: true,
                    backgroundColor: vypln, borderColor: okraj, pointRadius: 2
                };
            });

            if (chartInstances[nazev]) chartInstances[nazev].destroy();
            const ctx = document.getElementById(definice.id).getContext('2d');
            chartInstances[nazev] = new Chart(ctx, {
                type: 'radar', data: { labels: definice.labels, datasets },
                options: { scales: { r: { min: 0, max: 10, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
            });
        }
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

    const ulozVsechnaData = async (dataKUlozeni, zprava) => {
        try {
            await fetch('/api/grafy-data', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dataKUlozeni) });
            alert(zprava);
            nactiData();
        } catch (error) { console.error("Chyba při ukládání:", error); alert('Chyba při ukládání!'); }
    };

    const nactiData = async () => {
        try {
            const response = await fetch('/api/grafy-data');
            vsechnaData = await response.json();
            
            // === ZDE INICIALIZUJEME NOVÝ KALENDÁŘ ===
            const existujiciDatumy = vsechnaData.map(zaznam => zaznam.datum);
            flatpickr(vyberDatumEl, {
                dateFormat: "Y-m-d", // Formát data
                defaultDate: "today", // Výchozí datum je dnešek
                onDayCreate: function(dObj, dStr, fp, dayElem) {
                    // Pro každý den v kalendáři zkontrolujeme, zda existuje v našich datech
                    const datum = dayElem.dateObj.toISOString().split('T')[0];
                    if (existujiciDatumy.includes(datum)) {
                        dayElem.classList.add("zaznam-existuje"); // Přidáme mu třídu pro zvýraznění
                    }
                }
            });

            vykresliVse();
        } catch (error) { console.error("Chyba při načítání dat:", error); }
    };
    
    function pridejNovyZaznam() {
        const zvoleneDatum = vyberDatumEl.value;
        if (!zvoleneDatum) return alert("Prosím, vyberte datum pro nový záznam.");
        if (vsechnaData.some(z => z.datum === zvoleneDatum)) return alert("Pro tento den již záznam existuje.");

        const posledniZaznam = vsechnaData.length > 0 ? vsechnaData[vsechnaData.length - 1] : definiceGrafu;
        const novyZaznam = JSON.parse(JSON.stringify(posledniZaznam));
        novyZaznam.datum = zvoleneDatum;
        
        vsechnaData.push(novyZaznam);
        ulozVsechnaData(vsechnaData, `Nový záznam pro datum ${zvoleneDatum} byl přidán.`);
    }

    function ulozAktualniZaznam() {
        if (vsechnaData.length === 0) return alert("Není co ukládat.");
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
            vsechnaData.pop();
            ulozVsechnaData(vsechnaData, `Záznam ${zaznamK_smazani.datum} byl smazán.`);
        }
    }

    document.getElementById('ulozit-grafy').addEventListener('click', ulozAktualniZaznam);
    document.getElementById('pridat-zaznam').addEventListener('click', pridejNovyZaznam);
    document.getElementById('vymazat-zaznam').addEventListener('click', vymazPosledniZaznam);
    
    nactiData();
});