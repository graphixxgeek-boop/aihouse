// Appelé par scripts/hooks/post-commit juste après chaque commit réel (2026-09-19, demande
// explicite de l'utilisateur : « je veux un suivi mis à jour en temps réel, pas toutes les 2h-3h »).
// Vérifie IMMÉDIATEMENT, sur le commit qui vient de se faire, s'il a touché du code/de la charte
// réelle sans jamais toucher docs/suivi/ dans ce même commit — jamais un sondage périodique, un
// déclenchement exact sur l'événement qui compte. N'écrit jamais rien lui-même : signale seulement
// (cf. docs/regles-de-travail.md §4), la rédaction reste toujours faite avec le vrai contexte de la
// conversation, jamais reconstituée depuis le seul message de commit.
import { recentCommits, findCommitsMissingSuiviUpdate, findTaskNumberIssues, nextTaskNumber } from "../check-suivi-fidelity.mjs";

const [last] = recentCommits(1);
if (last && findCommitsMissingSuiviUpdate([last]).length) {
  console.error(
    "\n🚨 SUIVI NON MIS À JOUR : le commit " + last.hash.slice(0, 8) + " (\"" + last.subject +
    "\") touche du code ou la charte réelle sans jamais toucher docs/suivi/. " +
    "Ajoute la ligne de suivi maintenant, dans le prochain commit — cf. docs/regles-de-travail.md §4.\n",
  );
}

// Même statut qu'avertit-sans-bloquer que le garde-fou de fraîcheur ci-dessus (2026-09-20, suite du
// compteur de tâches durable) : un numéro dupliqué ou une régression dans docs/suivi/ reste une
// anomalie de document, pas un test de code cassé — même sévérité que la fraîcheur du suivi, jamais
// un pre-commit bloquant pour ça (cohérent avec la distinction déjà actée dans pre-commit lui-même :
// « un test cassé est plus grave qu'une ligne de suivi manquante »).
const numberIssues = findTaskNumberIssues();
if (numberIssues.length) {
  console.error(
    "\n🚨 NUMÉROTATION DES TÂCHES INCOHÉRENTE dans docs/suivi/ : " +
    numberIssues.map((i) => `[${i.type}] n°${i.number} (${i.file})`).join(", ") +
    `. Prochain numéro correct à utiliser : ${nextTaskNumber()} — corrige avant le prochain commit.\n`,
  );
}
