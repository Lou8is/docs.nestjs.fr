### Lazy-loading de modules

Par défaut, les modules sont chargés avec avidité, ce qui signifie que dès que l'application est chargée, tous les modules le sont aussi, qu'ils soient nécessaires ou non dans l'immédiat. Bien que cela convienne à la plupart des applications, cela peut devenir un goulot d'étranglement pour les applications/travailleurs fonctionnant dans un **environnement sans serveur**, où la latence de démarrage ("démarrage à froid") est cruciale.

Le lazy loading peut aider à réduire le temps de démarrage en chargeant uniquement les modules requis par l'invocation spécifique de la fonction serverless. En outre, vous pouvez également charger d'autres modules de manière asynchrone une fois que la fonction sans serveur est "chaude" afin d'accélérer encore davantage le temps d'amorçage pour les appels ultérieurs (enregistrement différé des modules).

> info **Astuce** Si vous êtes familier avec le framework **Angular**, vous avez peut-être déjà vu le terme " modules lazy-loading ". Sachez que cette technique est **fonctionnellement différente** dans Nest et qu'il s'agit donc d'une fonctionnalité entièrement différente qui partage des conventions de dénomination similaires.

> warning **Attention** Notez que les [méthodes d'accrochage au cycle de vie](https://docs.nestjs.com/fundamentals/lifecycle-events) ne sont pas invoquées dans les modules et services chargés paresseusement.

#### Pour commencer

Pour charger les modules à la demande, Nest fournit la classe `LazyModuleLoader` qui peut être injectée dans une classe de la manière habituelle :

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}
@@switch
@Injectable()
@Dependencies(LazyModuleLoader)
export class CatsService {
  constructor(lazyModuleLoader) {
    this.lazyModuleLoader = lazyModuleLoader;
  }
}
```

> info **Astuce** La classe `LazyModuleLoader` est importée du package `@nestjs/core`.

Alternativement, vous pouvez obtenir une référence au fournisseur `LazyModuleLoader` depuis le fichier de démarrage de votre application (`main.ts`), comme suit :

```typescript
// "app" représente une instance d'application Nest
const lazyModuleLoader = app.get(LazyModuleLoader);
```

Une fois cette étape franchie, vous pouvez charger n'importe quel module à l'aide de la construction suivante :

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
```

> info **Astuce** Les modules "chargés paresseusement" sont **mis en cache** lors de la première invocation de la méthode `LazyModuleLoader#load`. Cela signifie que chaque tentative consécutive de chargement de `LazyModule` sera **très rapide** et retournera une instance mise en cache, au lieu de charger à nouveau le module.
>
> ```bash
> Tentative de chargement de "LazyModule" : 1
> durée: 2.379ms
> Tentative de chargement de "LazyModule" : 2
> durée: 0.294ms
> Tentative de chargement de "LazyModule" : 3
> durée: 0.303ms
> ```
>
> En outre, les modules "chargés paresseusement" partagent le même graphe de modules que ceux qui sont chargés avec empressement au démarrage de l'application, ainsi que tous les autres modules paresseux enregistrés ultérieurement dans votre application.
Where `lazy.module.ts` is a TypeScript file that exports a **regular Nest module** (no extra changes are required).

La méthode `LazyModuleLoader#load` renvoie la [référence de module](/fundamentals/module-ref) (de `LazyModule`) qui vous permet de naviguer dans la liste interne des fournisseurs et d'obtenir une référence à n'importe quel fournisseur en utilisant son jeton d'injection comme clé de recherche.

Par exemple, disons que nous avons un `LazyModule` avec la définition suivante :

```typescript
@Module({
  providers: [LazyService],
  exports: [LazyService],
})
export class LazyModule {}
```

> info **Astuce** Les modules chargés paresseusement ne peuvent pas être enregistrés en tant que **modules globaux**, car cela n'a aucun sens (puisqu'ils sont enregistrés paresseusement, à la demande, lorsque tous les modules enregistrés statiquement ont déjà été instanciés). De même, les **améliorateurs globaux** enregistrés (gardes/intercepteurs/etc.) **ne fonctionneront pas** correctement non plus.

Avec cela, nous pouvons obtenir une référence au fournisseur `LazyService`, comme suit :

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);

const { LazyService } = await import('./lazy.service');
const lazyService = moduleRef.get(LazyService);
```

> warning **Attention** Si vous utilisez **Webpack**, assurez-vous de mettre à jour votre fichier `tsconfig.json` - en réglant `compilerOptions.module` sur `"esnext"` et en ajoutant la propriété `compilerOptions.moduleResolution` avec `"node"` comme valeur :
>
> ```json
> {
>   "compilerOptions": {
>     "module": "esnext",
>     "moduleResolution": "node",
>     ...
>   }
> }
> ```
>
> Une fois ces options paramétrées, vous pourrez tirer parti de la fonction de [division du code](https://webpack.js.org/guides/code-splitting/).

#### Contrôleurs, passerelles et résolveurs paresseux

Puisque les contrôleurs (ou les résolveurs dans les applications GraphQL) dans Nest représentent des ensembles de routes/chemins/sujets (ou requêtes/mutations), vous **ne pouvez pas les charger paresseusement** en utilisant la classe `LazyModuleLoader`.

> error **Attention** Les contrôleurs, les [résolveurs](/graphql/resolvers), et les [passerelles](/websockets/gateways) enregistrés dans des modules chargés paresseusement ne se comporteront pas comme prévu. De même, vous ne pouvez pas enregistrer des fonctions middleware (en implémentant l'interface `MiddlewareConsumer`) à la demande.

Par exemple, disons que vous construisez une API REST (application HTTP) avec un pilote Fastify sous le capot (en utilisant le package `@nestjs/platform-fastify`). Fastify ne vous permet pas d'enregistrer des routes après que l'application soit prête à écouter des messages. Cela signifie que même si nous analysons les routes enregistrées dans les contrôleurs du module, toutes les routes chargées paresseusement ne seront pas accessibles puisqu'il n'y a aucun moyen de les enregistrer au moment de l'exécution.

De même, certaines stratégies de transport que nous fournissons dans le cadre du package `@nestjs/microservices` (y compris Kafka, gRPC, ou RabbitMQ) nécessitent de s'abonner/écouter à des sujets/canaux spécifiques avant que la connexion ne soit établie. Une fois que votre application commence à écouter des messages, le framework ne sera pas en mesure de s'abonner/écouter de nouveaux sujets.

Enfin, le package `@nestjs/graphql` avec l'approche code first activée génère automatiquement le schéma GraphQL à la volée sur la base des métadonnées. Cela signifie que toutes les classes doivent être chargées au préalable. Sinon, il ne serait pas possible de créer un schéma approprié et valide.

#### Cas d'utilisation courants

Le plus souvent, vous verrez des modules chargés paresseusement dans des situations où votre worker/cron job/lambda & serverless fonction/webhook doit déclencher différents services (différentes logiques) en fonction des arguments d'entrée (chemin d'accès/date/paramètres de requête, etc.). D'autre part, les modules à chargement paresseux peuvent ne pas avoir trop de sens pour les applications monolithiques, où le temps de démarrage est plutôt sans importance.
