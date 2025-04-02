### Guide de migration

Cet article propose un guide complet pour migrer de la version 10 de NestJS à la version 11. Pour découvrir les nouvelles fonctionnalités introduites dans la v11, consultez [cet article](https://trilon.io/blog/announcing-nestjs-11-whats-new). Bien que la mise à jour comprenne quelques changements mineurs, il est peu probable qu'ils aient un impact sur la plupart des utilisateurs. Vous pouvez consulter la liste complète des changements [ici](https://github.com/nestjs/nest/releases/tag/v11.0.0).

#### Mise à jour des packages

Bien que vous puissiez mettre à jour manuellement vos paquets, nous vous recommandons d'utiliser [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) pour un processus plus rationnel.

#### Express v5

Après des années de développement, Express v5 a été officiellement publié en 2024 et est devenu une version stable en 2025. Avec NestJS 11, Express v5 est désormais la version par défaut intégrée au framework. Bien que cette mise à jour soit transparente pour la plupart des utilisateurs, il est important de savoir qu'Express v5 introduit certaines ruptures. Pour des conseils détaillés, consultez le [Guide de migration Express v5](https://expressjs.com/en/guide/migrating-5.html).

L'une des mises à jour les plus notables d'Express v5 est la révision de l'algorithme de correspondance des routes. Les changements suivants ont été introduits dans la manière dont les chaînes de chemin sont mises en correspondance avec les demandes entrantes :

- Le joker `*` doit avoir un nom, correspondant au comportement des paramètres : utilisez `/*splat` ou `/{{ '{' }}*splat&#125;` au lieu de `/*`. `splat` est simplement le nom du paramètre joker et n'a pas de signification particulière. Vous pouvez le nommer comme vous le souhaitez, par exemple, `*wildcard`
- Le caractère optionnel `?` n'est plus supporté, utilisez les accolades à la place : `/:file{{ '{' }}.:ext&#125;`.
- Les caractères Regexp ne sont pas pris en charge.
- Certains caractères ont été réservés pour éviter toute confusion lors de la mise à jour : `(()[]?+ !)`, utilisez `\` pour les échapper.
- Les noms de paramètres supportent maintenant les identifiants JavaScript valides, ou cités comme `:"ceci"`.

Cela dit, les itinéraires qui fonctionnaient auparavant dans Express v4 peuvent ne pas fonctionner dans Express v5. Par exemple :

```typescript
@Get('users/*')
findAll() {
  // Dans NestJS 11, cette route sera automatiquement convertie en une route Express v5 valide.
  // Bien que cela puisse encore fonctionner, il n'est plus conseillé d'utiliser cette syntaxe de caractères génériques dans Express v5.
  return 'Cet itinéraire ne devrait pas fonctionner dans Express v5';
}
```

Pour résoudre ce problème, vous pouvez mettre à jour l'itinéraire afin d'utiliser un caractère générique nommé :

```typescript
@Get('users/*splat')
findAll() {
  return 'Cet itinéraire fonctionnera dans Express v5';
}
```

> warning **Attention** Notez que `*splat` est un joker nommé qui correspond à n'importe quel chemin sans le chemin racine. Si vous avez besoin de faire correspondre le chemin racine (`/users`), vous pouvez utiliser `/users/{{ '{' }}*splat&#125;`, en entourant le joker d'accolades (groupe optionnel). Notez que `splat` est simplement le nom du paramètre joker et n'a pas de signification particulière. Vous pouvez le nommer comme vous le souhaitez, par exemple, `*wildcard`.

De même, si vous avez un logiciel intermédiaire qui fonctionne sur toutes les routes, vous devrez peut-être mettre à jour le chemin d'accès pour utiliser un caractère générique nommé :

```typescript
// Dans NestJS 11, cette route sera automatiquement convertie en une route Express v5 valide.
// Bien que cela puisse encore fonctionner, il n'est plus conseillé d'utiliser cette syntaxe de caractères génériques dans Express v5.
forRoutes('*'); // <-- Cela ne devrait pas fonctionner dans Express v5
```

Au lieu de cela, vous pouvez mettre à jour le chemin d'accès en utilisant un caractère générique nommé :

```typescript
forRoutes('{*splat}'); // <-- Cela fonctionnera dans Express v5
```

Notez que `{{ '{' }}*splat&#125;` est un joker nommé qui correspond à n'importe quel chemin, y compris le chemin racine. Les accolades extérieures rendent le chemin optionnel.

> info **Note** Cette modification ne s'applique qu'à Express v5.

Dans Express v5, les paramètres de requête ne sont plus analysés en utilisant la bibliothèque `qs` par défaut. A la place, l'analyseur `simple` est utilisé, qui ne supporte pas les objets imbriqués ou les tableaux.

Par conséquent, des chaînes de requête comme celles-ci :

```plaintext
?filter[where][name]=John&filter[where][age]=30
?item[]=1&item[]=2
```

ne seront plus analysées comme prévu. Pour revenir au comportement précédent, vous pouvez configurer Express pour utiliser l'analyseur `extended` (par défaut dans Express v4) en mettant l'option `query parser` à `extended` :

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- Veillez à utiliser <NestExpressApplication>
  app.set('query parser', 'extended'); // <-- Ajouter cette ligne
  await app.listen(3000);
}
bootstrap();
```

#### Fastify v5

`@nestjs/platform-fastify` v11 supporte enfin Fastify v5. Cette mise à jour devrait être transparente pour la plupart des utilisateurs ; cependant, Fastify v5 introduit quelques ruptures, bien qu'il soit peu probable qu'elles affectent la majorité des utilisateurs de NestJS. Pour plus d'informations, reportez-vous au [Guide de migration vers Fastify v5](https://fastify.dev/docs/v5.1.x/Guides/Migration-Guide-V5/).

> info **Astuce** Il n'y a pas eu de changement dans la correspondance des chemins dans Fastify v5 (sauf pour les middleware, voir la section ci-dessous), vous pouvez donc continuer à utiliser la syntaxe des caractères génériques comme vous le faisiez auparavant. Le comportement reste le même, et les routes définies avec des jokers (comme `*`) fonctionneront toujours comme prévu.

#### Enregistrement du middleware Fastify

NestJS 11 utilise maintenant la dernière version du paquet [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) pour faire correspondre les chemins **middleware** dans `@nestjs/platform-fastify`. En conséquence, la syntaxe `(.*)` pour faire correspondre tous les chemins n'est plus supportée. A la place, vous devez utiliser des jokers nommés.

Par exemple, si vous avez un middleware qui s'applique à tous les itinéraires :

```typescript
// Dans NestJS 11, cette route sera automatiquement convertie en route valide, même si vous ne la mettez pas à jour.
.forRoutes('(.*)');
```

Vous devrez le mettre à jour pour utiliser un caractère générique nommé à la place :

```typescript
.forRoutes('*splat');
```

Où `splat` est juste un nom arbitraire pour le paramètre joker. Vous pouvez lui donner le nom que vous voulez.

#### Algorithme de résolution des modules

À partir de NestJS 11, l'algorithme de résolution des modules a été amélioré afin d'améliorer les performances et de réduire l'utilisation de la mémoire pour la plupart des applications. Ce changement ne nécessite aucune intervention manuelle, mais dans certains cas, le comportement peut différer de celui des versions précédentes.

Dans NestJS v10 et les versions antérieures, les modules dynamiques se voyaient attribuer une clé opaque unique générée à partir des métadonnées dynamiques du module. Cette clé était utilisée pour identifier le module dans le registre des modules. Par exemple, si vous avez inclus `TypeOrmModule.forFeature([User])` dans plusieurs modules, NestJS dédupliquera les modules et les traitera comme un seul nœud de module dans le registre. Ce processus est connu sous le nom de déduplication de nœuds.

Avec la sortie de NestJS v11, nous ne générons plus de hachages prévisibles pour les modules dynamiques. Au lieu de cela, les références d'objets sont maintenant utilisées pour déterminer si un module est équivalent à un autre. Pour partager le même module dynamique entre plusieurs modules, il suffit de l'assigner à une variable et de l'importer là où c'est nécessaire. Cette nouvelle approche offre une plus grande flexibilité et garantit une gestion plus efficace des modules dynamiques.

Ce nouvel algorithme peut avoir un impact sur vos tests d'intégration si vous utilisez beaucoup de modules dynamiques, car sans la déduplication manuelle mentionnée ci-dessus, votre TestingModule pourrait avoir plusieurs instances d'une dépendance. Cela rend un peu plus difficile l'insertion d'une méthode, parce que vous aurez besoin de cibler la bonne instance. Vos options sont les suivantes :

- Dédupliquer le module dynamique que vous souhaitez bloquer
- Utilisez `module.select(ParentModule).get(Target)` pour trouver la bonne instance
- Supprimez toutes les instances en utilisant `module.get(Target, {{ '{' }} each : true &#125;)`
- Ou retournez votre test à l'ancien algorithme en utilisant `Test.createTestingModule({{ '{' }}&#125;, {{ '{' }} moduleIdGeneratorAlgorithm : 'deep-hash' &#125;)`

#### Inférence du type de réflecteur

NestJS 11 introduit plusieurs améliorations à la classe `Reflector`, améliorant sa fonctionnalité et l'inférence de type pour les valeurs de métadonnées. Ces mises à jour offrent une expérience plus intuitive et plus robuste lorsque l'on travaille avec des métadonnées.

1. `getAllAndMerge` retourne maintenant un objet plutôt qu'un tableau contenant un seul élément lorsqu'il n'y a qu'une seule entrée de métadonnées, et que la `valeur` est de type `objet`. Ce changement améliore la cohérence lors de l'utilisation de métadonnées basées sur des objets.
2. Le type de retour de `getAllAndOverride` a été mis à jour en `T | undefined` au lieu de `T`. Cette mise à jour reflète mieux la possibilité qu'aucune métadonnée ne soit trouvée et assure une gestion correcte des cas non définis.
3. L'argument de type transformé du `ReflectableDecorator` est maintenant correctement inféré à travers toutes les méthodes.

Ces améliorations améliorent l'expérience globale du développeur en offrant une meilleure sécurité des types et une meilleure gestion des métadonnées dans NestJS 11.

#### Ordre d'exécution des hooks du cycle de vie

Les hooks de cycle de vie de terminaison sont maintenant exécutés dans l'ordre inverse de leurs homologues d'initialisation. Cela dit, les crochets tels que `OnModuleDestroy`, `BeforeApplicationShutdown`, et `OnApplicationShutdown` sont maintenant exécutés dans l'ordre inverse.

Imaginez le scénario suivant :

```plaintext
// Où A, B et C sont des modules et "->" représente la dépendance du module.
A -> B -> C
```

Dans ce cas, les hooks `OnModuleInit` sont exécutés dans l'ordre suivant :

```plaintext
C -> B -> A
```

Les crochets `OnModuleDestroy` sont exécutés dans l'ordre inverse :

```plaintext
A -> B -> C
```

> info **Astuce** Les modules globaux sont traités comme s'ils dépendaient de tous les autres modules. Cela signifie que les modules globaux sont initialisés en premier et détruits en dernier.

#### Ordre d'enregistrement du Middleware

Dans NestJS v11, le comportement de l'enregistrement des intergiciels a été mis à jour. Auparavant, l'ordre d'enregistrement des intergiciels était déterminé par le tri topologique du graphe de dépendance des modules, où la distance par rapport au module racine définissait l'ordre d'enregistrement des intergiciels, indépendamment du fait que l'intergiciel était enregistré dans un module global ou un module normal. Les modules globaux étaient traités comme des modules ordinaires à cet égard, ce qui entraînait un comportement incohérent, en particulier par rapport à d'autres fonctionnalités du cadre.

À partir de la version 11, les intergiciels enregistrés dans les modules globaux sont désormais **exécutés en premier**, quelle que soit leur position dans le graphe de dépendance du module. Ce changement garantit que les intergiciels globaux s'exécutent toujours avant les intergiciels des modules importés, ce qui permet de maintenir un ordre cohérent et prévisible.

#### Cache module

Le `CacheModule` (du paquet `@nestjs/cache-manager`) a été mis à jour pour supporter la dernière version du paquet `cache-manager`. Cette mise à jour apporte quelques changements, dont une migration vers [Keyv](https://keyv.org/), qui offre une interface unifiée pour le stockage clé-valeur à travers de multiples magasins backend par le biais d'adaptateurs de stockage.

La principale différence entre la version précédente et la nouvelle version réside dans la configuration des magasins externes. Dans la version précédente, pour enregistrer un magasin Redis, vous l'auriez probablement configuré comme suit :

```ts
// Ancienne version - n'est plus supportée
CacheModule.registerAsync({
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });

    return {
      store,
    };
  },
}),
```

Dans la nouvelle version, vous devez utiliser l'adaptateur `Keyv` pour configurer le magasin :

```ts
// Nouvelle version - prise en charge
CacheModule.registerAsync({
  useFactory: async () => {
    return {
      stores: [
        new KeyvRedis('redis://localhost:6379'),
      ],
    };
  },
}),
```

Où `KeyvRedis` est importé du paquet `@keyv/redis`. Voir la [documentation sur la mise en cache](/techniques/caching) pour en savoir plus.

> warning **Attention** Dans cette mise à jour, les données mises en cache gérées par la bibliothèque Keyv sont désormais structurées comme un objet contenant les champs `value` et `expires`, par exemple : `{{ '{' }}"value": "yourData", "expires": 1678901234567{{ '}' }}`. Bien que Keyv récupère automatiquement le champ `value` lors de l'accès aux données via son API, il est important de noter ce changement si vous interagissez avec les données du cache directement (par exemple, en dehors de l'API cache-manager) ou si vous avez besoin de supporter des données écrites en utilisant la version précédente de `@nestjs/cache-manager`.

#### Config module

Si vous utilisez le `ConfigModule` du paquetage `@nestjs/config`, soyez conscient de plusieurs changements introduits dans `@nestjs/config@4.0.0`. Plus particulièrement, l'ordre dans lequel les variables de configuration sont lues par la méthode `ConfigService#get` a été mis à jour. Le nouvel ordre est le suivant :

- Configuration interne (espaces de noms de configuration et fichiers de configuration personnalisés)
- Variables d'environnement validées (si la validation est activée et qu'un schéma est fourni)
- L'objet `process.env`.

Auparavant, les variables d'environnement validées et l'objet `process.env` étaient lus en premier, ce qui les empêchait d'être remplacés par la configuration interne. Avec cette mise à jour, la configuration interne aura toujours la priorité sur les variables d'environnement.

De plus, l'option de configuration `ignoreEnvVars`, qui permettait auparavant de désactiver la validation de l'objet `process.env`, a été dépréciée. A la place, utilisez l'option `validatePredefined` ( définie à `false` pour désactiver la validation des variables d'environnement prédéfinies). Les variables d'environnement prédéfinies font référence aux variables `process.env` qui ont été définies avant l'importation du module. Par exemple, si vous démarrez votre application avec `PORT=3000 node main.js`, la variable `PORT` est considérée comme prédéfinie. Cependant, les variables chargées par le module `ConfigModule` depuis un fichier `.env` ne sont pas considérées comme prédéfinies.

Une nouvelle option `skipProcessEnv` a également été introduite. Cette option vous permet d'empêcher la méthode `ConfigService#get` d'accéder entièrement à l'objet `process.env`, ce qui peut être utile lorsque vous voulez empêcher le service de lire directement les variables d'environnement.

#### Module terminus

Si vous utilisez le `TerminusModule` et avez construit votre propre indicateur de santé personnalisé, une nouvelle API a été introduite dans la version 11. Le nouveau `HealthIndicatorService` est conçu pour améliorer la lisibilité et la testabilité des indicateurs de santé personnalisés.

Avant la version 11, un indicateur de santé pouvait ressembler à ceci :

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      const result = this.getStatus(key, isHealthy, {
        badboys: badboys.length,
      });

      if (!isHealthy) {
        throw new HealthCheckError('Dog check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, isHealthy);
      throw new HealthCheckError('Dog check failed', result);
    }
  }

  private getBadboys() {
    return firstValueFrom(
      this.httpService.get<Dog[]>('https://example.com/dog').pipe(
        map((response) => response.data),
        map((dogs) => dogs.filter((dog) => dog.state === DogState.BAD_BOY)),
      ),
    );
  }
}
```

À partir de la version 11, il est recommandé d'utiliser la nouvelle API `HealthIndicatorService`, qui rationalise le processus d'implémentation. Voici comment le même indicateur de santé peut maintenant être mis en œuvre :

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    //  Injecter le `ServiceIndicateurSanté` fourni par le `ModuleTerminus`
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    // Lancer la vérification de l'indicateur de santé pour la clé donnée
    const indicator = this.healthIndicatorService.check(key);

    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      if (!isHealthy) {
        // Marquer l'indicateur comme étant « en baisse » et ajouter des informations supplémentaires à la réponse
        return indicator.down({ badboys: badboys.length });
      }

      // Marquer l'indicateur de santé comme étant en hausse
      return indicator.up();
    } catch (error) {
      return indicator.down('Unable to retrieve dogs');
    }
  }

  private getBadboys() {
    // ...
  }
}
```

Principaux changements :

- Le `HealthIndicatorService` remplace les anciennes classes `HealthIndicator` et `HealthCheckError`, fournissant une API plus propre pour les contrôles de santé.
- La méthode `check` permet un suivi facile de l'état (`up` ou `down`) tout en supportant l'inclusion de métadonnées additionnelles dans les réponses aux bilans de santé.

> info **Info** Veuillez noter que les classes `HealthIndicator` et `HealthCheckError` ont été marquées comme dépréciées et qu'il est prévu de les supprimer dans la prochaine version majeure.

#### Node.js v16 and v18 no longer supported

À partir de NestJS 11, Node.js v16 n'est plus supporté, car il a atteint sa fin de vie (EOL) le 11 septembre 2023. De même, le support de sécurité est prévu pour se terminer le 30 avril 2025 pour Node.js v18, donc nous sommes allés de l'avant et avons abandonné le support pour lui aussi.

NestJS 11 nécessite désormais **Node.js v20 ou supérieur**.

Pour garantir une expérience optimale, nous recommandons vivement d'utiliser la dernière version LTS de Node.js.

#### Mau, plateforme officielle de déploiement

Au cas où vous auriez manqué l'annonce, nous avons lancé notre plateforme de déploiement officielle, [Mau](https://www.mau.nestjs.com/), en 2024.
Mau est une plateforme entièrement gérée qui simplifie le processus de déploiement des applications NestJS. Avec Mau, vous pouvez déployer vos applications sur le cloud (**AWS** ; Amazon Web Services) avec une seule commande, gérer vos variables d'environnement et surveiller les performances de votre application en temps réel.

Mau rend le provisionnement et la maintenance de votre infrastructure aussi simple que de cliquer sur quelques boutons. Mau est conçu pour être simple et intuitif, afin que vous puissiez vous concentrer sur la création de vos applications sans vous soucier de l'infrastructure sous-jacente. Nous nous appuyons sur Amazon Web Services pour vous fournir une plateforme puissante et fiable, tout en faisant abstraction de la complexité d'AWS. Nous nous occupons de toutes les tâches lourdes pour vous, afin que vous puissiez vous concentrer sur le développement de vos applications et la croissance de votre entreprise.

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Vous pouvez en savoir plus sur Mau [dans ce chapitre](/deployment#easy-deployment-with-mau).