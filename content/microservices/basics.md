### Vue d'ensemble

En plus des architectures d'application traditionnelles (parfois appelées monolithiques), Nest supporte nativement le style architectural de développement en microservices. La plupart des concepts abordés ailleurs dans cette documentation, tels que l'injection de dépendances, les décorateurs, les filtres d'exception, les tuyaux, les gardes et les intercepteurs, s'appliquent également aux microservices. Dans la mesure du possible, Nest fait abstraction des détails de mise en œuvre afin que les mêmes composants puissent être exécutés sur des plates-formes HTTP, des WebSockets et des microservices. Cette section couvre les aspects de Nest qui sont spécifiques aux microservices.

Dans Nest, un microservice est fondamentalement une application qui utilise une couche de **transport** différente de HTTP.

<figure><img class="illustrative-image" src="/assets/Microservices_1.png" /></figure>

Nest supporte plusieurs implémentations intégrées de la couche de transport, appelées **transporteurs**, qui sont responsables de la transmission de messages entre différentes instances de microservices. La plupart des transporteurs supportent nativement les styles de messages **requête-réponse** et **événement**. Nest abstrait les détails d'implémentation de chaque transporteur derrière une interface canonique pour les messages de type requête-réponse et basés sur les événements. Il est ainsi facile de passer d'une couche de transport à une autre - par exemple pour exploiter les caractéristiques de fiabilité ou de performance spécifiques d'une couche de transport particulière - sans affecter le code de votre application.

#### Installation

Pour commencer à construire des microservices, il faut d'abord installer le package requis :

```bash
$ npm i --save @nestjs/microservices
```

#### Pour commencer

Pour instancier un microservice, utilisez la méthode `createMicroservice()` de la classe `NestFactory` :

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  await app.listen();
}
bootstrap();
```

> info **Astuce** Les microservices utilisent par défaut la couche de transport **TCP**.

Le second argument de la méthode `createMicroservice()` est un objet `options`. Cet objet peut être composé de deux membres :

<table>
  <tr>
    <td><code>transport</code></td>
    <td>Spécifie le transporteur (par exemple, <code>Transport.NATS</code>)</td>
  </tr>
  <tr>
    <td><code>options</code></td>
    <td>Un objet d'options spécifiques au transporteur qui détermine le comportement du transporteur</td>
  </tr>
</table>
<p>
  L'objet <code>options</code> est spécifique au transporteur choisi. Le transporteur <strong>TCP</strong> expose les propriétés décrites ci-dessous.  Pour les autres transporteurs (par exemple Redis, MQTT, etc.), voir le chapitre correspondant pour une description des options disponibles.
</p>
<table>
  <tr>
    <td><code>host</code></td>
    <td>Nom d'hôte de la connexion</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Port de connexion</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Nombre de tentatives pour réessayer le message (par défaut : <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Délai entre les tentatives de réessai des messages (ms) (par défaut : <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>serializer</code></td>
    <td><a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/serializer.interface.ts" target="_blank">Sérialiseur</a> personnalisés pour les messages sortants</td>
  </tr>
  <tr>
    <td><code>deserializer</code></td>
    <td><a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/deserializer.interface.ts" target="_blank">Désérialiseur</a> personnalisé pour les messages entrants</td>
  </tr>
  <tr>
    <td><code>socketClass</code></td>
    <td>Une Socket personnalisée qui étend <code>TcpSocket</code> (par défaut : <code>JsonSocket</code>)</td>
  </tr>
  <tr>
    <td><code>tlsOptions</code></td>
    <td>Options pour configurer le protocole tls</td>
  </tr>
</table>


> info **Astuce** Les propriétés ci-dessus sont spécifiques au transporteur TCP. Pour plus d'informations sur les options disponibles pour d'autres transporteurs, reportez-vous au chapitre correspondant.

#### Modèles de messages et d'événements

Les microservices reconnaissent les messages et les événements par des **modèles**. Un modèle est une valeur simple, par exemple un objet littéral ou une chaîne de caractères. Les modèles sont automatiquement sérialisés et envoyés sur le réseau avec les données d'un message. De cette manière, les expéditeurs et les consommateurs de messages peuvent coordonner les demandes qui sont traitées par les différents gestionnaires.

#### Requête-réponse

Le style de message requête-réponse est utile lorsque vous devez **échanger** des messages entre différents services externes. Ce paradigme garantit que le service a effectivement reçu le message (sans qu'il soit nécessaire d'implémenter manuellement un protocole d'accusé de réception). Cependant, l'approche requête-réponse n'est pas toujours la mieux adaptée. Par exemple, les transporteurs de flux, tels que [Kafka](https://docs.confluent.io/3.0.0/streams/) ou [NATS streaming](https://github.com/nats-io/node-nats-streaming), qui utilisent une persistance basée sur les journaux, sont optimisés pour répondre à un ensemble différent de défis, plus alignés sur le paradigme de la messagerie événementielle (voir [messagerie événementielle](/microservices/basics#messagerie-événementielle) ci-dessous pour plus de détails).

Pour activer le type de message requête-réponse, Nest crée deux canaux logiques : l'un pour le transfert des données et l'autre pour l'attente des réponses entrantes. Pour certains transports sous-jacents, comme [NATS](https://nats.io/), cette prise en charge à double canal est fournie d'emblée. Pour d'autres, Nest compense en créant manuellement des canaux distincts. Bien que cette méthode soit efficace, elle peut entraîner une certaine surcharge. Par conséquent, si vous n'avez pas besoin d'un message de type demande-réponse, vous pouvez envisager d'utiliser la méthode basée sur les événements.

Pour créer un gestionnaire de message basé sur le paradigme requête-réponse, utilisez le décorateur `@MessagePattern()`, qui est importé du paquetage `@nestjs/microservices`. Ce décorateur ne doit être utilisé que dans les classes [controller](/controllers), car elles servent de point d'entrée à votre application. L'utiliser dans les providers n'aura aucun effet, car ils seront ignorés par le runtime Nest.

```typescript
@@filename(math.controller)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
@@switch
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
```

Dans le code ci-dessus, le **gestionnaire de messages** `accumulate()` écoute les messages qui correspondent au modèle de message `{{ '{' }} cmd : 'sum' {{ '}' }}`. Le gestionnaire de message prend un seul argument, les `données` transmises par le client. Dans ce cas, les données sont un tableau de nombres qui doivent être accumulés.

#### Réponses asynchrones

Les gestionnaires de messages peuvent répondre de manière synchrone ou **asynchrone**. Les méthodes `async` sont donc supportées.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
async accumulate(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@MessagePattern({ cmd: 'sum' })
async accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

Un gestionnaire de message peut également renvoyer un `Observable`, auquel cas les valeurs de résultat seront émises jusqu'à ce que le flux soit terminé.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
@@switch
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
```

Dans l'exemple ci-dessus, le gestionnaire de message répondra **trois fois**, une fois pour chaque élément du tableau.

#### Messagerie événementielle

Si la méthode demande-réponse est parfaite pour l'échange de messages entre services, elle est moins adaptée à la messagerie événementielle, lorsque vous souhaitez simplement publier des **événements** sans attendre de réponse. Dans ce cas, il n'est pas nécessaire de maintenir deux canaux pour la méthode demande-réponse.

Par exemple, si vous souhaitez informer un autre service qu'une condition spécifique s'est produite dans cette partie du système, le style de message basé sur les événements est idéal.

Pour créer un gestionnaire d'événement, vous pouvez utiliser le décorateur `@EventPattern()`, qui est importé du package `@nestjs/microservices`.

```typescript
@@filename()
@EventPattern('user_created')
async handleUserCreated(data: Record<string, unknown>) {
  // logique métier
}
@@switch
@EventPattern('user_created')
async handleUserCreated(data) {
  // logique métier
}
```

> info **Astuce** Vous pouvez enregistrer plusieurs gestionnaires d'événements pour un **seul** modèle d'événement et tous seront automatiquement déclenchés en parallèle.

Le **manipulateur d'événements** `handleUserCreated()` écoute l'événement `'user_created'`. Le gestionnaire d'événement prend un seul argument, les `données` transmises par le client (dans ce cas, une charge utile d'événement qui a été envoyée sur le réseau).

<app-banner-enterprise></app-banner-enterprise>

#### Détails supplémentaires de la requête

Dans des scénarios plus avancés, vous pouvez avoir besoin d'accéder à des détails supplémentaires sur la demande entrante. Par exemple, lorsque vous utilisez NATS avec des abonnements de type « wildcard », vous pouvez vouloir récupérer le sujet original auquel le producteur a envoyé le message. De même, avec Kafka, vous pouvez avoir besoin d'accéder aux en-têtes du message. Pour ce faire, vous pouvez utiliser les décorateurs intégrés comme indiqué ci-dessous :

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // par exemple "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // par exemple "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `NatsContext` sont importés de `@nestjs/microservices`.

> info **Astuce** Vous pouvez également passer une clé de propriété au décorateur `@Payload()` pour extraire une propriété spécifique de l'objet payload entrant, par exemple, `@Payload('id')`.

#### Client (classe producteur)

Une application Nest cliente peut échanger des messages ou publier des événements vers un microservice Nest en utilisant la classe `ClientProxy`. Cette classe fournit plusieurs méthodes, telles que `send()` (pour la messagerie requête-réponse) et `emit()` (pour la messagerie événementielle), permettant la communication avec un microservice distant. Vous pouvez obtenir une instance de cette classe de la manière suivante :

Une approche consiste à importer le module `ClientsModule`, qui expose la méthode statique `register()`. Cette méthode prend un tableau d'objets représentant des transporteurs de microservices. Chaque objet doit inclure une propriété `name`, et optionnellement une propriété `transport` (par défaut `Transport.TCP`), ainsi qu'une propriété optionnelle `options`.

La propriété `name` agit comme un **jeton d'injection**, que vous pouvez utiliser pour injecter une instance de `ClientProxy` partout où cela est nécessaire. La valeur de cette propriété `name` peut être n'importe quelle chaîne arbitraire ou symbole JavaScript, comme décrit [ici](/fundamentals/custom-providers#jetons-de-fournisseur-non-basés-sur-une-classe).

La propriété `options` est un objet qui inclue les mêmes propriétés que nous avons vu dans la méthode `createMicroservice()` plus tôt.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP },
    ]),
  ],
})
```
 
Vous pouvez également utiliser la méthode `registerAsync()` si vous avez besoin de fournir une configuration ou d'effectuer d'autres processus asynchrones pendant l'installation.

```typescript
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'MATH_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            url: configService.get('URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
```

Une fois le module importé, vous pouvez injecter une instance du `ClientProxy` configuré avec les options spécifiées pour le transporteur `'MATH_SERVICE'` en utilisant le décorateur `@Inject()`.

```typescript
constructor(
  @Inject('MATH_SERVICE') private client: ClientProxy,
) {}
```

> info **Astuce** Les classes `ClientsModule` et `ClientProxy` sont importées du package `@nestjs/microservices`.

Parfois, vous pouvez avoir besoin de récupérer la configuration du transporteur depuis un autre service (comme un `ConfigService`), plutôt que de la coder en dur dans votre application cliente. Pour cela, vous pouvez enregistrer un [fournisseur personnalisé](/fundamentals/custom-providers) en utilisant la classe `ClientProxyFactory`. Cette classe fournit une méthode statique `create()` qui accepte un objet d'options de transport et renvoie une instance de `ClientProxy` personnalisée.

```typescript
@Module({
  providers: [
    {
      provide: 'MATH_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mathSvcOptions = configService.getMathSvcOptions();
        return ClientProxyFactory.create(mathSvcOptions);
      },
      inject: [ConfigService],
    }
  ]
  ...
})
```

> info **Astuce** Le `ClientProxyFactory` est importé du package `@nestjs/microservices`.

Une autre option consiste à utiliser le décorateur de propriétés `@Client()`.

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **Astuce** Le décorateur `@Client()` est importé du package `@nestjs/microservices`.

L'utilisation du décorateur `@Client()` n'est pas la technique préférée, car il est plus difficile de tester et de partager une instance de client.

Le `ClientProxy` est **lazy**. Il n'initie pas de connexion immédiatement. Au lieu de cela, elle sera établie avant le premier appel au microservice, puis réutilisée pour chaque appel suivant. Cependant, si vous voulez retarder le processus de démarrage de l'application jusqu'à ce qu'une connexion soit établie, vous pouvez initier manuellement une connexion en utilisant la méthode `connect()` de l'objet `ClientProxy` à l'intérieur du hook du cycle de vie `OnApplicationBootstrap`.

```typescript
@@filename()
async onApplicationBootstrap() {
  await this.client.connect();
}
```

Si la connexion ne peut pas être créée, la méthode `connect()` sera rejetée avec l'objet d'erreur correspondant.

#### Envoi de messages

Le `ClientProxy` expose une méthode `send()`. Cette méthode est destinée à appeler le microservice et retourne un `Observable` avec sa réponse. Ainsi, nous pouvons facilement nous abonner aux valeurs émises.

```typescript
@@filename()
accumulate(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
@@switch
accumulate() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
```

La méthode `send()` prend deux arguments, `pattern` et `payload`. Le `pattern` doit correspondre à un modèle défini dans un décorateur `@MessagePattern()`. Le `payload` est un message que nous voulons transmettre au microservice distant. Cette méthode retourne un **cold `Observable`**, ce qui signifie que vous devez explicitement vous y abonner avant que le message ne soit envoyé.

#### Publication d'événements

Pour envoyer un événement, utilisez la méthode `emit()` de l'objet `ClientProxy`. Cette méthode publie un événement au courtier de messages.

```typescript
@@filename()
async publish() {
  this.client.emit<number>('user_created', new UserCreatedEvent());
}
@@switch
async publish() {
  this.client.emit('user_created', new UserCreatedEvent());
}
```

La méthode `emit()` prend deux arguments : `pattern` et `payload`. Le `pattern` doit correspondre à un décorateur `@EventPattern()`, tandis que le `payload` représente les données de l'événement que vous voulez transmettre au microservice distant. Cette méthode retourne un **hot `Observable`** (en contraste avec le `Observable` "froid" retourné par `send()`), ce qui signifie qu'indépendamment du fait que vous vous abonniez explicitement à l'observable, le proxy va immédiatement essayer de délivrer l'événement.

<app-banner-devtools></app-banner-devtools>

#### Définition de la portée de la requête

Pour ceux qui viennent d'horizons différents en matière de langages de programmation, il peut être surprenant d'apprendre que dans Nest, la plupart des choses sont partagées entre les requêtes entrantes. Cela inclut un pool de connexion à la base de données, des services singleton avec un état global, et plus encore. N'oubliez pas que Node.js ne suit pas le modèle sans état multithread requête/réponse, dans lequel chaque requête est traitée par un thread distinct. Par conséquent, l'utilisation d'instances singleton est **sûre** pour nos applications.

Cependant, dans certains cas, il peut être souhaitable que la durée de vie du gestionnaire soit basée sur les requêtes. Il peut s'agir de scénarios tels que la mise en cache par requête dans les applications GraphQL, le suivi des requêtes ou la multi-location. Vous pouvez en savoir plus sur la manière de contrôler les portées [ici](/fundamentals/injection-scopes).

Les handlers et les providers à portée de requête peuvent injecter `RequestContext` en utilisant le décorateur `@Inject()` en combinaison avec le jeton `CONTEXT` :

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private ctx: RequestContext) {}
}
```

Cela permet d'accéder à l'objet `RequestContext`, qui possède deux propriétés :

```typescript
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
```

La propriété `data` est la charge utile du message envoyé par le producteur du message. La propriété `pattern` est le modèle utilisé pour identifier le gestionnaire approprié pour traiter le message entrant.

#### Mises à jour de l'état de l'instance

Pour obtenir des mises à jour en temps réel sur la connexion et l'état de l'instance du pilote sous-jacent, vous pouvez vous abonner au flux `status`. Ce flux fournit des mises à jour d'état spécifiques au pilote choisi. Par exemple, si vous utilisez le transporteur TCP (par défaut), le flux `status` émet les événements `connected` et `disconnected`.

```typescript
this.client.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

> info **Astuce** Le type `TcpStatus` est importé du paquetage `@nestjs/microservices`.

De même, vous pouvez vous abonner au flux `status` du serveur pour recevoir des notifications sur le statut du serveur.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

#### Écouter les événements internes

Dans certains cas, vous pouvez vouloir écouter les événements internes émis par le microservice. Par exemple, vous pourriez écouter l'événement `error` pour déclencher des opérations supplémentaires lorsqu'une erreur se produit. Pour ce faire, utilisez la méthode `on()`, comme montré ci-dessous :

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

De même, vous pouvez écouter les événements internes du serveur :

```typescript
server.on<TcpEvents>('error', (err) => {
  console.error(err);
});
```

> info **Astuce** Le type `TcpEvents` est importé du paquetage `@nestjs/microservices`.

#### Accès au pilote sous-jacent

Pour des cas d'utilisation plus avancés, vous pouvez avoir besoin d'accéder à l'instance du pilote sous-jacent. Cela peut être utile pour des scénarios tels que la fermeture manuelle de la connexion ou l'utilisation de méthodes spécifiques au pilote. Cependant, gardez à l'esprit que dans la plupart des cas, vous **ne devriez pas avoir besoin** d'accéder directement au pilote.

Pour ce faire, vous pouvez utiliser la méthode `unwrap()`, qui renvoie l'instance du pilote sous-jacent. Le paramètre de type générique doit spécifier le type d'instance de pilote que vous attendez.

```typescript
const netServer = this.client.unwrap<Server>();
```

Ici, `Server` est un type importé du module `net`.

De la même manière, vous pouvez accéder à l'instance du pilote sous-jacent du serveur :

```typescript
const netServer = server.unwrap<Server>();
```

#### Gestion des dépassements de délai

Dans les systèmes distribués, les microservices peuvent parfois être en panne ou indisponibles. Pour éviter une attente indéfiniment longue, vous pouvez utiliser des délais d'attente. Un délai d'attente est un modèle très utile lors de la communication avec d'autres services. Pour appliquer des timeouts à vos appels de microservices, vous pouvez utiliser l'opérateur [RxJS](https://rxjs.dev) `timeout`. Si le microservice ne répond pas dans le délai spécifié, une exception est levée, que vous pouvez attraper et gérer de manière appropriée.

Pour cela, vous devez utiliser le paquetage [`rxjs`](https://github.com/ReactiveX/rxjs). Il suffit d'utiliser l'opérateur `timeout` dans le pipe :

```typescript
@@filename()
this.client
    .send<TResult, TInput>(pattern, data)
    .pipe(timeout(5000));
@@switch
this.client
    .send(pattern, data)
    .pipe(timeout(5000));
```

> info **Astuce** L'opérateur `timeout` est importé du package `rxjs/operators`.

Après 5 secondes, si le microservice ne répond pas, il lance une erreur.

#### Prise en charge TLS

Lorsque l'on communique en dehors d'un réseau privé, il est important de chiffrer le trafic pour garantir la sécurité. Dans NestJS, cela peut être réalisé avec TLS sur TCP en utilisant le module [TLS](https://nodejs.org/api/tls.html) intégré de Node. Nest fournit un support intégré pour TLS dans son transport TCP, ce qui nous permet de chiffrer la communication entre les microservices ou les clients.

Pour activer TLS pour un serveur TCP, vous aurez besoin d'une clé privée et d'un certificat au format PEM. Ceux-ci sont ajoutés aux options du serveur en définissant `tlsOptions` et en spécifiant les fichiers de clé et de certificat, comme indiqué ci-dessous :

```typescript
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const key = fs.readFileSync('<pathToKeyFile>', 'utf8').toString();
  const cert = fs.readFileSync('<pathToCertFile>', 'utf8').toString();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        tlsOptions: {
          key,
          cert,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
```

Pour qu'un client puisse communiquer de manière sécurisée via TLS, nous définissons également l'objet `tlsOptions`, mais cette fois avec le certificat CA. Il s'agit du certificat de l'autorité qui a signé le certificat du serveur. Cela garantit que le client fait confiance au certificat du serveur et peut établir une connexion sécurisée.

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          tlsOptions: {
            ca: [fs.readFileSync('<pathToCaFile>', 'utf-8').toString()],
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Vous pouvez aussi passer un tableau de CAs si votre configuration implique plusieurs autorités de confiance.

Une fois que tout est configuré, vous pouvez injecter le `ClientProxy` comme d'habitude en utilisant le décorateur `@Inject()` pour utiliser le client dans vos services. Cela assure une communication chiffrée à travers vos microservices NestJS, le module `TLS` de Node gérant les détails du chiffrement.

Pour plus d'informations, reportez-vous à la [documentation TLS](https://nodejs.org/api/tls.html) de Node.