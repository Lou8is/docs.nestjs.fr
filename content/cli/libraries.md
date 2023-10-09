### Bibliothèques

De nombreuses applications doivent résoudre les mêmes problèmes généraux ou réutiliser un composant modulaire dans plusieurs contextes différents. Nest dispose de plusieurs moyens pour résoudre ce problème, mais chacun d'entre eux fonctionne à un niveau différent pour résoudre le problème d'une manière qui permet d'atteindre différents objectifs architecturaux et organisationnels.

Les [modules](/modules) Nest sont utiles pour fournir un contexte d'exécution qui permet de partager des composants au sein d'une même application. Les modules peuvent également être empaquetés avec [npm](https://npmjs.com) pour créer une bibliothèque réutilisable qui peut être installée dans différents projets. Il peut s'agir d'un moyen efficace de distribuer des bibliothèques configurables et réutilisables qui peuvent être utilisées par différentes organisations, peu connectées ou non affiliées (par exemple, en distribuant/installant des bibliothèques tierces).

Pour le partage de code au sein de groupes étroitement organisés (par exemple, à l'intérieur des limites d'une entreprise ou d'un projet), il peut être utile d'avoir une approche plus légère du partage des composants. Les monorepos sont apparus comme une construction permettant cela, et dans un monorepo, une **bibliothèque** fournit un moyen de partager le code d'une manière simple et légère. Dans un  monorepo Nest, l'utilisation de bibliothèques permet d'assembler facilement des applications qui partagent des composants. En fait, cela encourage la décomposition des applications monolithiques et des processus de développement pour se concentrer sur la construction et la composition de composants modulaires.

#### Bibliothèques Nest

Une bibliothèque Nest est un projet Nest qui diffère d'une application en ce sens qu'il ne peut pas être exécuté seul. Une bibliothèque doit être importée dans une application pour que son code puisse être exécuté. Le support intégré des bibliothèques décrit dans cette section n'est disponible que pour les **monorepos** (les projets en mode standard peuvent obtenir une fonctionnalité similaire en utilisant des paquets npm).

Par exemple, une organisation peut développer un `AuthModule` qui gère l'authentification en mettant en œuvre les politiques de l'entreprise qui régissent toutes les applications internes. Plutôt que de construire ce module séparément pour chaque application, ou d'empaqueter physiquement le code avec npm et de demander à chaque projet de l'installer, une monorepo peut définir ce module comme une bibliothèque. Lorsqu'elle est organisée de cette manière, tous les consommateurs du module de bibliothèque peuvent voir une version à jour du `AuthModule` au fur et à mesure qu'elle est livrée. Cela peut avoir des avantages significatifs pour coordonner le développement et l'assemblage des composants, et simplifier les tests de bout en bout.

#### Créer des bibliothèques

Toute fonctionnalité susceptible d'être réutilisée peut être gérée comme une bibliothèque. Décider ce qui doit être une bibliothèque et ce qui doit faire partie d'une application est une décision de conception architecturale. La création de bibliothèques ne se limite pas à copier le code d'une application existante dans une nouvelle bibliothèque. Lorsqu'il est présenté sous forme de bibliothèque, le code de la bibliothèque doit être découplé de l'application. Cela peut nécessiter **plus** de temps au départ et imposer certaines décisions de conception auxquelles vous ne seriez pas confronté avec un code plus étroitement couplé. Mais cet effort supplémentaire peut s'avérer payant lorsque la bibliothèque peut être utilisée pour permettre un assemblage plus rapide d'applications multiples.

Pour commencer à créer une bibliothèque, exécutez la commande suivante :

```bash
$ nest g library ma-bibliotheque
```

Lorsque vous exécutez la commande, le schéma `library` vous demande un préfixe (ou alias) pour la bibliothèque :

```bash
What prefix would you like to use for the library (default: @app)?
```

Cela crée un nouveau projet dans votre espace de travail appelé "ma-bibliotheque".
Un projet de type bibliothèque, comme un projet de type application, est généré dans un dossier nommé à l'aide d'un schéma. Les bibliothèques sont gérées dans le dossier `libs` de la racine de la monorepo. Nest crée le dossier `libs` la première fois qu'une bibliothèque est créée.

Les fichiers générés pour une bibliothèque sont légèrement différents de ceux générés pour une application. Voici le contenu du dossier `libs` après avoir exécuté la commande ci-dessus :

<div class="file-tree">
  <div class="item">libs</div>
  <div class="children">
    <div class="item">ma-bibliotheque</div>
    <div class="children">
      <div class="item">src</div>
      <div class="children">
        <div class="item">index.ts</div>
        <div class="item">ma-bibliotheque.module.ts</div>
        <div class="item">ma-bibliotheque.service.ts</div>
      </div>
      <div class="item">tsconfig.lib.json</div>
    </div>
  </div>
</div>

The `nest-cli.json` file will have a new entry for the library under the `"projects"` key:

```javascript
...
{
    "ma-bibliotheque": {
      "type": "library",
      "root": "libs/ma-bibliotheque",
      "entryFile": "index",
      "sourceRoot": "libs/ma-bibliotheque/src",
      "compilerOptions": {
        "tsConfigPath": "libs/ma-bibliotheque/tsconfig.lib.json"
      }
}
...
```

Il y a deux différences dans les métadonnées de `nest-cli.json` entre les bibliothèques et les applications :

- la propriété `"type"` est fixée à `"library"` au lieu de `"application"`
- la propriété `"entryFile"` est fixée à `"index"` au lieu de `"main"`

Ces différences permettent au processus de construction de traiter les bibliothèques de manière appropriée. Par exemple, une bibliothèque exporte ses fonctions à travers le fichier `index.js`.

Comme pour les projets de type application, les bibliothèques ont chacune leur propre fichier `tsconfig.lib.json` qui étend le fichier `tsconfig.json` racine (à l'échelle du monorepo). Vous pouvez modifier ce fichier, si nécessaire, pour fournir des options de compilation spécifiques à la bibliothèque.

Vous pouvez compiler la bibliothèque à l'aide de la commande CLI :

```bash
$ nest build ma-bibliotheque
```

#### Utiliser des bibliothèques

Avec les fichiers de configuration générés automatiquement, l'utilisation des bibliothèques est simple. Comment importer `MyLibraryService` de la bibliothèque `ma-bibliotheque` dans l'application `mon-projet` ?

Tout d'abord, notez que l'utilisation des modules de bibliothèque est la même que celle de n'importe quel autre module Nest. Ce que fait le monorepo, c'est gérer les chemins de manière à ce que l'importation de bibliothèques et la génération de builds soient transparentes. Pour utiliser `MyLibraryService`, nous devons importer son module déclarant. Nous pouvons modifier `mon-projet/src/app.module.ts` comme suit pour importer `MyLibraryModule`.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLibraryModule } from '@app/ma-bibliotheque';

@Module({
  imports: [MyLibraryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Notez ci-dessus que nous avons utilisé un alias de chemin de `@app` dans la ligne `import` du module ES, qui est le `prefix` que nous avons fourni avec la commande `nest g library` ci-dessus. Sous la couverture, Nest gère cela à travers le mappage de chemin tsconfig. Lors de l'ajout d'une bibliothèque, Nest met à jour la clé `"paths"` du fichier `tsconfig.json` global (monorepo) comme ceci :

```javascript
"paths": {
    "@app/ma-bibliotheque": [
        "libs/ma-bibliotheque/src"
    ],
    "@app/ma-bibliotheque/*": [
        "libs/ma-bibliotheque/src/*"
    ]
}
```

En résumé, la combinaison des caractéristiques du monorepo et de la bibliothèque a permis d'intégrer facilement et intuitivement des modules de bibliothèque dans les applications.

Ce même mécanisme permet de construire et de déployer des applications qui composent des bibliothèques. Une fois que vous avez importé le module `MyLibraryModule`, l'exécution de `nest build` gère automatiquement toute la résolution du module et empaquette l'application avec toutes les dépendances de la bibliothèque, pour le déploiement. Le compilateur par défaut pour un monorepo est **webpack**, donc le fichier de distribution résultant est un fichier unique qui regroupe tous les fichiers JavaScript transpilés dans un seul fichier. Vous pouvez également passer à `tsc` comme décrit [ici](/cli/monorepo#options-globales-du-compilateur).
