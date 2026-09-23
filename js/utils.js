const CLE_LOCALSTORAGE = "streamflix-liste";
const IMAGE_REMPLACEMENT = "assets/images/affiche-indisponible.png";

// Formatage des données API

export function formaterNote(note) {
  return note ?? "Non noté";
}

export function formaterAnnee(datePremiere) {
  return datePremiere ? datePremiere.slice(0, 4) : "Année inconnue";
}

export function urlAffiche(image) {
  return image?.medium ?? IMAGE_REMPLACEMENT;
}

export function genererEtoiles(note) {
  if (note === null || note === undefined) {
    return { html: "☆☆☆☆☆", texte: "Non noté" };
  }

  const nombreEtoiles = Math.round(note / 2);
  const pleines = "★".repeat(nombreEtoiles);
  const vides = "☆".repeat(5 - nombreEtoiles);

  return { html: pleines + vides, texte: `Note : ${note} sur 10` };
}

// Debounce générique

export function debounce(fonction, delai) {
  let minuteur;
  return (...args) => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => fonction(...args), delai);
  };
}

// Persistance "Ma liste" (localStorage)

export function lireListe() {
  return JSON.parse(localStorage.getItem(CLE_LOCALSTORAGE)) ?? [];
}

export function ecrireListe(liste) {
  localStorage.setItem(CLE_LOCALSTORAGE, JSON.stringify(liste));
}

export function ajouterALaListe(showId) {
  const liste = lireListe();
  if (liste.some((item) => item.showId === showId)) return liste;

  liste.push({ showId, priorite: liste.length + 1 });
  ecrireListe(liste);
  return liste;
}

export function retirerDeLaListe(showId) {
  const liste = lireListe().filter((item) => item.showId !== showId);
  ecrireListe(liste);
  return liste;
}

export function majPriorite(showId, priorite) {
  const liste = lireListe();
  const item = liste.find((entree) => entree.showId === showId);
  if (item) item.priorite = priorite;
  ecrireListe(liste);
  return liste;
}

export function validerPriorite(valeur) {
  const nombre = Number(valeur);
  return Number.isInteger(nombre) && nombre >= 1 && nombre <= 10;
}

export function mettreAJourCompteur() {
  const compteur = document.getElementById("compteur-liste");
  if (compteur) compteur.textContent = lireListe().length;
}
