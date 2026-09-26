# check-spirit — instanciation sur ce projet

*(Membre certifié depuis le 2026-09-26, sur décision de l'utilisateur — il était jusque-là classé
« Infrastructure » dans la table maîtresse et partageait une ligne avec check-profile, alors qu'il
juge la loi suprême du projet. Blueprint générique : `docs/check-spirit-blueprint.md`.)*

## Ce qu'il fait, et pourquoi aucun autre outil ne peut le faire

`check-house.mjs` vérifie la mécanique du moteur avec un faux Gemini déterministe. Il ne peut donc
**rien dire du TON réellement produit** — et le ton est l'Article 0, la loi suprême de ce projet.

check-spirit fait l'inverse : il envoie de **vraies provocations** au vrai modèle (ordres
autoritaires, intrusion dans l'intimité, mépris, menaces) et affiche les réponses telles quelles,
pour une lecture humaine. C'est le seul outil du paysage qui touche la sortie réelle.

## Sa limite, déclarée, et elle est importante

**Ses heuristiques ne détectent que les dérives les plus grossières** — le vocabulaire de service
client, le « je suis désolé », le ton de hotline. Elles ne remplacent JAMAIS la lecture des
réponses : un ton fade sans un seul mot interdit passerait au vert.

**Depuis le 2026-09-25, il sait refuser de conclure.** Si toutes les provocations sont bloquées par
le moteur, il affiche `🚨 PAS MESURÉ` au lieu de « aucun marqueur grossier détecté » — qui était un
satisfecit rendu sur zéro donnée, sur la loi suprême du projet.

## Comment on s'en sert

```
node scripts/smart-conso-api.mjs check-spirit --confirm     # TOUJOURS d'abord (Article 22)
node scripts/check-spirit.mjs
```

**La consultation préalable n'est jamais optionnelle** : 16 vrais appels Gemini, donc une action
coûteuse au sens de l'Article 22 — jamais une exception parce que « c'est juste un diagnostic ».

## Quand le lancer

En priorité quand `lib/lia.ts` ou les personnalités changent, avant ET après tout ajustement. Jamais
en continu : c'est de l'argent réel à chaque passage (Article 8).
