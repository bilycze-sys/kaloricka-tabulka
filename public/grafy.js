document.addEventListener('DOMContentLoaded', () => {
    const chartInstances = {};
    let vsechnaData = [];
    let aktualniIndex = 0;
    const vyberMesiceEl = document.getElementById('vyber-mesice');

    const definiceGrafu = {
        telo: { id: 'graf-telo', ovladaceId: 'ovladace-telo', labels: ['Váha', 'Míry', 'Body Fat %', 'Síla'] },
        prace: { id: 'graf-prace', ovladaceId: 'ovladace-prace', labels: ['Příjem', 'Čas. náročnost', 'Remote', 'Zábavnost'] },
        jazyk: { id: 'graf-jazyk', ovladaceId: 'ovladace-jazyk', labels: ['Slovní zásoba', 'Komunikace', 'Časování', 'Předložky'] }
    };

    const vykresliVse = () => {
        if (vsechnaData.length === 0) return;

        const aktualniZaznam = vsechnaData[aktualniIndex];
        const predchoziZaznam = aktualniIndex > 0 ? vsechnaData[aktualniIndex - 1] : null;

        for (const [nazev, definice] of Object.entries(definiceGrafu)) {
            const aktualniHodnoty = Object.values(aktualniZaznam[nazev]);
            const datasets = [{
                label: `Aktuální (${aktualniZaznam.datum})`,
                data: aktualniHodnoty,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.3)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
            }];

            if (predchoziZaznam) {
                const predchoziHodnoty = Object.values(predchoziZaznam[nazev]);
                datasets.push({
                    label: `Předchozí (${predchoziZaznam.datum})`,
                    data: predchoziHodnoty,
                    fill: true,
                    backgroundColor: 'rgba(201, 203, 207, 0.3)',
                    borderColor: 'rgb(201, 203, 207)',
                    pointBackgroundColor: 'rgb(201, 203, 207)',
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
        const { ovladaceId } = definiceGrafu[nazev];
        const kontejner = document.getElementById(ovladaceId);
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
        vyberMesiceEl.innerHTML = '';
        vsechnaData.forEach((zaznam, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = zaznam.datum;
            vyberMesiceEl.appendChild(option);
        });
        vyberMesiceEl.value = aktualniIndex;
    };
    
    const nactiData = async () => {
        try {
            const response = await fetch('/api/grafy-data');
            vsechnaData = await response.json();
            if (vsechnaData.length === 0) {
                pridejNovyZaznam(true);
            } else {
                aktualniIndex = vsechnaData.length - 1;
                naplnDropdown();
                vykresliVse();
            }
        } catch (error) {
            console.error("Chyba při načítání dat:", error);
        }
    };

    const ulozData = async () => {
        for (const [nazev, definice] of Object.entries(definiceGrafu)) {
            for (const label of Object.keys(vsechnaData[aktualniIndex][nazev])) {
                const inputEl = document.getElementById(`${nazev}-${label}`);
                vsechnaData[aktualniIndex][nazev][label] = Number(inputEl.value);
            }
        }
        
        try {
            await fetch('/api/grafy-data', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(vsechnaData)
            });
            alert('Data uložena!');
            vykresliVse();
        } catch (error) {
            console.error("Chyba při ukládání:", error);
            alert('Chyba při ukládání!');
        }
    };

    function pridejNovyZaznam(jenVytvorit = false) {
        const posledniZaznam = vsechnaData.length > 0 ? vsechnaData[vsechnaData.length - 1] : JSON.parse(JSON.stringify(definiceGrafu));
        const novyZaznam = JSON.parse(JSON.stringify(posledniZaznam));
        novyZaznam.datum = new Date().toISOString().split('T')[0];
        vsechnaData.push(novyZaznam);
        aktualniIndex = vsechnaData.length - 1;
        naplnDropdown();
        vykresliVse();
        if (!jenVytvorit) ulozData();
    }

    vyberMesiceEl.addEventListener('change', (e) => {
        aktualniIndex = Number(e.target.value);
        vykresliVse();
    });

    document.getElementById('ulozit-grafy').addEventListener('click', ulozData);
    document.getElementById('pridat-zaznam').addEventListener('click', () => pridejNovyZaznam());

    nactiData();
});