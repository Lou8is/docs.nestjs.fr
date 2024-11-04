### Intégration CI/CD

> info **Astuce** Ce chapitre couvre l'intégration de Nest Devtools avec le framework Nest. Si vous recherchez l'application Devtools, veuillez consulter le site Web [Devtools](https://devtools.nestjs.com).

L'intégration CI/CD est disponible pour les utilisateurs ayant le plan **Enterprise**.

Vous pouvez regarder cette vidéo pour savoir pourquoi et comment l'intégration CI/CD peut vous aider :

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/r5RXcBrnEQ8"
    title="Lecteur vidéo YouTube"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Publication de graphes

Commençons par configurer le fichier d'amorçage de l'application (`main.ts`) pour utiliser la classe `GraphPublisher` (exportée depuis `@nestjs/devtools-integration` - voir le chapitre précédent pour plus de détails), comme suit :

```typescript
async function bootstrap() {
  const shouldPublishGraph = process.env.PUBLISH_GRAPH === "true";

  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    preview: shouldPublishGraph,
  });

  if (shouldPublishGraph) {
    await app.init();

    const publishOptions = { ... } // NOTE : cet objet d'options varie en fonction du fournisseur CI/CD que vous utilisez.
    const graphPublisher = new GraphPublisher(app);
    await graphPublisher.publish(publishOptions);

    await app.close();
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}
```

Comme nous pouvons le voir, nous utilisons le `GraphPublisher` ici pour publier notre graphe sérialisé dans le registre centralisé. La variable `PUBLISH_GRAPH` est une variable d'environnement personnalisée qui nous permet de contrôler si le graphe doit être publié (workflow CI/CD), ou non (démarrage normal de l'application). De plus, nous mettons l'attribut `preview` ici à `true`. Avec ce flag activé, notre application va démarrer en mode preview - ce qui signifie que les constructeurs (et les hooks de cycle de vie) de tous les contrôleurs, améliorateurs et fournisseurs de notre application ne seront pas exécutés. Note - ce n'est pas **nécessaire**, mais rend les choses plus simples pour nous puisque dans ce cas nous n'aurons pas vraiment à nous connecter à la base de données etc. lors de l'exécution de notre application dans le pipeline CI/CD.

L'objet `publishOptions` varie en fonction du fournisseur CI/CD que vous utilisez. Nous vous fournirons des instructions pour les fournisseurs CI/CD les plus populaires dans les sections suivantes.

Une fois le graphique publié avec succès, vous verrez la sortie suivante dans votre vue du flux de travail :

<figure><img src="/assets/devtools/graph-published-terminal.png" /></figure>

Chaque fois que notre graphique est publié, nous devrions voir une nouvelle entrée dans la page correspondante du projet :

<figure><img src="/assets/devtools/project.png" /></figure>

#### Rapports

Devtools génère un rapport pour chaque build **SI** il y a un snapshot correspondant déjà stocké dans le registre centralisé. Ainsi, par exemple, si vous créez un PR contre la branche `master` pour laquelle le graphe a déjà été publié - alors l'application sera capable de détecter les différences et de générer un rapport. Dans le cas contraire, le rapport ne sera pas généré.

Pour consulter les rapports, naviguez jusqu'à la page correspondante du projet (voir organisations).

<figure><img src="/assets/devtools/report.png" /></figure>

Ceci est particulièrement utile pour identifier les changements qui auraient pu passer inaperçus lors des revues de code. Par exemple, supposons que quelqu'un ait modifié la portée d'un **fournisseur profondément imbriqué**. Ce changement peut ne pas être immédiatement évident pour le réviseur, mais avec Devtools, nous pouvons facilement repérer de tels changements et nous assurer qu'ils sont intentionnels. Ou si nous supprimons une garde d'un point de terminaison spécifique, il apparaîtra comme affecté dans le rapport. Or, si nous n'avions pas de tests d'intégration ou de tests e2e pour cette route, nous pourrions ne pas remarquer qu'elle n'est plus protégée, et lorsque nous le ferons, il sera peut-être trop tard.

De même, si nous travaillons sur une **grande base de code** et que nous modifions un module pour qu'il soit global, nous verrons combien d'arêtes ont été ajoutées au graphe, ce qui - dans la plupart des cas - est le signe que nous faisons quelque chose de mal.

#### Prévisualisation du build

Pour chaque graphique publié, nous pouvons remonter dans le temps et prévisualiser son aspect antérieur en cliquant sur le bouton **Preview**. De plus, si le rapport a été généré, nous devrions voir les différences mises en évidence sur notre graphique :

- les nœuds verts représentent les éléments ajoutés
- les nœuds en blanc clair représentent les éléments mis à jour
- les nœuds rouges représentent les éléments supprimés

Voir la capture d'écran ci-dessous :

<figure><img src="/assets/devtools/nodes-selection.png" /></figure>

La possibilité de remonter dans le temps vous permet d'enquêter et de résoudre le problème en comparant le graphique actuel avec le précédent. Selon la façon dont vous avez configuré les choses, chaque pull request (ou même chaque commit) aura un snapshot correspondant dans le registre, de sorte que vous pouvez facilement remonter dans le temps et voir ce qui a changé. Considérez Devtools comme un Git, mais avec une compréhension de la façon dont Nest construit votre graphe d'application, et avec la capacité de **visualiser** ce graphe.

#### Intégrations : GitHub Actions

Commençons par créer un nouveau workflow GitHub dans le répertoire `.github/workflows` de notre projet et appelons-le, par exemple, `publish-graph.yml`. Dans ce fichier, utilisons la définition suivante :

```yaml
name: Devtools

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - '*'

jobs:
  publish:
    if: github.actor!= 'dependabot[bot]'
    name: Publish graph
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup Environment (PR)
        if: {{ '${{' }} github.event_name == 'pull_request' {{ '}}' }}
        shell: bash
        run: |
          echo "COMMIT_SHA={{ '${{' }} github.event.pull_request.head.sha {{ '}}' }}" >>\${GITHUB_ENV}
      - name: Setup Environment (Push)
        if: {{ '${{' }} github.event_name == 'push' {{ '}}' }}
        shell: bash
        run: |
          echo "COMMIT_SHA=\${GITHUB_SHA}" >> \${GITHUB_ENV}
      - name: Publish
        run: PUBLISH_GRAPH=true npm run start
        env:
          DEVTOOLS_API_KEY: CHANGE_THIS_TO_YOUR_API_KEY
          REPOSITORY_NAME: {{ '${{' }} github.event.repository.name {{ '}}' }}
          BRANCH_NAME: {{ '${{' }} github.head_ref || github.ref_name {{ '}}' }}
          TARGET_SHA: {{ '${{' }} github.event.pull_request.base.sha {{ '}}' }}
```

Idéalement, la variable d'environnement `DEVTOOLS_API_KEY` devrait être récupérée à partir de GitHub Secrets, pour en savoir plus [ici](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

Ce workflow sera exécuté pour chaque pull request qui cible la branche `master` OU dans le cas où il y a un commit direct vers la branche `master`. N'hésitez pas à adapter cette configuration aux besoins de votre projet. Ce qui est essentiel ici est de fournir les variables d'environnement nécessaires à notre classe `GraphPublisher` (pour qu'elle s'exécute).

Cependant, il y a une variable qui doit être mise à jour avant que nous puissions commencer à utiliser ce flux de travail - `DEVTOOLS_API_KEY`. Nous pouvons générer une clé API dédiée à notre projet sur votre [compte Devtools](https://devtools.nestjs.com/settings/manage-api-keys).

Enfin, naviguons à nouveau vers le fichier `main.ts` et mettons à jour l'objet `publishOptions` que nous avons précédemment laissé vide.

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
```

Pour une meilleure expérience de développement, assurez-vous d'intégrer l'application **GitHub** pour votre projet en cliquant sur le bouton "Intégrer l'application GitHub" (voir la capture d'écran ci-dessous). Remarque : cette opération n'est pas obligatoire.

<figure><img src="/assets/devtools/integrate-github-app.png" /></figure>

Grâce à cette intégration, vous serez en mesure de voir l'état du processus de prévisualisation/de génération de rapport directement dans votre demande d'extraction :

<figure><img src="/assets/devtools/actions-preview.png" /></figure>

#### Intégrations : Gitlab Pipelines

Commençons par créer un nouveau fichier de configuration Gitlab CI dans le répertoire racine de notre projet et appelons-le, par exemple, `.gitlab-ci.yml`. Dans ce fichier, utilisons la définition suivante :

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
```

> info **Astuce** Idéalement, la variable d'environnement `DEVTOOLS_API_KEY` devrait être récupérée à partir des secrets.

Ce workflow sera exécuté pour chaque pull request qui cible la branche `master` OU dans le cas où il y a un commit direct vers la branche `master`. N'hésitez pas à adapter cette configuration aux besoins de votre projet. Ce qui est essentiel ici est que nous fournissons les variables d'environnement nécessaires à notre classe `GraphPublisher` (pour qu'elle s'exécute).

Cependant, il y a une variable (dans cette définition de workflow) qui doit être mise à jour avant que nous puissions commencer à utiliser ce workflow - `DEVTOOLS_API_KEY`. Nous pouvons générer une clé API dédiée à notre projet sur votre compte Devtools.

Enfin, naviguons à nouveau vers le fichier `main.ts` et mettons à jour l'objet `publishOptions` que nous avons précédemment laissé vide.

```yaml
image: node:16

stages:
  - build

cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: always
    - if: $CI_COMMIT_BRANCH == "master" && $CI_PIPELINE_SOURCE == "push"
      when: always
    - when: never

install_dependencies:
  stage: build
  script:
    - npm ci

publish_graph:
  stage: build
  needs:
    - install_dependencies
  script: npm run start
  variables:
    PUBLISH_GRAPH: 'true'
    DEVTOOLS_API_KEY: 'CHANGE_THIS_TO_YOUR_API_KEY'
```

#### Autres outils CI/CD

L'intégration CI/CD de Nest Devtools peut être utilisée avec n'importe quel outil CI/CD de votre choix (par exemple, [Bitbucket Pipelines](https://bitbucket.org/product/features/pipelines) , [CircleCI](https://circleci.com/), etc), donc ne vous sentez pas limité aux fournisseurs décrits ici.

Regardez la configuration de l'objet `publishOptions` suivant pour comprendre quelles informations sont requises pour publier le graphe pour un commit/build/PR donné.

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.CI_PROJECT_NAME,
  owner: process.env.CI_PROJECT_ROOT_NAMESPACE,
  sha: process.env.CI_COMMIT_SHA,
  target: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA,
  trigger: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ? 'pull' : 'push',
  branch: process.env.CI_COMMIT_BRANCH ?? process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
};
```

La plupart de ces informations sont fournies par des variables d'environnement intégrées à CI/CD (voir [CircleCI built-in environment list](https://circleci.com/docs/variables/#built-in-environment-variables) et [Bitbucket variables](https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/) ).

En ce qui concerne la configuration du pipeline pour la publication des graphes, nous recommandons d'utiliser les déclencheurs suivants :

- événement `push` - seulement si la branche courante représente un environnement de déploiement, par exemple `master`, `main`, `staging`, `production`, etc.
- événement `pull request` - toujours, ou lorsque la **branche cible** représente un environnement de déploiement (voir ci-dessus)
