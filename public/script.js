document.addEventListener('DOMContentLoaded', () => {
    const tabulkaBody = document.getElementById('kaloricka-tabulka-body');
    const pridatRadekBtn = document.getElementById('pridat-radek');
    const ulozitDataBtn = document.getElementById('ulozit-data');

    // --- POMOCNÉ FUNKCE ---

    // NOVÁ FUNKCE: Automaticky spočítá a zobrazí součet kalorií pro daný řádek
    const aktualizujSoucet = (radek) => {
        const inputyKalorii = radek.querySelectorAll('input[type="number"]');
        let soucet = 0;
        inputyKalorii.forEach(input => {
            soucet += parseInt(input.value) || 0;
        });
        // Poslední buňka v řádku je pro součet
        radek.lastElementChild.textContent = soucet;
    };

    // --- HLAVNÍ FUNKCE ---

    // Přepracovaná funkce pro vytvoření řádku
    const vytvorRadek = (dataTydne = {}) => {
        // 1. HLAVNÍ ŘÁDEK S DATY
        const tr = document.createElement('tr');
        tr.classList.add('tyden-radek');

        // Vytvoření 7 polí pro kalorie
        for (let i = 0; i < 7; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.value = dataTydne.kalorie?.[i] || '';
            // Při každé změně v políčku zavoláme přepočítání součtu
            input.addEventListener('input', () => aktualizujSoucet(tr));
            td.appendChild(input);
            tr.appendChild(td);
        }

        // Buňka pro "Pocit"
        const tdPocit = document.createElement('td');
        const inputPocit = document.createElement('input');
        inputPocit.type = 'text';
        inputPocit.value = dataTydne.pocit || '';
        tdPocit.appendChild(inputPocit);
        tr.appendChild(tdPocit);

        // Buňka pro "Vážení"
        const tdVazeni = document.createElement('td');
        const textareaVazeni = document.createElement('textarea');
        textareaVazeni.rows = 3;
        textareaVazeni.value = dataTydne.vazeni || '';
        tdVazeni.appendChild(textareaVazeni);
        tr.appendChild(tdVazeni);
        
        // Buňka pro součet kalorií
        const tdSoucet = document.createElement('td');
        tdSoucet.className = 'soucet-bunka'; // Dáme jí třídu pro případné stylování
        tr.appendChild(tdSoucet);

        tabulkaBody.appendChild(tr);

        // 2. ŘÁDEK PRO POZNÁMKU
        const trPoznamka = document.createElement('tr');
        const tdPoznamka = document.createElement('td');
        tdPoznamka.colSpan = 10; // Roztáhne se přes všechny sloupce
        
        const inputPoznamka = document.createElement('input');
        inputPoznamka.type = 'text';
        inputPoznamka.placeholder = 'Týdenní poznámka (např. nemocnice, dovolená)...';
        inputPoznamka.value = dataTydne.tydenniPoznamka || '';
        inputPoznamka.className = 'poznamka-input';
        tdPoznamka.appendChild(inputPoznamka);
        trPoznamka.appendChild(tdPoznamka);
        tabulkaBody.appendChild(trPoznamka);

        // Po vytvoření řádku rovnou spočítáme součet pro načtená data
        aktualizujSoucet(tr);
    };

    // Upravená funkce pro načtení dat
    const nactiData = async () => {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            tabulkaBody.innerHTML = ''; // Vyčistit tabulku
            
            if (data.length > 0) {
                data.forEach(tyden => vytvorRadek(tyden));
            } else {
                // OPRAVA: Pokud nejsou žádná data, vytvoř jeden prázdný řádek
                vytvorRadek();
            }
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            // Pokud selže načítání, také vytvoř jeden prázdný řádek
            vytvorRadek();
        }
    };

    // Přepracovaná funkce pro uložení dat
    const ulozData = async () => {
        const radky = tabulkaBody.querySelectorAll('.tyden-radek');
        const dataKUlozeni = [];

        radky.forEach(radek => {
            const dataTydne = { kalorie: [] };
            const inputy = radek.querySelectorAll('input, textarea');

            for (let i = 0; i < 7; i++) {
                dataTydne.kalorie.push(parseInt(inputy[i].value) || 0);
            }
            
            dataTydne.pocit = inputy[7].value.trim();
            dataTydne.vazeni = inputy[8].value.trim();

            // Najdeme poznámku, která je v následujícím `<tr>`
            const poznamkaRadek = radek.nextElementSibling;
            if (poznamkaRadek) {
                const poznamkaInput = poznamkaRadek.querySelector('.poznamka-input');
                dataTydne.tydenniPoznamka = poznamkaInput.value.trim();
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

    // Přiřazení funkcí tlačítkům
    pridatRadekBtn.addEventListener('click', () => vytvorRadek());
    ulozitDataBtn.addEventListener('click', ulozData);

    // Prvotní načtení dat
    nactiData();
});