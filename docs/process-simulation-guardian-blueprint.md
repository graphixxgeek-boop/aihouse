# Blueprint — un gardien de process pour une activité coûteuse

*Document générique, réutilisable. Instanciation sur ce projet :
`docs/referentiel/process-simulation-guardian.md`.*

## Quand un tel gardien se justifie

Pas pour toute activité : pour celles dont **un ratage coûte cher et se voit trop tard**. Le critère
est concret — si relancer l'activité après une erreur demande de repayer la totalité de son coût
(une heure de quota d'API, un déploiement, une campagne), alors le contrôle doit avoir lieu AVANT,
pas seulement après.

C'est ce qui distingue ce gardien d'un simple rapport post-mortem : il se consulte en amont, et il
a le droit de **bloquer**.

## Les quatre partis pris

**1. Il se consulte AVANT, pas seulement après.** Un défaut visible dans le scénario avant le
lancement ne devrait jamais être découvert dans le journal après coup. Le gardien lit le plan et
dit ce qui manque, tant que corriger ne coûte encore rien.

**2. Il porte des LEÇONS, pas des règles abstraites.** Chaque leçon qu'il récite a été payée par un
ratage réel et complet. Une leçon sans son incident est une intention ; une leçon qui cite son
incident se respecte. Le champ « vécu » de chaque leçon existe pour ça.

**3. Il BLOQUE par défaut, avec une sortie écrite.** Un gardien qui se contente d'avertir se fait
ignorer le jour où l'on est pressé — c'est-à-dire précisément le jour où il sert. Il refuse donc le
lancement, et le passage en force exige une raison ÉCRITE, archivée avec l'activité. Le coût du
contournement, ce n'est pas un clic : c'est devoir justifier par écrit, ce qui suffit à écarter les
contournements paresseux sans jamais bloquer un cas légitime.

**4. Un champ non renseigné n'est JAMAIS un « non ».** Piège rencontré dès la première version de
ce gardien sur ce projet : un contrôle écrit `(plan) => plan.X === true` renvoie toujours un
booléen, donc « pas encore renseigné » devient « absent » — et le gardien reproche une absence qui
n'en est peut-être pas une. Le contrôle doit lire la valeur BRUTE et distinguer trois états :
rempli / vide / non applicable.

## Le contrôle d'après, et l'anti-doublon

Le gardien vérifie aussi ce qui s'est réellement passé — mais **sans recalculer** ce qu'un autre
outil sait déjà. Il appelle les fonctions d'analyse existantes du journal produit par l'activité et
se contente de confronter leur résultat aux étapes attendues. Un second calcul, même juste le jour
où il est écrit, finira par diverger du premier.

## Sa place dans une organisation qui a un gardien central

Un gardien d'activité est un gardien SECONDAIRE : il garde son verdict, mais ne le livre pas
lui-même au rapport périodique. Le gardien central le relaie. Sans cette règle, chaque gardien
ajoute sa voix et le rapport devient illisible exactement au moment où il grossit.
