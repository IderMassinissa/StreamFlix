import { getShows, getShowById, sendSelection } from "./api.js";
import {
  urlAffiche,
  formaterAnnee,
  formaterNote,
  genererEtoiles,
  debounce,
  lireListe,
  ecrireListe,
  ajouterALaListe,
  retirerDeLaListe,
  majPriorite,
  validerPriorite,
  mettreAJourCompteur,
} from "./utils.js";

mettreAJourCompteur();

// Menu hamburger, commun aux 3 pages
const boutonMenu = document.getElementById("bouton-menu");
const menuPrincipal = document.getElementById("menu-principal");

if (boutonMenu && menuPrincipal) {
  boutonMenu.addEventListener("click", () => {
    const ouvert = menuPrincipal.classList.toggle("ouvert");
    boutonMenu.setAttribute("aria-expanded", ouvert);
  });
}

// Page catalogue
const grille = document.getElementById("grille-catalogue");

if (grille) {
  const statut = document.getElementById("statut-catalogue");
  const champRecherche = document.getElementById("recherche-titre");
  const selectGenre = document.getElementById("filtre-genre");
  const selectTri = document.getElementById("tri-catalogue");

  let toutesLesSeries = [];

  function creerCarte(serie) {
    return `
      <article class="carte" data-id="${serie.id}">
        <img src="${urlAffiche(serie.image)}" alt="Affiche de ${serie.name}" loading="lazy">
        <h3>${serie.name}</h3>
        <p>${serie.genres.join(", ") || "Genre non renseigné"}</p>
        <p>${formaterAnnee(serie.premiered)}</p>
        <p>${formaterNote(serie.rating?.average)}</p>
        <a href="serie.html?id=${serie.id}">Voir</a>
      </article>`;
  }

  function afficherChargement() {
    grille.innerHTML =
      '<p class="indicateur-chargement">Chargement du catalogue...</p>';
  }

  function afficherVide() {
    grille.innerHTML =
      '<p class="etat-vide">Aucune série ne correspond à votre recherche.</p>';
  }

  function afficherErreur() {
    grille.innerHTML =
      '<p class="etat-erreur">Impossible de charger le catalogue. Vérifiez votre connexion.</p>';
  }

  function annoncerResultats(nombre) {
    statut.textContent = `${nombre} série${nombre > 1 ? "s" : ""} trouvée${nombre > 1 ? "s" : ""}`;
  }

  function peuplerGenres(series) {
    const genres = [...new Set(series.flatMap((s) => s.genres))].sort();
    selectGenre.innerHTML =
      '<option value="tous">Tous les genres</option>' +
      genres.map((g) => `<option value="${g}">${g}</option>`).join("");
  }

  function trier(liste, critere) {
    const copie = [...liste];
    switch (critere) {
      case "note-desc":
        return copie.sort(
          (a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1),
        );
      case "note-asc":
        return copie.sort(
          (a, b) => (a.rating?.average ?? -1) - (b.rating?.average ?? -1),
        );
      case "annee-desc":
        return copie.sort((a, b) =>
          (b.premiered ?? "").localeCompare(a.premiered ?? ""),
        );
      case "annee-asc":
        return copie.sort((a, b) =>
          (a.premiered ?? "").localeCompare(b.premiered ?? ""),
        );
      default:
        return copie;
    }
  }

  function appliquerFiltres() {
    const recherche = champRecherche.value.trim().toLowerCase();
    const genre = selectGenre.value;

    let resultat = toutesLesSeries.filter((serie) =>
      serie.name.toLowerCase().includes(recherche),
    );

    if (genre !== "tous") {
      resultat = resultat.filter((serie) => serie.genres.includes(genre));
    }

    resultat = trier(resultat, selectTri.value);

    if (resultat.length === 0) {
      afficherVide();
    } else {
      grille.innerHTML = resultat.map(creerCarte).join("");
    }

    annoncerResultats(resultat.length);
  }

  async function initCatalogue() {
    afficherChargement();
    try {
      toutesLesSeries = await getShows();
      peuplerGenres(toutesLesSeries);
      appliquerFiltres();
    } catch (erreur) {
      console.error(erreur);
      afficherErreur();
    }
  }

  champRecherche.addEventListener("input", debounce(appliquerFiltres, 300));
  selectGenre.addEventListener("change", appliquerFiltres);
  selectTri.addEventListener("change", appliquerFiltres);

  initCatalogue();
}

// Page fiche détaillée
const contenuFiche = document.getElementById("contenu-fiche");

if (contenuFiche) {
  const statutFiche = document.getElementById("statut-fiche");
  const boutonAjouter = document.getElementById("bouton-ajouter-liste");

  function afficherErreurFiche(message) {
    statutFiche.textContent = message;
    contenuFiche.innerHTML = `<p class="etat-erreur">${message}</p>`;
    boutonAjouter.hidden = true;
  }

  function afficherFiche(serie) {
    const { html: etoiles, texte: texteNote } = genererEtoiles(
      serie.rating?.average,
    );

    contenuFiche.innerHTML = `
      <img src="${urlAffiche(serie.image)}" alt="Affiche de ${serie.name}">
      <h2>${serie.name}</h2>
      <p aria-hidden="true">${etoiles}</p>
      <p>${texteNote}</p>
      <p>${serie.genres.join(", ") || "Genre non renseigné"}</p>
      <p>Statut : ${serie.status ?? "Non renseigné"}</p>
      <p>Chaîne : ${serie.network?.name ?? "Non renseignée"}</p>
      <p>Première diffusion : ${formaterAnnee(serie.premiered)}</p>
      <div>${serie.summary ?? "<p>Résumé non disponible.</p>"}</div>
    `;

    statutFiche.textContent = `Fiche de ${serie.name} chargée.`;
    boutonAjouter.hidden = false;
    boutonAjouter.onclick = () => {
      ajouterALaListe(serie.id);
      mettreAJourCompteur();
      boutonAjouter.textContent = "Ajouté !";
      boutonAjouter.disabled = true;
    };
  }

  async function initFiche() {
    boutonAjouter.hidden = true;
    const idParam = new URLSearchParams(window.location.search).get("id");

    if (!idParam) {
      afficherErreurFiche("Aucun identifiant de série fourni dans l'URL.");
      return;
    }

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      afficherErreurFiche("Identifiant de série invalide.");
      return;
    }

    statutFiche.textContent = "Chargement de la fiche...";
    contenuFiche.innerHTML =
      '<p class="indicateur-chargement">Chargement...</p>';

    try {
      const serie = await getShowById(id);
      afficherFiche(serie);
    } catch (erreur) {
      console.error(erreur);
      afficherErreurFiche(
        "Cette série n'existe pas ou n'a pas pu être chargée.",
      );
    }
  }

  initFiche();
}

// Page Ma liste
const contenuListe = document.getElementById("contenu-liste");

if (contenuListe) {
  const boutonEnvoyer = document.getElementById("bouton-envoyer-selection");
  const statutEnvoi = document.getElementById("statut-envoi");

  function creerLigneListe(serie, priorite) {
    return `
      <article class="carte" data-id="${serie.id}">
        <img src="${urlAffiche(serie.image)}" alt="Affiche de ${serie.name}">
        <h3>${serie.name}</h3>
        <label for="priorite-${serie.id}">Priorité</label>
        <input type="number" id="priorite-${serie.id}" min="1" max="10" value="${priorite}">
        <button type="button" class="bouton-supprimer" data-id="${serie.id}">Supprimer</button>
      </article>`;
  }

  async function chargerListe() {
    const liste = lireListe();

    if (liste.length === 0) {
      contenuListe.innerHTML =
        '<p class="etat-vide">Votre liste est vide pour l\'instant.</p>';
      return;
    }

    contenuListe.innerHTML =
      '<p class="indicateur-chargement">Chargement...</p>';

    try {
      const series = await Promise.all(
        liste.map((item) => getShowById(item.showId)),
      );

      contenuListe.innerHTML = series
        .map((serie, index) => creerLigneListe(serie, liste[index].priorite))
        .join("");

      contenuListe.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener("change", () => {
          const id = Number(input.id.replace("priorite-", ""));
          if (validerPriorite(input.value)) {
            majPriorite(id, Number(input.value));
          } else {
            input.value = 1;
            majPriorite(id, 1);
          }
        });
      });

      contenuListe.querySelectorAll(".bouton-supprimer").forEach((bouton) => {
        bouton.addEventListener("click", () => {
          retirerDeLaListe(Number(bouton.dataset.id));
          mettreAJourCompteur();
          chargerListe();
        });
      });
    } catch (erreur) {
      console.error(erreur);
      contenuListe.innerHTML =
        '<p class="etat-erreur">Impossible de charger le détail de votre liste.</p>';
    }
  }

  boutonEnvoyer.addEventListener("click", async () => {
    const liste = lireListe();

    if (liste.length === 0) {
      statutEnvoi.textContent = "Votre liste est vide, rien à envoyer.";
      return;
    }

    const payload = {
      userId: 1,
      date: new Date().toISOString().slice(0, 10),
      shows: liste.map((item) => ({
        showId: item.showId,
        priority: item.priorite,
      })),
    };

    statutEnvoi.textContent = "Envoi en cours...";

    try {
      await sendSelection(payload);
      statutEnvoi.textContent = "Sélection envoyée avec succès.";
    } catch (erreur) {
      console.error(erreur);
      statutEnvoi.textContent = "Erreur lors de l'envoi. Réessayez plus tard.";
    }
  });

  chargerListe();
}
