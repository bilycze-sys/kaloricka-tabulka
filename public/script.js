document.addEventListener('DOMContentLoaded', () => {
    const tabulkaBody = document.getElementById('kaloricka-tabulka-body');
    const pridatRadekBtn = document.getElementById('pridat-radek');
    const ulozitDataBtn = document.getElementById('ulozit-data');
    let pocetTydnu = 0; // Nová proměnná pro sledování počtu týdnů

    const aktualizujSoucet = (radek) => {
        const inputyKalorii = radek.querySelectorAll('input[type="number"]');
        let soucet = 0;
        inputyKalorii.forEach(input => {
            soucet += parseInt(input.value) || 0;
        });
        radek.lastElementChild.textContent = soucet;
    };

    // Upravená funkce pro vytvoření řádku
    const vytvorRadek = (dataTydne = {}) => {
        const tr = document.createElement('tr');
        tr.classList.add('tyden-radek');

        for (let i = 0; i < 7; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.value = dataTydne.kalorie?.[i] || '';
            input.addEventListener('input', () => aktualizujSoucet(tr));
            td.appendChild(input);
            tr.appendChild(td);
        }

        const tdPocit = document.createElement('td');
        const inputPocit = document.createElement('input');
        inputPocit.type = 'text';
        inputPocit.value = dataTydne.pocit || '';
        tdPocit.appendChild(inputPocit);
        tr.appendChild(tdPocit);

        const tdVazeni = document.createElement('td');
        const textareaVazeni = document.createElement('textarea');
        textareaVazeni.rows = 3;
        textareaVazeni.value = dataTydne.vazeni || '';
        tdVazeni.appendChild(textareaVazeni);
        tr.appendChild(tdVazeni);
        
        const tdSoucet = document.createElement('td');
        tdSoucet.className = 'soucet-bunka';
        tr.appendChild(tdSoucet);

        tabulkaBody.appendChild(tr);
        pocetTydnu++; // Po přidání každého týdne zvýšíme počítadlo

        // === ZDE JE TA HLAVNÍ ZMĚNA ===
        // Pokud je aktuální počet týdnů dělitelný 4, přidej měsíční poznámku
        if (pocetTydnu % 4 === 0) {
            const trPoznamka = document.createElement('tr');
            const tdPoznamka = document.createElement('td');
            tdPoznamka.colSpan = 10;
            
            const inputPoznamka = document.createElement('input');
            inputPoznamka.type = 'text';
            inputPoznamka.placeholder = 'Měsíční poznámka...';
            // Pokud máme data, použijeme je
            inputPoznamka.value = dataTydne.mesicniPoznamka || '';
            inputPoznamka.className = 'mesicni-poznamka-input'; // Dáme jí novou třídu
            tdPoznamka.appendChild(inputPoznamka);
            trPoznamka.appendChild(tdPoznamka);
            tabulkaBody.appendChild(trPoznamka);
        }

        aktualizujSoucet(tr);
    };

    const nactiData = async () => {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            tabulkaBody.innerHTML = '';
            pocetTydnu = 0; // Resetujeme počítadlo
            
            if (data.length > 0) {
                data.forEach(tyden => vytvorRadek(tyden));
            } else {
                vytvorRadek();
            }
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            vytvorRadek();
        }
    };

    const ulozData = async () => {
        const radky = tabulkaBody.querySelectorAll('.tyden-radek');
        const dataKUlozeni = [];

        radky.forEach((radek, index) => {
            const dataTydne = { kalorie: [] };
            const inputy = radek.querySelectorAll('input, textarea');

            for (let i = 0; i < 7; i++) {
                dataTydne.kalorie.push(parseInt(inputy[i].value) || 0);
            }
            
            dataTydne.pocit = inputy[7].value.trim();
            dataTydne.vazeni = inputy[8].value.trim();

            // Pokud je to čtvrtý řádek, najdi poznámku a ulož ji
            if ((index + 1) % 4 === 0) {
                const poznamkaRadek = radek.nextElementSibling;
                // Zkontrolujeme, jestli další řádek vůbec existuje a jestli je to poznámka
                if (poznamkaRadek && poznamkaRadek.querySelector('.mesicni-poznamka-input')) {
                    const poznamkaInput = poznamkaRadek.querySelector('.mesicni-poznamka-input');
                    dataTydne.mesicniPoznamka = poznamkaInput.value.trim();
                }
            }
            dataKUlozeni.push(dataTydne);
        });

        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataKUlozeni),
            });
            if (!response.ok) throw new Error('Chyba na straně serveru');
            alert('Data úspěšně uložena!');
        } catch (error) {
            console.error('Chyba při ukládání dat:', error);
            alert('Nastala chyba při ukládání.');
        }
    };

    pridatRadekBtn.addEventListener('click', () => vytvorRadek());
    ulozitDataBtn.addEventListener('click', ulozData);

    nactiData();
});