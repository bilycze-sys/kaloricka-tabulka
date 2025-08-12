document.addEventListener('DOMContentLoaded', () => {
    const tabulkaBody = document.getElementById('kaloricka-tabulka-body');
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

    const pridejCelyMesic = () => {
        for (let i = 0; i < 4; i++) { vytvorRadek(); }
        const trPoznamka = document.createElement('tr');
        const tdPoznamka = document.createElement('td');
        tdPoznamka.colSpan = 10;
        const inputPoznamka = document.createElement('input');
        inputPoznamka.type = 'text';
        inputPoznamka.placeholder = 'Měsíční cíle / hodnocení...';
        inputPoznamka.className = 'mesicni-poznamka-input';
        tdPoznamka.appendChild(inputPoznamka);
        trPoznamka.appendChild(tdPoznamka);
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
            }
        });

        try {
            await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataKUlozeni) });
            alert('Data úspěšně uložena!');
        } catch (error) { console.error('Chyba při ukládání dat:', error); alert('Nastala chyba při ukládání.'); }
    };

    pridatMesicBtn.addEventListener('click', pridejCelyMesic);
    ulozitDataBtn.addEventListener('click', ulozData);

    nactiData();
});```

---

### **Krok 3: Úprava souboru `public/style.css`**

Zajistíme, aby se speciální řádek "nemocnice" zobrazil správně.

**Celý obsah souboru `public/style.css`:**
```css
body {
    font-family: sans-serif;
    padding: 20px;
    background-color: #f9f9f9;
}

h1 {
    text-align: center;
    color: #333;
}

.tabulka-kontejner {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

th, td {
    border: 1px solid #ddd;
    padding: 4px;
    text-align: center;
}

th {
    background-color: #4CAF50;
    color: white;
    padding: 12px 4px;
}

input[type="number"], input[type="text"], textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid transparent;
    padding: 8px;
    text-align: center;
    background-color: transparent;
    font-size: 16px;
    transition: background-color 0.2s;
}

input:focus, textarea:focus {
    outline: none;
    background-color: #e8f0fe;
}

textarea {
    resize: vertical;
    text-align: left;
}

.mesicni-poznamka-input {
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    font-weight: bold;
    font-size: 20px;
    background-color: #e1f5fe;
    border: 1px solid #0288d1;
    color: #01579b;
    padding: 10px;
    margin-top: 5px;
    margin-bottom: 15px;
}

.soucet-bunka {
    font-weight: bold;
    font-size: 1.1em;
    background-color: #e3f2fd;
    color: #0d47a1;
}

button {
    padding: 12px 25px;
    font-size: 16px;
    cursor: pointer;
    border: none;
    border-radius: 5px;
    margin-right: 10px;
    color: white;
}

#pridat-mesic {
    background-color: #4CAF50;
}

#ulozit-data {
    background-color: #2196F3;
}

#zobrazit-grafy {
    background-color: #ff9800;
}

.flatpickr-day.zaznam-existuje {
    background: #e3f2fd;
    border-color: #2196F3;
    color: #0d47a1;
    font-weight: bold;
}

.special-radek-text {
    padding: 20px !important;
    font-size: 24px;
    font-weight: bold;
    color: #555;
    background-color: #f0f0f0;
    text-transform: uppercase;
}

@media (max-width: 800px) {
    body { padding: 10px; }
    button, a { width: 100%; }
    button { margin-bottom: 10px; }
}