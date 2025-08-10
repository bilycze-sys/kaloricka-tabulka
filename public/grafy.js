document.addEventListener('DOMContentLoaded', () => {
    const chartInstances = {};
    let vsechnaData = [];
    let aktualniIndex = 0;
    const vyberMesiceEl = document.getElementById('vyber-mesice');
    const vyberDatumEl = document.getElementById('vyber-datum');

    const definiceGrafu = {
        telo: { id: 'graf-telo', ovladaceId: 'ovladace-telo', labels: ['Váha', 'Míry', 'Body Fat %', 'Síla'] },
        prace: { id: 'graf-prace', ovladaceId: 'ovladace-prace', labels: ['Příjem', 'Čas. náročnost', 'Remote', 'Zábavnost'] },
        jazyk: { id: 'graf-jazyk', ovladaceId: 'ovladace-jazyk', labels: ['Slovní zásoba', 'Komunikace', 'Časování', 'Předložky'] }
    };

    // === ZDE JE TA KLÍČOVÁ ZMĚNA ===
    const vykresliVse = () => {
        if (vsechnaData.length === 0) return;

        // Seřadíme data podle data, abychom mohli spolehlivě najít předchozí
        vsechnaData.sort((a, b) => new Date(a.datum) - new Date(b.datum));
        
        const aktualniZaznam = vsechnaData[aktualniIndex];
        
        // Najdeme nejbližší předchozí záznam podle data
        const predchoziZaznam = vsechnaData.slice(0, aktualniIndex).pop();

        for (const [nazev, definice] of Object.entries(definiceGrafu)) {
            const aktualniHodnoty = Object.values(aktualniZaznam[nazev]);
            const datasets = [{
                label: `Záznam (${aktualniZaznam.datum})`,
                data: aktualniHodnoty,
                fill: true, backgroundColor: 'rgba(54, 162, 235, 0.3)', borderColor: 'rgb(54, 162, 235)',
            }];

            if (predchoziZaznam) {
                datasets.push({
                    label: `Předchozí (${predchoziZaznam.datum})`,
                    data: Object.values(predchoziZaznam[nazev]),
                    fill: true, backgroundColor: 'rgba(201, 203, 207, 0.3)', borderColor: 'rgb(201, 203, 207)',
                });
            }

            if (chartInstances[nazev]) chartInstances[nazev].destroy();
            const ctx = document.getElementById(definice.id).getContext('2d');
            chartInstances[nazev] = new Chart(ctx, {
                type: 'radar', data: { labels: definice.labels, datasets },
                options: { scales: { r: { min: 0, max: 10, ticks: { stepSize: 1 } } } }
            });
            vyplnOvladace(nazev, aktualniZaznam[nazev]);
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

    const naplnDropdown = () => {
        const vybranaHodnota = vyberMesiceEl.value;
        vyberMesiceEl.innerHTML = '';
        vsechnaData.sort((a, b) => new Date(b.datum) - new Date(a.datum)); // Řadíme od nejnovějšího pro zobrazení
        vsechnaData.forEach((zaznam, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = zaznam.datum;
            vyberMesiceEl.appendChild(option);
        });
        vyberMesiceEl.value = vybranaHodnota || 0;
        aktualniIndex = Number(vyberMesiceEl.value);
    };

    const ulozVsechnaData = async (dataKUlozeni, zprava) => {
        try {
            await fetch('/api/grafy-data', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dataKUlozeni)
            });
            alert(zprava);
            nactiData();
        } catch (error) {
            console.error("Chyba při ukládání:", error);
            alert('Chyba při ukládání!');
        }
    };
    
    const nactiData = async () => {
        try {
            const response = await fetch('/api/grafy-data');
            vsechnaData = await response.json();
            if (vsechnaData.length > 0) {
                aktualniIndex = 0;
                naplnDropdown();
                vykresliVse();
            }
        } catch (error) { console.error("Chyba při načítání dat:", error); }
    };
    
    function pridejNovyZaznam() {
        const zvoleneDatum = vyberDatumEl.value;
        if (!zvoleneDatum) {
            alert("Prosím, vyberte datum pro nový záznam.");
            return;
        }

        const posledniZaznam = vsechnaData.length > 0 ? vsechnaData[0] : definiceGrafu;
        const novyZaznam = JSON.parse(JSON.stringify(posledniZaznam));
        novyZaznam.datum = zvoleneDatum;
        
        vsechnaData.push(novyZaznam);
        ulozVsechnaData(vsechnaData, `Nový záznam pro datum ${zvoleneDatum} byl přidán.`);
    }

    function ulozAktualniZaznam() {
        if(vsechnaData.length === 0) return alert("Není co ukládat. Přidejte první záznam.");
        
        const vybranyZaznam = vsechnaData[aktualniIndex];
        
        for (const [nazev] of Object.entries(definiceGrafu)) {
            for (const label of Object.keys(vybranyZaznam[nazev])) {
                const inputEl = document.getElementById(`${nazev}-${label}`);
                vybranyZaznam[nazev][label] = Number(inputEl.value);
            }
        }
        ulozVsechnaData(vsechnaData, `Změny pro záznam ${vybranyZaznam.datum} byly uloženy.`);
    }

    function vymazAktualniZaznam() {
        if(vsechnaData.length === 0) return alert("Není co mazat.");

        const zaznamK_smazani = vsechnaData[aktualniIndex];
        const potvrzeni = confirm(`Opravdu si přejete trvale smazat záznam pro datum ${zaznamK_smazani.datum}?`);

        if (potvrzeni) {
            vsechnaData.splice(aktualniIndex, 1);
            ulozVsechnaData(vsechnaData, `Záznam ${zaznamK_smazani.datum} byl smazán.`);
        }
    }

    vyberMesiceEl.addEventListener('change', (e) => {
        aktualniIndex = Number(e.target.value);
        // Po změně v dropdownu musíme data znovu seřadit podle data pro správné porovnání
        vsechnaData.sort((a, b) => new Date(a.datum) - new Date(b.datum));
        // Najdeme skutečný index vybraného záznamu v nově seřazeném poli
        const vybranyDatum = e.target.options[e.target.selectedIndex].text;
        aktualniIndex = vsechnaData.findIndex(z => z.datum === vybranyDatum);
        
        vykresliVse();
    });

    document.getElementById('ulozit-grafy').addEventListener('click', ulozAktualniZaznam);
    document.getElementById('pridat-zaznam').addEventListener('click', pridejNovyZaznam);
    document.getElementById('vymazat-zaznam').addEventListener('click', vymazAktualniZaznam);

    nactiData();
});