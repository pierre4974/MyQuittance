# Mes quittances

Application web en français, prête à déposer dans GitHub. Aucun serveur applicatif, aucune dépendance JavaScript à installer. Fonctionne sur ordinateur et téléphone.

## Ce qui est inclus

- Tableau de bord mensuel : attendu, reçu, reste à encaisser.
- Locations/baux, coordonnées du bailleur et des locataires, devise.
- Paiements multiples et partiels, affectés à un mois.
- Prévisualisation puis émission d'une quittance uniquement après règlement intégral.
- PDF A4 téléchargeable, sans bibliothèque distante de génération.
- Documents figés : le profil ou le locataire modifié plus tard ne change pas une ancienne quittance.
- Google Drive : enregistrement des dossiers et archivage explicite des PDF.
- Export/import JSON et jeu d'exemples fictifs.
- Tests automatisés des calculs, documents et scénarios Drive simulés.

## 1. Essayer sur votre ordinateur

Installez Python 3 si nécessaire. Ouvrez un terminal dans le dossier décompressé :

```sh
python3 -m http.server 3000 --directory docs
```

Ouvrez **http://localhost:3000**. Ne double-cliquez pas sur index.html : les modules JavaScript nécessitent un serveur HTTP.

Dans Paramètres, « Charger un exemple » permet un essai avec des données fictives. Le mode local conserve les données dans ce navigateur. Elles ne sont pas encore sur Drive. Exportez régulièrement un JSON ; effacer les données du navigateur efface cette copie locale.

## 2. Mettre le code sur GitHub et publier

1. Créez un dépôt GitHub, par exemple `mes-quittances`.
2. Téléversez le contenu du dossier `quittances-app` décompressé (pas l'archive ZIP) dans le dépôt. Gardez le dossier `docs` et son contenu.
3. Dans **Settings → Pages**, choisissez **Deploy from a branch**, branche **main**, dossier **/docs**, puis **Save**.
4. Attendez le déploiement. L'adresse affichée sera normalement `https://VOTRE-PSEUDO.github.io/mes-quittances/`.

Avec Git, depuis le dossier décompressé :

```sh
git init
git add .
git commit -m "Première version de Mes quittances"
git branch -M main
git remote add origin https://github.com/VOTRE-PSEUDO/mes-quittances.git
git push -u origin main
```

GitHub Pages sert une interface généralement publique : cela ne rend pas votre Drive public. Les données ne sont pas intégrées au code et ne doivent jamais être commitées. L'accès Pages aux dépôts privés dépend de votre offre GitHub. Cette version n'a pas de portail locataire ni de contrôle d'accès privé à la page elle-même.

## 3. Connecter votre Google Drive

La configuration s'effectue une fois dans votre compte Google, après avoir déterminé l'adresse de votre site.

### A. Créer un projet Google

1. Ouvrez https://console.cloud.google.com/ et créez un projet, par exemple **Mes quittances**.
2. Dans **APIs et services → Bibliothèque**, recherchez **Google Drive API** et activez-la.
3. Ouvrez **Google Auth Platform** (ou **Écran de consentement OAuth**, selon l'interface).
4. Renseignez le nom de l'application, votre email d'assistance et votre email de contact.
5. Pour un compte Gmail personnel, choisissez une audience **External / Externe**. En mode test, ajoutez votre propre adresse Google à la liste des **Test users / Utilisateurs test**. Pour un compte Workspace, une audience interne dépend de votre organisation.
6. Dans **Data Access / Accès aux données**, ajoutez la portée :

```
https://www.googleapis.com/auth/drive.file
```

L'application demande uniquement l'accès aux fichiers qu'elle crée ou que vous lui autorisez. Elle ne demande pas un accès global à votre Drive.

### B. Créer l'identifiant OAuth

1. Dans **Clients → Create client / Créer un client** (ou **Identifiants → Créer des identifiants → ID client OAuth**), choisissez **Application Web**.
2. Dans **Origines JavaScript autorisées**, ajoutez :
   - `http://localhost:3000` pour vos essais locaux ;
   - `https://VOTRE-PSEUDO.github.io` pour GitHub Pages.
3. Une origine ne contient **pas** le nom du dépôt ni de chemin. Ne mettez donc pas `/mes-quittances/` dans l'origine.
4. Si vous utilisez un domaine personnalisé, ajoutez son origine HTTPS exacte.
5. Cette application utilise la fenêtre OAuth Google et n'exige pas d'URI de redirection configurée.
6. Copiez l'**ID client** se terminant par `.apps.googleusercontent.com`. N'utilisez pas le secret client.

### C. Connecter dans l'application

1. Ouvrez votre application → **Paramètres**.
2. Collez l'ID client dans **Connexion Google Drive**, puis enregistrez.
3. Cliquez **Connecter Google Drive**, sélectionnez votre compte et acceptez l'autorisation demandée.
4. À la première connexion, votre espace Drive est vide. Renseignez le profil et créez vos vraies locations.
5. Le dossier **Mes quittances** est créé automatiquement lors du premier enregistrement.

L'ID client est public. Pour qu'il soit préconfiguré sur chaque appareil, vous pouvez le mettre dans `docs/config.js`. **Ne placez aucun secret client, mot de passe ou jeton d'accès dans GitHub.**

La connexion charge le contenu de Drive et ne fusionne jamais automatiquement les données locales, afin d'éviter les doublons ou l'envoi d'exemples. Pour transférer des données locales réelles : exporter JSON en mode local, se connecter à Drive, importer ce JSON. L'import remplace l'état actif après confirmation.

En mode test, une réautorisation périodique peut être nécessaire. Les jetons d'accès restent uniquement en mémoire et expirent ; reconnectez-vous quand l'application le demande. Un rechargement de la page redémarre en mode local ; reconnectez Drive pour retrouver les données distantes. L'autorisation peut être retirée depuis https://myaccount.google.com/permissions.

## 4. Votre premier mois

1. Paramètres : renseigner le bailleur et la devise.
2. Locations : ajouter un dossier par bail (logement, occupants, loyer, charges, premier mois).
3. Paiements : enregistrer la somme effectivement reçue et le mois concerné.
4. Vue d'ensemble : choisir ce mois puis **Préparer la quittance**.
5. Vérifier les informations et cliquer **Émettre la quittance**.
6. Quittances : télécharger le PDF et, si connecté, cliquer **Archiver sur Drive**.

L'enregistrement du dossier de quittance et l'archivage de son PDF sont deux actions distinctes. Un PDF peut être régénéré à l'identique à partir du dossier enregistré. Cliquer de nouveau sur l'archivage réutilise le PDF déjà présent, dans un usage séquentiel.

## 5. Stockage et limites importantes

- Usage individuel. Ne travaillez pas dans plusieurs onglets/appareils simultanément.
- Les données Google sont dans des fichiers JSON privés du dossier « Mes quittances ». Chaque modification crée une nouvelle version immuable ; les anciennes versions restent disponibles. Ne les supprimez pas à la main : elles constituent la chaîne de versions et occupent progressivement de l'espace Drive.
- L'application vérifie la version distante avant d'enregistrer. Si deux écritures concurrentes créent deux branches, elle bloque la poursuite plutôt que de choisir silencieusement une version. Ce n'est pas une base de données transactionnelle ni un système multiutilisateur.
- En cas de conflit : conservez et téléchargez les JSON du dossier Drive. Une réconciliation manuelle est nécessaire ; n'effacez pas les fichiers au hasard. Après comparaison des branches et sauvegarde externe, un développeur peut rétablir une chaîne unique. Aucun outil de fusion automatique n'est fourni dans cette version.
- En cas de coupure réseau au moment de l'enregistrement, le résultat distant peut être incertain : reconnectez/rechargez Drive avant de ressaisir. Une erreur n'est jamais présentée comme une sauvegarde réussie.
- Le mode local utilise localStorage, non chiffré au niveau applicatif. Le mode Drive ne copie pas ses données dans localStorage ; elles restent en mémoire pendant la session. Utilisez un appareil et une session de confiance.
- Les PDF utilisent une police occidentale embarquée (Liberation Sans) (accents français et symbole euro pris en charge). Les caractères d'autres alphabets non pris en charge sont remplacés par `?`. Vérifiez les PDF avant diffusion.
- Mois entiers seulement, montants constants par dossier de bail. Pas de prorata automatique, hausse de loyer, colocation à parts séparées, rapprochement bancaire ou envoi d'email.
- Après un premier paiement, loyer/charges/premier mois sont figés. Pour une hausse : clôturer l'ancien dossier au mois précédent et créer un nouveau dossier. Une quittance émise et ses paiements sont verrouillés ; aucune annulation/correction officielle n'est proposée dans cette version.
- La devise doit être choisie avant le premier paiement. Un excédent est signalé dans le PDF, sans être transféré automatiquement à une autre période.
- Le pays des logements n'a pas été précisé : **le modèle est générique, sans garantie de conformité juridique locale**. Faites valider les mentions nécessaires avant un usage officiel. Pas de signature électronique certifiée.

## 6. Tests et structure

Avec Node.js 22 ou version ultérieure :

```sh
npm test
```

Aucune installation npm nécessaire. Les tests Drive simulent Google : un test réel de consentement, enregistrement et rechargement reste nécessaire avec votre propre identifiant OAuth.

- `docs/index.html`, `style.css` : interface responsive.
- `docs/app.js` : écrans et interactions.
- `docs/core.js` : validation et règles de gestion.
- `docs/drive.js` : OAuth et Google Drive.
- `docs/pdf.js` : PDF autonome.
- `docs/config.js` : ID client public facultatif.
- `tests/` : tests métier et Drive simulé.

## Dépannage

- **origin_mismatch** : l'origine exacte (protocole, domaine et port), sans chemin, doit figurer dans le client OAuth. Patientez après une modification Google.
- **access_denied / accès bloqué en test** : ajoutez le compte utilisé dans Utilisateurs test, vérifiez l'API activée et les restrictions de l'organisation.
- **Fenêtre fermée/bloquée** : autorisez les popups sur le site puis cliquez de nouveau sur Connecter.
- **Session expirée** : reconnectez-vous. Exportez les données visibles avant tout rechargement si vous avez un doute.
- **403** : vérifiez l'activation de Google Drive API, l'autorisation drive.file, les politiques Workspace et le quota disponible.
- **Page vide en local** : utilisez le serveur HTTP ; n'ouvrez pas index.html en file://.
- **Données absentes** : vérifiez le mode local/Drive, le compte choisi et le mois affiché. Les données locales sont propres à chaque origine web et à chaque navigateur.

## Documentation officielle

- OAuth dans le navigateur : https://developers.google.com/identity/oauth2/web/guides/use-token-model
- Portées Drive : https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Publication Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

La police Liberation Sans est redistribuée sous sa licence libre ; voir `FONT-LICENSE.txt`.
