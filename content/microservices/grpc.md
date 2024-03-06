### gRPC

[gRPC](https://github.com/grpc/grpc-node) est un cadre RPC moderne, open source et très performant qui peut fonctionner dans n'importe quel environnement. Il permet de connecter efficacement des services dans et entre les centres de données grâce à une prise en charge enfichable de l'équilibrage de la charge, du traçage, de la vérification de l'état et de l'authentification.

Comme de nombreux systèmes RPC, gRPC est basé sur le concept de définition d'un service en termes de fonctions (méthodes) qui peuvent être appelées à distance. Pour chaque méthode, vous définissez les paramètres et les types de retour. Les services, les paramètres et les types de retour sont définis dans les fichiers `.proto` à l'aide du mécanisme [protocol buffers](https://protobuf.dev) de Google, qui est neutre sur le plan du langage.

Avec le transporteur gRPC, Nest utilise des fichiers `.proto` pour lier dynamiquement les clients et les serveurs afin de faciliter la mise en œuvre des appels de procédure à distance, en sérialisant et désérialisant automatiquement les données structurées.

#### Installation

Pour commencer à construire des microservices basés sur gRPC, il faut d'abord installer les paquets nécessaires :

```bash
$ npm i --save @grpc/grpc-js @grpc/proto-loader
```

#### Vue d'ensemble

Comme pour les autres implémentations de la couche de transport des microservices Nest, vous sélectionnez le mécanisme de transport gRPC en utilisant la propriété `transport` de l'objet options passé à la méthode `createMicroservice()`. Dans l'exemple suivant, nous allons mettre en place un service "hero". La propriété `options` fournit des métadonnées sur ce service ; ses propriétés sont décrites [ci-dessous] (microservices/grpc#options).

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
```

> info **Astuce** La fonction `join()` est importée du paquet `path` ; l'enum `Transport` est importé du paquet `@nestjs/microservices`.

Dans le fichier `nest-cli.json`, nous ajoutons la propriété `assets` qui nous permet de distribuer des fichiers non-TypeScript, et `watchAssets` - pour activer la surveillance de tous les assets non-TypeScript. Dans notre cas, nous voulons que les fichiers `.proto` soient automatiquement copiés dans le dossier `dist`.

```json
{
  "compilerOptions": {
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
```

#### Options

L'objet **gRPC** "transporter options" expose les propriétés décrites ci-dessous.

<table>
  <tr>
    <td><code>package</code></td>
    <td>Nom du paquet Protobuf (correspond à la configuration du <code>package</code> dans le fichier <code>.proto</code>). Requis</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      Chemin absolu (ou relatif au répertoire racine) vers le fichier
      <code>.proto</code>. Requis
    </td>
  </tr>
  <tr>
    <td><code>url</code></td>
    <td>URL de connexion.  Chaîne au format adresse <code>IP/nom DNS:port</code> (par exemple, <code>'0.0.0.0:50051'</code> pour un serveur Discord) définissant l'adresse/port sur lequel le transporteur établit une connexion.  Facultatif.  La valeur par défaut est <code>'localhost:5000'</code></td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td>Nom du paquet NPM pour l'utilitaire de chargement des fichiers <code>.proto</code>. Facultatif.  La valeur par défaut est <code>'@grpc/proto-loader'</code></td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      Options de <code>@grpc/proto-loader</code>. Elles permettent de contrôler en détail le comportement des fichiers <code>.proto</code>. Facultatif. Voir
      <a
        href="https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md"
        rel="nofollow"
        target="_blank"
        >here</a
      > pour plus de détails
    </td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      Identifiants du serveur.  Facultatif. <a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        >En lire plus ici</a
      >
    </td>
  </tr>
</table>

#### Exemple de service gRPC

Définissons notre exemple de service gRPC appelé `HeroesService`. Dans l'objet `options` ci-dessus, la propriété `protoPath` définit un chemin vers le fichier de définitions `.proto` `hero.proto`. Le fichier `hero.proto` est structuré en utilisant [protocol buffers](https://developers.google.com/protocol-buffers). Voici à quoi il ressemble :

```typescript
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
```

Notre `HeroesService` expose une méthode `FindOne()`. Cette méthode attend un argument d'entrée de type `HeroById` et retourne un message `Hero` (les tampons de protocole utilisent les éléments `message` pour définir à la fois les types de paramètres et les types de retour).

Ensuite, nous devons implémenter le service. Pour définir un handler qui réponde à cette définition, nous utilisons le décorateur `@GrpcMethod()` dans un contrôleur, comme montré ci-dessous. Ce décorateur fournit les métadonnées nécessaires pour déclarer une méthode en tant que méthode de service gRPC.

> info **Astuce** Le décorateur `@MessagePattern()` ([en savoir plus](microservices/basics#request-response)) introduit dans les chapitres précédents sur les microservices n'est pas utilisé avec les microservices basés sur gRPC. Le décorateur `@GrpcMethod()` prend effectivement sa place pour les microservices basés sur gRPC.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

> info **Astuce** Le décorateur `@GrpcMethod()` est importé du paquetage `@nestjs/microservices`, tandis que `Metadata` et `ServerUnaryCall` sont importés du paquetage `grpc`.

Le décorateur montré ci-dessus prend deux arguments. Le premier est le nom du service (par exemple, `'HeroesService''), correspondant à la définition du service `HeroesService` dans `hero.proto`. La seconde (la chaîne `'FindOne'`) correspond à la méthode rpc `FindOne()` définie dans `HeroesService` dans le fichier `hero.proto`.

La méthode `findOne()` prend trois arguments, les `data` transmises par l'appelant, `metadata` qui stocke les métadonnées de la requête gRPC
et `call` pour obtenir les propriétés de l'objet `GrpcCall` telles que `sendMetadata` pour envoyer les métadonnées au client.

Les deux arguments du décorateur `@GrpcMethod()` sont optionnels. S'il est appelé sans le second argument (par exemple, `'FindOne'`), Nest associera automatiquement la méthode rpc du fichier `.proto` avec le handler en convertissant le nom du handler en majuscules (par exemple, le handler `findOne` est associé à la définition de l'appel rpc `FindOne`). Ceci est illustré ci-dessous.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

Vous pouvez également omettre le premier argument `@GrpcMethod()`. Dans ce cas, Nest associe automatiquement le gestionnaire à la définition du service à partir du fichier de définitions du proto, en se basant sur le nom de la **classe** dans laquelle le gestionnaire est défini. Par exemple, dans le code suivant, la classe `HeroesService` associe ses méthodes de gestion à la définition du service `HeroesService` dans le fichier `hero.proto` en se basant sur la correspondance du nom `'HeroesService''.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

#### Client

Les applications Nest peuvent agir en tant que clients gRPC, consommant des services définis dans les fichiers `.proto`. Vous accédez aux services distants par l'intermédiaire d'un objet `ClientGrpc`. Vous pouvez obtenir un objet `ClientGrpc` de plusieurs façons.

La technique privilégiée est d'importer le module `ClientsModule`. Utilisez la méthode `register()` pour lier un paquet de services défini dans un fichier `.proto` à un jeton d'injection, et pour configurer le service. La propriété `name` est le jeton d'injection. Pour les services gRPC, utilisez `transport : Transport.GRPC`. La propriété `options` est un objet avec les mêmes propriétés que celles décrites [ci-dessus](microservices/grpc#options).

```typescript
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
```

> info **Astuce** La méthode `register()` prend un tableau d'objets. Vous pouvez enregistrer plusieurs paquets en fournissant une liste d'objets d'enregistrement séparés par des virgules.

Une fois enregistré, nous pouvons injecter l'objet `ClientGrpc` configuré avec `@Inject()`. Nous utilisons ensuite la méthode `getService()` de l'objet `ClientGrpc` pour récupérer l'instance de service, comme indiqué ci-dessous.

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

> error **Attention** Le client gRPC n'enverra pas les champs qui contiennent le trait de soulignement `_` dans leur nom à moins que l'option `keepCase` soit fixée à `true` dans la configuration du chargeur de proto (`options.loader.keepcase` dans la configuration du transporteur de microservices).

Remarquez qu'il y a une petite différence par rapport à la technique utilisée dans d'autres méthodes de transport de microservices. Au lieu de la classe `ClientProxy`, nous utilisons la classe `ClientGrpc`, qui fournit la méthode `getService()`. La méthode générique `getService()` prend un nom de service comme argument et retourne son instance (si disponible).

Vous pouvez également utiliser le décorateur `@Client()` pour instancier un objet `ClientGrpc`, comme suit :

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroesService: HeroesService;

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

Enfin, pour des scénarios plus complexes, nous pouvons injecter un client configuré dynamiquement en utilisant la classe `ClientProxyFactory` comme décrit [ici] (/microservices/basics#client).

Dans les deux cas, nous obtenons une référence à notre objet proxy `HeroesService`, qui expose le même ensemble de méthodes que celles définies dans le fichier `.proto`. Maintenant, quand nous accédons à cet objet proxy (c'est-à-dire `heroesService`), le système gRPC sérialise automatiquement les requêtes, les transmet au système distant, renvoie une réponse, et désérialise la réponse. Parce que gRPC nous protège de ces détails de communication réseau, `heroesService` ressemble et agit comme un fournisseur local.

Notez que toutes les méthodes du service sont en **majuscules** (afin de suivre la convention naturelle du langage). Ainsi, par exemple, alors que la définition du fichier `.proto` `HeroesService` contient la fonction `FindOne()`, l'instance `heroesService` fournira la méthode `findOne()`.

```typescript
interface HeroesService {
  findOne(data: { id: number }): Observable<any>;
}
```

Un gestionnaire de message peut également renvoyer un `Observable`, auquel cas les valeurs de résultat seront émises jusqu'à ce que le flux soit terminé.

```typescript
@@filename(heroes.controller)
@Get()
call(): Observable<any> {
  return this.heroesService.findOne({ id: 1 });
}
@@switch
@Get()
call() {
  return this.heroesService.findOne({ id: 1 });
}
```

Pour envoyer des métadonnées gRPC (en même temps que la requête), vous pouvez passer un deuxième argument, comme suit :

```typescript
call(): Observable<any> {
  const metadata = new Metadata();
  metadata.add('Set-Cookie', 'yummy_cookie=choco');

  return this.heroesService.findOne({ id: 1 }, metadata);
}
```

> info **Astuce** La classe `Metadata` est importée du paquet `grpc`.

Notez que cela nécessite la mise à jour de l'interface `HeroesService` que nous avons définie quelques étapes plus tôt.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/04-grpc).

#### Flux de données gRPC

gRPC supporte les connexions en direct à long terme, connues sous le nom de `streams` (flux). Les flux sont utiles dans des cas tels que le chat, les observations ou les transferts de données. Vous trouverez plus de détails dans la documentation officielle [ici](https://grpc.io/docs/guides/concepts/).

Nest prend en charge les gestionnaires de flux GRPC de deux manières différentes :

- RxJS `Subject` + `Observable` handler : peut être utile pour écrire des réponses à l'intérieur d'une méthode de contrôleur ou pour être passé au consommateur `Subject`/`Observable`.
- Gestionnaire de flux d'appels GRPC purs : peut être utile pour être passé à un exécuteur qui gérera le reste de la distribution pour le gestionnaire de flux `Duplex` standard de Node.

<app-banner-enterprise></app-banner-enterprise>

#### Exemple de flux en continu

Définissons un nouvel exemple de service gRPC appelé `HelloService`. Le fichier `hello.proto` est structuré en utilisant [protocol buffers](https://developers.google.com/protocol-buffers). Voici à quoi il ressemble :

```typescript
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> info **Astuce** La méthode `LotsOfGreetings` peut être simplement implémentée avec le décorateur `@GrpcMethod` (comme dans les exemples ci-dessus) puisque le flux retourné peut émettre plusieurs valeurs.

Sur la base de ce fichier `.proto`, définissons l'interface `HelloService` :

```typescript
interface HelloService {
  bidiHello(upstream: Observable<HelloRequest>): Observable<HelloResponse>;
  lotsOfGreetings(
    upstream: Observable<HelloRequest>,
  ): Observable<HelloResponse>;
}

interface HelloRequest {
  greeting: string;
}

interface HelloResponse {
  reply: string;
}
```

> info **Astuce** L'interface proto peut être générée automatiquement par le paquetage [ts-proto](https://github.com/stephenh/ts-proto), apprenez-en plus [ici](https://github.com/stephenh/ts-proto/blob/main/NESTJS.markdown).

#### Stratégie Subject

Le décorateur `@GrpcStreamMethod()` fournit le paramètre de la fonction comme un `Observable` RxJS. Ainsi, nous pouvons recevoir et traiter plusieurs messages.

```typescript
@GrpcStreamMethod()
bidiHello(messages: Observable<any>, metadata: Metadata, call: ServerDuplexStream<any, any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe({
    next: onNext,
    complete: onComplete,
  });


  return subject.asObservable();
}
```

> warning **Attention** Pour supporter l'interaction full-duplex avec le décorateur `@GrpcStreamMethod()`, la méthode du contrôleur doit retourner un `Observable` RxJS.

> info **Astuce** Les classes/interfaces `Metadata` et `ServerUnaryCall` sont importées du paquet `grpc`.

Selon la définition du service (dans le fichier `.proto`), la méthode `BidiHello` doit envoyer des requêtes au service. Pour envoyer plusieurs messages asynchrones au flux depuis un client, nous nous appuyons sur une classe RxJS `ReplaySubject`.

```typescript
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplaySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
```

Dans l'exemple ci-dessus, nous avons écrit deux messages dans le flux (appels `next()`) et notifié au service que nous avions terminé d'envoyer les données (appel `complete()`).

#### Gestionnaire d'appel de flux

Lorsque la valeur de retour de la méthode est définie comme `stream`, le décorateur `@GrpcStreamCall()` fournit le paramètre de fonction comme `grpc.ServerDuplexStream`, qui supporte les méthodes standards comme `.on('data', callback)`, `.write(message)` ou `.cancel()`. Une documentation complète sur les méthodes disponibles est disponible [ici](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html).

Alternativement, lorsque la valeur de retour de la méthode n'est pas un `stream`, le décorateur `@GrpcStreamCall()` fournit deux paramètres de fonction, respectivement `grpc.ServerReadableStream` ([en savoir plus](https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html)) et `callback`.

Commençons par l'implémentation de `BidiHello` qui devrait supporter une interaction full-duplex.

```typescript
@GrpcStreamCall()
bidiHello(requestStream: any) {
  requestStream.on('data', message => {
    console.log(message);
    requestStream.write({
      reply: 'Hello, world!'
    });
  });
}
```

> info **Astuce** Ce décorateur n'exige pas la fourniture d'un paramètre de retour spécifique. On s'attend à ce que le flux soit traité de la même manière que tout autre type de flux standard.

Dans l'exemple ci-dessus, nous avons utilisé la méthode `write()` pour écrire des objets dans le flux de réponse. Le callback passé dans la méthode `.on()` en tant que second paramètre sera appelé à chaque fois que notre service recevra un nouveau morceau de données.

Implémentons la méthode `LotsOfGreetings`.

```typescript
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
```

Ici, nous avons utilisé la fonction `callback` pour envoyer la réponse une fois que le traitement du `requestStream` est terminé.

#### Métadonnées gRPC

Les métadonnées sont des informations sur un appel RPC particulier sous la forme d'une liste de paires clé-valeur, où les clés sont des chaînes de caractères et les valeurs sont généralement des chaînes de caractères mais peuvent être des données binaires. Les métadonnées sont opaques à gRPC lui-même - elles permettent au client de fournir des informations associées à l'appel au serveur et vice versa. Les métadonnées peuvent inclure des jetons d'authentification, des identifiants de requête et des balises à des fins de surveillance, ainsi que des informations de données telles que le nombre d'enregistrements dans un ensemble de données.

Pour lire les métadonnées dans le gestionnaire `@GrpcMethod()`, utilisez le second argument (metadata), qui est de type `Metadata` (importé du paquet `grpc`).

Pour renvoyer les métadonnées du gestionnaire, utilisez la méthode `ServerUnaryCall#sendMetadata()` (troisième argument du gestionnaire).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
```

De même, pour lire les métadonnées dans les gestionnaires annotés avec le gestionnaire `@GrpcStreamMethod()` ([Stratégie Subject](microservices/grpc#stratégie-subject)), utilisez le deuxième argument (metadata), qui est de type `Metadata` (importé du paquet `grpc`).

Pour renvoyer les métadonnées du gestionnaire, utilisez la méthode `ServerDuplexStream#sendMetadata()` (troisième argument du gestionnaire).

Pour lire les métadonnées à partir d'un [gestionnaire d'appel de flux](microservices/grpc#gestionnaire-dappel-de-flux) (handlers annotés avec le décorateur `@GrpcStreamCall()`), écoutez l'événement `metadata` sur la référence `requestStream`, comme suit :

```typescript
requestStream.on('metadata', (metadata: Metadata) => {
  const meta = metadata.get('X-Meta');
});
```
