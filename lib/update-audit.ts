/** Checklist of the latest user request; descriptive only. */
export const updateAudit=[
  {
    "point": "1",
    "title": "Conversation",
    "check": "Ouverture froide et méfiante contrôlée ; personnalité, état et dernière intervention fournis au modèle. Les reformulations exactes et longues réponses lexicalement quasi identiques sont contrôlées."
  },
  {
    "point": "2",
    "title": "Enquête",
    "check": "Quatre supports variables, observation avant débrief, dossier final après recoupement. Registres story/turn/evidence partagés."
  },
  {
    "point": "3",
    "title": "Admin",
    "check": "Référentiel révisé en version 36 ; durée obsolète corrigée, section des durées calculée depuis visualTiming et checklist consultable."
  },
  {
    "point": "4",
    "title": "Organisation",
    "check": "Présentation temporelle isolée dans playback, comptage dans evidence, texte dans ProgressiveText ; pas de réécriture risquée du moteur."
  },
  {
    "point": "5",
    "title": "Robustesse",
    "check": "Transaction, verrou, cache, session périmée, besoins divergents, sommeil et trajets vérifiés par régression ; aucun test fini ne couvre tous les textes possibles."
  },
  {
    "point": "6",
    "title": "Économie API",
    "check": "Une inférence pour un tour de réflexion partagé, zéro pour les événements locaux, sommeil, reset, cache et animations. Audit du budget conservé."
  },
  {
    "point": "7",
    "title": "Variété",
    "check": "Nouvelle graine, ordre des preuves mélangé, variante d’ambiance différente de la précédente et souvenirs individuels variés ; récit généré contextualisé."
  },
  {
    "point": "8a",
    "title": "Répliques locales limitées",
    "check": "Ouverture, soins urgents, rêves et certains événements restent locaux et variés. La conversation générale conserve Gemini."
  },
  {
    "point": "8b",
    "title": "Qualité préservée",
    "check": "Lia incisive et Noé concret ; correctifs conservateurs plutôt que remplacement général des dialogues."
  },
  {
    "point": "9",
    "title": "Répétitions et identités",
    "check": "Empreinte du texte public commune, indépendante du trajet et du locuteur ; échos lexicaux conservateurs et thèmes épuisés. Identités et accords contrôlés. Pas de garantie infinie sur toutes les paraphrases."
  },
  {
    "point": "10",
    "title": "Sens et état",
    "check": "Pièce réelle imposée au modèle, objets distants nommés avec leur pièce, données de perception partagées, sommeil silencieux et actions validées."
  },
  {
    "point": "11",
    "title": "Extérieur",
    "check": "Façades, trottoir, route, lampadaires, voiture bleu-gris et passage piéton figés ; jardin intégré. Descriptions adaptées à ces éléments."
  },
  {
    "point": "12",
    "title": "Plante",
    "check": "Pot avec terreau et rebord, tige et cinq feuilles larges avec nervures ; inclinaison adaptée à la vue du dessus."
  },
  {
    "point": "13",
    "title": "Statut permanent",
    "check": "Cadre distinct visible au repos ; texte demandé en gris sur fond très clair, pleine largeur ; une erreur reste annoncée séparément."
  },
  {
    "point": "14",
    "title": "Corrections précédentes",
    "check": "Régression des propositions, refus, rêves, sommeil, télécommande, besoins, affection, jardin, jauges et concurrence conservée."
  },
  {
    "point": "15",
    "title": "Noms des pièces",
    "check": "Retirés du dessin ; les commandes, journaux et popups gardent leurs libellés utiles."
  },
  {
    "point": "16",
    "title": "Second bouton",
    "check": "Même commande Générer des actions sous le cadre ; un seul verrou global empêche le double tour."
  },
  {
    "point": "17",
    "title": "Réserves visibles",
    "check": "Disparition de deux secondes, retour puis fondu lent et lueur bleu clair progressive ; horloge visuelle suspendue en pause/invisibilité."
  },
  {
    "point": "18a",
    "title": "Surprise",
    "check": "Uniquement pour les habitants éveillés effectivement dans la cuisine ; curiosité/tension dégressives, pensée distincte et souvenir heure/lieu, effets idempotents."
  },
  {
    "point": "18b",
    "title": "Écran du bureau",
    "check": "Lignes binaires, ligne active claire, curseur orangé et balayage ; reste animé après acquisition du relevé. Animation distincte de la tv."
  },
  {
    "point": "19",
    "title": "Libellés des boutons",
    "check": "Les deux commandes deviennent Générer des actions ; en pause conserve son sens et son style animé gris."
  },
  {
    "point": "20a",
    "title": "Texte progressif",
    "check": "Un caractère Unicode toutes les 24 ms, y compris les départs. Composant isolé, pause/invisibilité prises en compte, historique lisible instantanément."
  },
  {
    "point": "20b",
    "title": "Déplacements",
    "check": "Bloc distinct avec origine→destination et heure, annoncé avant le déplacement physique, y compris inspection du couloir."
  },
  {
    "point": "21",
    "title": "Dossier",
    "check": "Nombre de preuves distinctes, objets observés, constats généraux et rêves consignés ; comptage commun à la légende, mis à jour avec le tour."
  },
  {
    "point": "22",
    "title": "Publication",
    "check": "Compilation et contrôles avant publication ; aucune commande reset déclenchée par le déploiement ou le rechargement."
  }
] as const;
