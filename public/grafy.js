// ===================================================================
// ZDE MĚŇ HODNOTY PRO GRAFY (čísla od 1 do 10)
// ===================================================================
const DATA = {
    telo: {
        "Váha": 1,
        "Míry": 1,
        "Body Fat %": 1,
        "Síla": 1
    },
    prace: {
        "Příjem": 1,
        "Časová náročnost": 1,
        "Remote": 1,
        "Zábavnost": 1
    },
    jazyk: {
        "Slovní zásoba": 1,
        "Komunikace": 1,
        "Časování": 1,
        "Předložky": 1
    }
};
// ===================================================================
// KONEC ÚPRAV DAT
// ===================================================================


// Funkce, která nakreslí jeden radarový graf
const nakresliGraf = (idElementu, dataObjekt) => {
    const ctx = document.getElementById(idElementu).getContext('2d');
    
    const labels = Object.keys(dataObjekt);
    const values = Object.values(dataObjekt);

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aktuální stav',
                data: values,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 1 } // Stupnice od 0 do 10
                }
            },
            plugins: {
                legend: { display: false } // Skryjeme legendu, je zbytečná
            }
        }
    });
};

// Zavoláme funkci pro každý graf a předáme jí správná data
document.addEventListener('DOMContentLoaded', () => {
    nakresliGraf('graf-telo', DATA.telo);
    nakresliGraf('graf-prace', DATA.prace);
    nakresliGraf('graf-jazyk', DATA.jazyk);
});