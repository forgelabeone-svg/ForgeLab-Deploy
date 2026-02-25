/*
  =========================================================
  FutureTech Lab - script.js (Vanilla JavaScript)
  ---------------------------------------------------------
  Ez a fájl kezeli:
  1) Az interaktív idővonal dinamikus kirajzolását
  2) A modal ablak megnyitását/zárását
  3) A Dark/Light mód váltást
  4) A Random Tech Fact gomb működését
  5) A scroll (reveal) animációkat
  =========================================================
*/

// ------------------------------
// 1) IDŐVONAL ADATOK (1800–2050)
// ------------------------------
const timelineEvents = [
  {
    year: 1800,
    title: "Volta és az első elektromos elem",
    description:
      "Alessandro Volta bemutatja a volta-oszlopot, az első folyamatos áramforrást.",
    image: "Placeholder kép: Volta-oszlop",
    importance:
      "Megteremtette az elektromosság gyakorlati felhasználásának alapját, ami nélkül a modern elektronika nem létezne."
  },
  {
    year: 1837,
    title: "Az elektromos távíró",
    description:
      "Samuel Morse és társai elterjesztik a távírót, amely drámaian felgyorsította a kommunikációt.",
    image: "Placeholder kép: Távíró készülék",
    importance:
      "Elsőként tette lehetővé a gyors, távoli információátvitelt, megalapozva a globális hálózati gondolkodást."
  },
  {
    year: 1876,
    title: "A telefon megszületése",
    description:
      "Alexander Graham Bell szabadalmaztatja a telefont, és az emberi hang átvihetővé válik nagy távolságokra.",
    image: "Placeholder kép: Korai telefon",
    importance:
      "Új korszakot nyitott a személyes kommunikációban, és alapot adott a modern telekommunikációnak."
  },
  {
    year: 1903,
    title: "A rádió korszaka",
    description:
      "A vezeték nélküli kommunikáció kereskedelmi és társadalmi jelentősége világszerte növekedni kezd.",
    image: "Placeholder kép: Rádió adó",
    importance:
      "A rádió a tömeges információterjesztés egyik első platformja lett, előfutára a modern médiahálózatoknak."
  },
  {
    year: 1947,
    title: "A tranzisztor feltalálása",
    description:
      "A Bell Labs kutatói létrehozzák a tranzisztort, amely leváltja a vákuumcsöveket.",
    image: "Placeholder kép: Tranzisztor",
    importance:
      "A mikroelektronika alapköve: kisebb, gyorsabb, megbízhatóbb számítógépek és eszközök születtek."
  },
  {
    year: 1969,
    title: "ARPANET indulása",
    description:
      "Elindul az ARPANET, az internet elődje, amely több kutatóintézetet kötött össze.",
    image: "Placeholder kép: Korai hálózati csomópont",
    importance:
      "Létrehozta az internetes kommunikáció alaplogikáját: csomagkapcsolt hálózat, elosztott rendszer."
  },
  {
    year: 1981,
    title: "A személyi számítógép terjedése",
    description:
      "Az otthoni és irodai PC-k szélesebb körben elérhetővé válnak.",
    image: "Placeholder kép: Korai PC",
    importance:
      "A számítástechnika kilépett a laborokból, és hétköznapi eszközzé vált milliók számára."
  },
  {
    year: 1991,
    title: "World Wide Web nyilvánossá válása",
    description:
      "Tim Berners-Lee rendszerével a web bárki számára elérhető platformmá válik.",
    image: "Placeholder kép: Korai weboldal",
    importance:
      "A web demokratizálta az információhozzáférést, és új digitális gazdaságot teremtett."
  },
  {
    year: 2007,
    title: "Az okostelefon-forradalom",
    description:
      "Az érintőkijelzős okostelefonok új standardot teremtenek a mobil számítástechnikában.",
    image: "Placeholder kép: Okostelefon",
    importance:
      "A zsebünkbe költöztette az internetet, és teljesen átalakította a mindennapi digitális életet."
  },
  {
    year: 2023,
    title: "Generatív AI mainstream térnyerése",
    description:
      "A nyelvi modellek és képgeneráló rendszerek tömegesen megjelennek a munkában és oktatásban.",
    image: "Placeholder kép: AI interfész",
    importance:
      "Új ember-gép együttműködési modellt hozott, felgyorsítva a tartalomkészítést és problémamegoldást."
  },
  {
    year: 2035,
    title: "Predikció: Széles körű kvantum-szolgáltatások",
    description:
      "A kvantumszámítás speciális iparági problémákban (anyagkutatás, optimalizálás) gyakorlati értéket ad.",
    image: "Placeholder kép: Kvantum processzor",
    importance:
      "Új számítási paradigma, amely bizonyos feladatoknál drasztikusan lerövidítheti az elemzési időt."
  },
  {
    year: 2050,
    title: "Predikció: Emberközpontú, autonóm technológiai ökoszisztéma",
    description:
      "A városi infrastruktúra, egészségügy és energia-rendszerek intelligensen, összehangoltan működnek.",
    image: "Placeholder kép: Futurisztikus smart city",
    importance:
      "A technológia fókusza a fenntarthatóságra és az életminőség javítására helyeződik át globális szinten."
  }
];

// ------------------------------
// 2) RANDOM TECH FACT ADATOK
// ------------------------------
const techFacts = [
  "Az első 1 GB-os merevlemez (1980) kb. 250 kg volt.",
  "A 'bug' kifejezés egyik híres esete egy számítógépbe szorult molylepkéhez köthető.",
  "Az internetes forgalom nagy része ma már videó alapú tartalom.",
  "A GPS rendszert eredetileg katonai célra fejlesztették.",
  "A mai okostelefonok számítási teljesítménye sokszorosa az Apollo-program számítógépeinek.",
  "A nyílt forráskódú szoftverek kulcsszerepet játszanak az internet infrastruktúrájában.",
  "A száloptika fényimpulzusokkal továbbít adatot rendkívül gyorsan és stabilan.",
  "Az AI modellek tanítása hatalmas számítási erőforrást és optimalizálást igényel."
];

// ------------------------------
// 3) SEGÉD VÁLTOZÓK (DOM ELEMEK)
// ------------------------------
const timelineList = document.getElementById("timelineList");
const eventCount = document.getElementById("eventCount");

const eventModal = document.getElementById("eventModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalYear = document.getElementById("modalYear");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalImportance = document.getElementById("modalImportance");
const modalImagePlaceholder = document.getElementById("modalImagePlaceholder");

const themeToggle = document.getElementById("themeToggle");
const factBtn = document.getElementById("factBtn");
const factText = document.getElementById("factText");
const yearNow = document.getElementById("yearNow");

// ------------------------------
// 4) IDŐVONAL KIRAJZOLÁSA
// ------------------------------
function renderTimeline() {
  // Töröljük az esetleges korábbi tartalmat
  timelineList.innerHTML = "";

  // Minden eseményből készítünk egy kattintható "kártyát"
  timelineEvents.forEach((event) => {
    const item = document.createElement("article");
    item.className = "timeline-item reveal";

    item.innerHTML = `
      <div class="timeline-dot" aria-hidden="true"></div>
      <button class="timeline-card" type="button" aria-label="${event.year} - ${event.title}">
        <p class="timeline-year">${event.year}</p>
        <h3>${event.title}</h3>
        <p>${event.description}</p>
      </button>
    `;

    // Kattintáskor megnyitjuk a modalt az adott esemény részleteivel
    const cardButton = item.querySelector(".timeline-card");
    cardButton.addEventListener("click", () => openModal(event));

    timelineList.appendChild(item);
  });

  // Frissítjük az események számát a hero kártyán
  eventCount.textContent = String(timelineEvents.length);
}

// ------------------------------
// 5) MODAL NYITÁS / ZÁRÁS
// ------------------------------
function openModal(eventData) {
  modalYear.textContent = eventData.year;
  modalTitle.textContent = eventData.title;
  modalDescription.textContent = eventData.description;
  modalImportance.textContent = eventData.importance;
  modalImagePlaceholder.innerHTML = `<span>${eventData.image}</span>`;

  eventModal.classList.add("open");
  eventModal.setAttribute("aria-hidden", "false");

  // Háttér görgetés letiltása modal nyitáskor
  document.body.style.overflow = "hidden";
}

function closeModal() {
  eventModal.classList.remove("open");
  eventModal.setAttribute("aria-hidden", "true");

  // Háttér görgetés visszaengedése
  document.body.style.overflow = "";
}

// Gombbal zárás
closeModalBtn.addEventListener("click", closeModal);

// Overlay-re kattintva zárás
eventModal.addEventListener("click", (e) => {
  const target = e.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closeModal();
  }
});

// ESC billentyűvel zárás
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && eventModal.classList.contains("open")) {
    closeModal();
  }
});

// ------------------------------
// 6) DARK / LIGHT MODE TOGGLE
// ------------------------------
function applyTheme(theme) {
  // Ha "light", akkor body.light osztályt adunk hozzá
  // Egyébként marad a dark (alap)
  if (theme === "light") {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }

  // Gomb szövegének frissítése
  themeToggle.textContent = theme === "light" ? "☀️ Light / 🌙 Dark" : "🌙 Dark / ☀️ Light";
}

function initTheme() {
  // Elmentett téma betöltése (ha van)
  const savedTheme = localStorage.getItem("ftl-theme");
  applyTheme(savedTheme || "dark");
}

themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light");
  const nextTheme = isLight ? "dark" : "light";
  localStorage.setItem("ftl-theme", nextTheme);
  applyTheme(nextTheme);
});

// ------------------------------
// 7) RANDOM TECH FACT
// ------------------------------
function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * techFacts.length);
  factText.textContent = techFacts[randomIndex];
}

factBtn.addEventListener("click", showRandomFact);

// ------------------------------
// 8) SCROLL REVEAL ANIMÁCIÓ
// ------------------------------
function initScrollReveal() {
  // IntersectionObserver: figyeli, mikor érnek a viewportba az elemek
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Ha már egyszer megjelent, nem kell tovább figyelni
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  // Minden .reveal osztályú elemet regisztrálunk
  const revealItems = document.querySelectorAll(".reveal");
  revealItems.forEach((item) => observer.observe(item));
}

// ------------------------------
// 9) INIT (oldal betöltésekor)
// ------------------------------
function init() {
  renderTimeline();
  initTheme();
  initScrollReveal();

  // Footer aktuális év
  yearNow.textContent = String(new Date().getFullYear());
}

// A script futtatása
init();