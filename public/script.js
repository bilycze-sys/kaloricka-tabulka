// Najdeme si klíčové HTML elementy, se kterými budeme pracovat
const kontejner = document.getElementById('tabulka-kontejner');
const ulozitBtn = document.getElementById('ulozit-btn');
const statusZprava = document.getElementById('status-zprava');

// Funkce, která vytvoří tabulku z dat
function vytvorTabulku(data) {
    // Vytvoříme HTML element <table>
    const table = document.createElement('table');

    // Projdeme všechny řádky v datech (máme jich 7)
    data.forEach((radekDat, indexRadku) => {
        // Pro každý řádek vytvoříme HTML element <tr> (table row)
        const tr = document.createElement('tr');

        // Projdeme všechny sloupce v řádku (máme jich 15)
        radekDat.forEach((hodnota, indexSloupce) => {
            // Vytvoříme buňku <td> (table data)
            const td = document.createElement('td');
            // Vytvoříme input políčko
            const input = document.createElement('input');
            input.type = 'number'; // Chceme zadávat jen čísla
            input.value = hodnota; // Nastavíme mu hodnotu z dat
            // Přidáme inputu unikátní ID pro snadnou identifikaci
            input.id = `bunka-${indexRadku}-${indexSloupce}`;

            // Vložíme input do buňky a buňku do řádku
            td.appendChild(input);
            tr.appendChild(td);
        });

        // Vložíme hotový řádek do tabulky
        table.appendChild(tr);
    });

    // Vyčistíme kontejner a vložíme do něj celou novou tabulku
    kontejner.innerHTML = '';
    kontejner.appendChild(table);
}

// Funkce, která sebere data z tabulky na stránce
function seberDataZTabulky() {
    const novaData = [];
    // Projdeme 7 řádků
    for (let i = 0; i < 7; i++) {
        const radek = [];
        // Projdeme 15 sloupců
        for (let j = 0; j < 15; j++) {
            // Najdeme správné políčko podle jeho ID
            const input = document.getElementById(`bunka-${i}-${j}`);
            // Přečteme jeho hodnotu, převedeme ji na číslo a přidáme do řádku
            // Pokud je políčko prázdné, uložíme 0
            radek.push(parseInt(input.value) || 0);
        }
        novaData.push(radek);
    }
    return novaData;
}

// --- HLAVNÍ LOGIKA ---

// 1. Načtení dat při startu stránky
async function nactiData() {
    try {
        // Pošleme dotaz na náš server na adresu /api/data
        const response = await fetch('/api/data');
        const data = await response.json(); // Převedeme odpověď na JSON
        vytvorTabulku(data); // Z dat postavíme tabulku
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        statusZprava.textContent = 'Nepodařilo se načíst data ze serveru.';
    }
}

// 2. Uložení dat po kliknutí na tlačítko
ulozitBtn.addEventListener('click', async () => {
    try {
        const dataKUlozeni = seberDataZTabulky();
        statusZprava.textContent = 'Ukládám...'; // Dáme uživateli vědět, že se něco děje

        // Pošleme data na náš server metodou POST
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Říkáme, že posíláme JSON
            },
            body: JSON.stringify(dataKUlozeni), // Převedeme naše data na textový řetězec JSON
        });

        if (response.ok) {
            statusZprava.textContent = 'Úspěšně uloženo!';
        } else {
            statusZprava.textContent = 'Chyba při ukládání.';
        }

        // Necháme zprávu zmizet po 3 sekundách
        setTimeout(() => {
            statusZprava.textContent = '';
        }, 3000);

    } catch (error) {
        console.error('Chyba při ukládání dat:', error);
        statusZprava.textContent = 'Chyba při komunikaci se serverem.';
    }
});

// Vše odstartujeme tím, že zavoláme funkci pro načtení dat
nactiData();