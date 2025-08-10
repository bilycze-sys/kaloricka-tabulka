// Načteme si knihovnu Express, kterou jsme nainstalovali.
const express = require('express');
// Načteme si knihovnu pro práci se soubory.
const fs = require('fs');

// Vytvoříme si aplikaci (server).
const app = express();
// Nastavíme port, na kterém server poběží.
const PORT = process.env.PORT || 3000;

// Řekneme serveru, aby rozuměl datům ve formátu JSON,
// která mu přijdou z prohlížeče. Je to důležité pro ukládání.
app.use(express.json());

// Tato část kódu zajistí, že server bude umět posílat soubory z nějaké složky.
// Budeme to potřebovat ve fázi 3 pro HTML a CSS. Složka se bude jmenovat 'public'.
app.use(express.static('public'));


// --- Definujeme, co má server dělat ---

// 1. Když se někdo zeptá na adresu "/api/data" (pro ZÍSKÁNÍ dat kalorií)
app.get('/api/data', (req, res) => {
  // Přečti soubor 'data.json'
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) { // Pokud nastane chyba, dej vědět
      console.error(err);
      res.status(500).send('Server udělal chybu při čtení dat.');
      return;
    }
    // Pokud je vše OK, pošli data z souboru jako odpověď
    res.json(JSON.parse(data));
  });
});

// 2. Když někdo pošle data na adresu "/api/data" (pro ULOŽENÍ dat kalorií)
app.post('/api/data', (req, res) => {
  // Data, která přišla z prohlížeče, jsou v 'req.body'.
  const newData = req.body;

  // Zapíšeme tato nová data do souboru 'data.json'
  fs.writeFile('data.json', JSON.stringify(newData, null, 2), (err) => {
    if (err) { // Pokud nastane chyba, dej vědět
      console.error(err);
      res.status(500).send('Server udělal chybu při ukládání dat.');
      return;
    }
    // Pokud je vše OK, pošli zprávu o úspěchu
    res.status(200).send('Data úspěšně uložena.');
  });
});

// 3. Endpointy pro data grafů (ZÍSKÁNÍ)
app.get('/api/grafy-data', (req, res) => {
  fs.readFile('grafy-data.json', 'utf8', (err, data) => {
    if (err) {
      // Pokud soubor neexistuje, vrať prázdné pole, aby aplikace nespadla
      if (err.code === 'ENOENT') return res.json([]);
      res.status(500).send('Chyba při čtení dat grafů.');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// 4. Endpointy pro data grafů (ULOŽENÍ)
app.post('/api/grafy-data', (req, res) => {
  const newData = req.body;
  fs.writeFile('grafy-data.json', JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      res.status(500).send('Chyba při ukládání dat grafů.');
      return;
    }
    res.status(200).send('Data grafů úspěšně uložena.');
  });
});

// --- Konec definic ---

// Nakonec server spustíme, aby začal "poslouchat" na daném portu.
app.listen(PORT, () => {
  console.log(`Server naslouchá na adrese http://localhost:${PORT}`);
});

// 2. Když někdo pošle data na adresu "/api/data" (pro ULOŽENÍ dat)
app.post('/api/data', (req, res) => {
  // Data, která přišla z prohlížeče, jsou v 'req.body'.
  const newData = req.body;

  // Zapíšeme tato nová data do souboru 'data.json'
  fs.writeFile('data.json', JSON.stringify(newData, null, 2), (err) => {
    if (err) { // Pokud nastane chyba, dej vědět
      console.error(err);
      res.status(500).send('Server udělal chybu při ukládání dat.');
      return;
    }
    // Pokud je vše OK, pošli zprávu o úspěchu
    res.status(200).send('Data úspěšně uložena.');
  });
});

// --- Konec definic ---

// Nakonec server spustíme, aby začal "poslouchat" na daném portu.
app.listen(PORT, () => {
  console.log(`Server naslouchá na adrese http://localhost:${PORT}`);
});