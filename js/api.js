const URL_BASE_API = "https://api.tvmaze.com";

async function appelApi(url, options) {
  let reponse;

  try {
    reponse = await fetch(url, options);
  } catch (erreurReseau) {
    throw new Error("Erreur réseau : impossible de joindre le serveur.");
  }

  if (!reponse.ok) {
    throw new Error(`Erreur HTTP ${reponse.status}`);
  }

  return reponse.json();
}

export async function getShows() {
  return appelApi(`${URL_BASE_API}/shows?page=0`);
}

export async function getShowById(id) {
  return appelApi(`${URL_BASE_API}/shows/${id}`);
}

export async function searchShows(texte) {
  return appelApi(
    `${URL_BASE_API}/search/shows?q=${encodeURIComponent(texte)}`,
  );
}

export async function sendSelection(payload) {
  return appelApi("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
