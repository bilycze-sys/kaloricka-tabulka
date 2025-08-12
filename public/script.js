document.addEventListener('DOMContentLoaded', () => {
    const tabulkaBody = document.getElementById('kaloricka-tabulka-body');
    // Změna ID tlačítka
    const pridatMesicBtn = document.getElementById('pridat-mesic');
    const ulozitDataBtn = document.getElementById('ulozit-data');

    const aktualizujSoucet = (radek) => {
        const inputyKalorii = radek.querySelectorAll('input[type="number"]');
        let soucet = 0;
        inputyKalorii.forEach(input => { soucet += parseInt(input.value) || 0; });
        radek.lastElementChild.textContent = soucet;
    };

    const vytvorRadek = (dataTydne = {}) => {
        const tr = document.createElement('tr');
        tr.classList.add('tyden-radek');
        tr.dataset.type = 'tyden';

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
        const textareaPocit = document.createElement('textarea');
        textareaPocit.rows = 3;
        textareaPocit.value = dataTydne.pocit || '';
        tdPocit.appendChild(textareaPocit);
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
        aktualizujSoucet(tr);
    };

    const vytvorSpecialniRadek = (data) => {
        const tr = document.createElement('tr');
        tr.dataset.type = 'special';
        const td = document.createElement('td');
        td.colSpan = 10;
        td.className = 'special-radek-text';
        td.textContent = data.text;
        tr.appendChild(td);
        tabulkaBody.appendChild(tr);
    };

    // === TOTO JE KLÍČOVÁ FUNKCE, KTEROU ZNOVU AKTIVUJEME ===
    const pridejCelyMesic = () => {
        for (let i = 0; i < 4; i++) {
            vytvorRadek();
        }
        const trPoznamka = document.createElement('tr');
        trPoznamka.dataset.type = 'poznamka'; // Dáme jí typ pro ukládání
        const tdPoznamka = document.createElement('td');
        tdPoznamka.colSpan = 10;
        const inputPoznamka = document.createElement('input');
        inputPoznamka.type = 'text';
        inputPoznamka.placeholder = 'Měsíční cíle / hodnocení...';
        inputPoznamka.className = 'mesicni-poznamka-input';
        tdPoznamka.appendChild(inputPoznamka);
        trPoznamka.appendChild(tdPoznamka);
        tabulkaBody.appendChild(trPoznamka);
    };

    const nactiData = async () => {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            tabulkaBody.innerHTML = '';
            
            if (data.length > 0) {
                data.forEach(zaznam => {
                    if (zaznam.type === 'special') {
                        vytvorSpecialniRadek(zaznam);
                    } else if (zaznam.type === 'poznamka') {
                        const trPoznamka = document.createElement('tr');
                        trPoznamka.dataset.type = 'poznamka';
                        const tdPoznamka = document.createElement('td');
                        tdPoznamka.colSpan = 10;
                        const inputPoznamka = document.createElement('input');
                        inputPoznamka.type = 'text';
                        inputPoznamka.placeholder = 'Měsíční cíle / hodnocení...';
                        inputPoznamka.className = 'mesicni-poznamka-input';
                        inputPoznamka.value = zaznam.text || '';
                        tdPoznamka.appendChild(inputPoznamka);
                        trPoznamka.appendChild(tdPoznamka);
                        tabulkaBody.appendChild(trPoznamka);
                    } else {
                        vytvorRadek(zaznam);
                    }
                });
            } else {
                pridejCelyMesic();
            }
        } catch (error) { console.error('Chyba při načítání dat:', error); pridejCelyMesic(); }
    };

    const ulozData = async () => {
        const vsechnyRadky = tabulkaBody.querySelectorAll('tr[data-type]');
        const dataKUlozeni = [];

        vsechnyRadky.forEach(radek => {
            if (radek.dataset.type === 'tyden') {
                const inputy = radek.querySelectorAll('input, textarea');
                const dataTydne = { kalorie: [] };
                for (let i = 0; i < 7; i++) { dataTydne.kalorie.push(parseInt(inputy[i].value) || 0); }
                dataTydne.pocit = inputy[7].value.trim();
                dataTydne.vazeni = inputy[8].value.trim();
                dataKUlozeni.push(dataTydne);
            } else if (radek.dataset.type === 'special') {
                const dataSpecial = { type: 'special', text: radek.textContent };
                dataKUlozeni.push(dataSpecial);
            } else if (radek.dataset.type === 'poznamka') {
                const poznamkaInput = radek.querySelector('.mesicni-poznamka-input');
                const dataPoznamka = { type: 'poznamka', text: poznamkaInput.value.trim() };
                dataKUlozeni.push(dataPoznamka);
            }
        });

        try {
            await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataKUlozeni) });
            alert('Data úspěšně uložena!');
        } catch (error) { console.error('Chyba při ukládání dat:', error); alert('Nastala chyba při ukládání.'); }
    };

    // Přiřazení správné funkce tlačítku
    pridatMesicBtn.addEventListener('click', pridejCelyMesic);
    ulozitDataBtn.addEventListener('click', ulozData);

    nactiData();
});