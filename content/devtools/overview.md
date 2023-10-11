### Vue d'ensemble

> info **Astuce** Ce chapitre couvre l'intégration de Nest Devtools avec le framework Nest. Si vous recherchez l'application Devtools, veuillez consulter le site Web [Devtools](https://devtools.nestjs.com).

Pour commencer à déboguer votre application locale, ouvrez le fichier `main.ts` et assurez-vous de mettre l'attribut `snapshot` à `true` dans l'objet application options, comme suit :

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(3000);
}
```

Cela demandera au framework de collecter les métadonnées nécessaires qui permettront à Nest Devtools de visualiser le graphe de votre application.

Ensuite, installons les dépendances nécessaires :

```bash
$ npm i @nestjs/devtools-integration
```

> warning **Attention** Si vous utilisez le paquet `@nestjs/graphql` dans votre application, assurez-vous d'installer la dernière version (`npm i @nestjs/graphql@11`).

Avec cette dépendance en place, ouvrons le fichier `app.module.ts` et importons le module `DevtoolsModule` que nous venons d'installer :

```typescript
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

> warning **Attention** La raison pour laquelle nous vérifions la variable d'environnement `NODE_ENV` ici est que vous ne devriez jamais utiliser ce module en production !

Une fois que le module `DevtoolsModule` est importé et que votre application est opérationnelle (`npm run start:dev`), vous devriez pouvoir naviguer vers l'URL [Devtools](https://devtools.nestjs.com) et voir le graphe instrospectif.

<figure><img src="/assets/devtools/modules-graph.png" /></figure>

> info **Astuce** Comme vous pouvez le voir sur la capture d'écran ci-dessus, chaque module se connecte au `InternalCoreModule`. `InternalCoreModule` est un module global qui est toujours importé dans le module racine. Puisqu'il est enregistré comme un nœud global, Nest crée automatiquement des liens entre tous les modules et le nœud `InternalCoreModule`. Maintenant, si vous voulez cacher les modules globaux du graphe, vous pouvez utiliser la case à cocher "**Cacher les modules globaux**" (dans la barre latérale).

Comme nous pouvons le voir, `DevtoolsModule` permet à votre application d'exposer un serveur HTTP supplémentaire (sur le port 8000) que l'application Devtools utilisera pour inspecter votre application.

Pour vérifier que tout fonctionne comme prévu, changez la vue du graphique en "Classes". Vous devriez voir l'écran suivant :

<figure><img src="/assets/devtools/classes-graph.png" /></figure>

Pour mettre l'accent sur un nœud spécifique, cliquez sur le rectangle et le graphique affichera une fenêtre contextuelle avec le bouton **"Focus"**. Vous pouvez également utiliser la barre de recherche (située dans la barre latérale) pour trouver un nœud spécifique.

> info **Astuce** Si vous cliquez sur le bouton **Inspect**, l'application vous amènera à la page `/debug` avec ce nœud spécifique sélectionné.

<figure><img src="/assets/devtools/node-popup.png" /></figure>

> info **Astuce** Pour exporter un graphique en tant qu'image, cliquez sur le bouton **Export as PNG** dans le coin droit du graphique.

En utilisant les contrôles de formulaire situés dans la barre latérale (à gauche), vous pouvez contrôler la proximité des bords pour, par exemple, visualiser une sous-arborescence d'application spécifique :

<figure><img src="/assets/devtools/subtree-view.png" /></figure>

Cela peut être particulièrement utile lorsque vous avez de **nouveaux développeurs** dans votre équipe et que vous voulez leur montrer comment votre application est structurée. Vous pouvez également utiliser cette fonctionnalité pour visualiser un module spécifique (par exemple `TasksModule`) et toutes ses dépendances, ce qui peut être utile lorsque vous décomposez une grande application en modules plus petits (par exemple, des micro-services individuels).

Vous pouvez regarder cette vidéo pour voir la fonction **Graph Explorer** en action :

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/bW8V-ssfnvM"
    title="Lecteur vidéo YouTube"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Enquête sur l'erreur "Cannot resolve dependency"

> info **Note** Cette fonction est prise en charge pour `@nestjs/core` >= `v9.3.10`.

Le message d'erreur le plus courant que vous ayez pu voir concerne probablement l'impossibilité pour Nest de résoudre les dépendances d'un fournisseur. En utilisant Nest Devtools, vous pouvez facilement identifier le problème et apprendre à le résoudre.

Tout d'abord, ouvrez le fichier `main.ts` et mettez à jour l'appel `bootstrap()` comme suit :

```typescript
bootstrap().catch((err) => {
  fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? '');
  process.exit(1);
});
```

Assurez-vous également de mettre la valeur `abortOnError` à `false` :

```typescript
const app = await NestFactory.create(AppModule, {
  snapshot: true,
  abortOnError: false, // <--- THIS
});
```

Maintenant, à chaque fois que votre application échoue à démarrer à cause de l'erreur **"Cannot resolve dependency "**, vous trouverez le fichier `graph.json` (qui représente un graphe partiel) dans le répertoire racine. Vous pouvez alors glisser-déposer ce fichier dans Devtools (assurez-vous de changer le mode courant de "Interactive" à "Preview") :

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

Une fois le téléchargement réussi, vous devriez voir le graphique et la fenêtre de dialogue suivants :

<figure><img src="/assets/devtools/partial-graph-modules-view.png" /></figure>

Comme vous pouvez le voir, le module `TasksModule` en surbrillance est celui que nous devons examiner. De plus, dans la fenêtre de dialogue, vous pouvez déjà voir des instructions sur la façon de résoudre ce problème.

Si nous passons à la vue "Classes", c'est ce que nous verrons :

<figure><img src="/assets/devtools/partial-graph-classes-view.png" /></figure>

Ce graphique illustre que le `DiagnosticsService` que nous voulons injecter dans le `TasksService` n'a pas été trouvé dans le contexte du module `TasksModule`, et nous devrions probablement importer le `DiagnosticsModule` dans le module `TasksModule` pour résoudre ce problème !

#### Explorateur de routes

Lorsque vous naviguez vers la page **Routes explorer**, vous devriez voir tous les points d'entrée enregistrés :

<figure><img src="/assets/devtools/routes.png" /></figure>

> info **Astuce** Cette page présente non seulement les routes HTTP, mais aussi tous les autres points d'entrée (par exemple, WebSockets, gRPC, résolveurs GraphQL, etc.)

Les points d'entrée sont regroupés en fonction de leurs contrôleurs hôtes. Vous pouvez également utiliser la barre de recherche pour trouver un point d'entrée spécifique.

Si vous cliquez sur un point d'entrée spécifique, **un graphique de flux** s'affiche. Ce graphique montre le flux d'exécution du point d'entrée (par exemple, les gardiens, les intercepteurs, les tuyaux, etc. liés à cette route). Ceci est particulièrement utile lorsque vous voulez comprendre comment le cycle requête/réponse se présente pour une route spécifique, ou lorsque vous cherchez à savoir pourquoi un garde/intercepteur/pipe spécifique n'est pas exécuté.

#### Sandbox

Pour exécuter du code JavaScript à la volée et interagir avec votre application en temps réel, rendez-vous sur la page **Sandbox** :

<figure><img src="/assets/devtools/sandbox.png" /></figure>

Le terrain de jeu peut être utilisé pour tester et débugger les points d'extrémité de l'API en **temps réel**, ce qui permet aux développeurs d'identifier et de corriger rapidement les problèmes sans utiliser, par exemple, un client HTTP. Nous pouvons également contourner la couche d'authentification, de sorte que nous n'avons plus besoin de cette étape supplémentaire de connexion, ni même d'un compte d'utilisateur spécial à des fins de test. Pour les applications événementielles, nous pouvons également déclencher des événements directement à partir du terrain de jeu et voir comment l'application y réagit.

Tout ce qui est enregistré est transféré vers la console de l'aire de jeu, afin que nous puissions facilement voir ce qui se passe.

Il suffit d'exécuter le code **à la volée** et de voir les résultats instantanément, sans avoir à reconstruire l'application et à redémarrer le serveur.

<figure><img src="/assets/devtools/sandbox-table.png" /></figure>

> info **Astuce** Pour afficher un tableau d'objets, utilisez la fonction `console.table()` (ou simplement `table()`).

Vous pouvez regarder cette vidéo pour voir la fonctionnalité **Interactive Playground** en action :

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/liSxEN_VXKM"
    title="Lecteur vidéo YouTube"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Analyseur de performance

Pour voir une liste de tous les nœuds de classe (contrôleurs, fournisseurs, améliorateurs, etc.) et leurs temps d'instanciation correspondants, naviguez vers la page **Bootstrap performance** :

<figure><img src="/assets/devtools/bootstrap-performance.png" /></figure>

Cette page est particulièrement utile lorsque vous souhaitez identifier les parties les plus lentes du processus de démarrage de votre application (par exemple, lorsque vous souhaitez optimiser le temps de démarrage de l'application, ce qui est crucial pour, par exemple, les environnements sans serveur).

#### Audit

Pour voir l'audit généré automatiquement - les erreurs, les avertissements et les conseils que l'application a émis lors de l'analyse de votre graphe sérialisé, naviguez jusqu'à la page **Audit** :

<figure><img src="/assets/devtools/audit.png" /></figure>

> info **Astuce** La capture d'écran ci-dessus ne montre pas toutes les règles d'audit disponibles.

Cette page est très utile lorsque vous souhaitez identifier des problèmes potentiels dans votre application.

#### Prévisualiser les fichiers statiques

Pour enregistrer un graphique sérialisé dans un fichier, utilisez le code suivant :

```typescript
await app.listen(3000); // OR await app.init()
fs.writeFileSync('./graph.json', app.get(SerializedGraph).toString());
```

> info **Astuce** `SerializedGraph` est exporté du package `@nestjs/core`.

Vous pouvez ensuite glisser-déposer/charger ce fichier :

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

Cette fonction est utile lorsque vous souhaitez partager votre graphique avec quelqu'un d'autre (un collègue, par exemple) ou lorsque vous souhaitez l'analyser hors ligne.
