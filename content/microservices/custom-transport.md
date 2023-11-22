### Transporteurs personnalisés

Nest fournit une variété de **transporteurs** prêts à l'emploi, ainsi qu'une API permettant aux développeurs d'élaborer de nouvelles stratégies de transport personnalisées. Les transporteurs vous permettent de connecter des composants sur un réseau à l'aide d'une couche de communication enfichable et d'un protocole de message très simple au niveau de l'application (lire l'intégralité de l'[article](https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3)).

> info **Astuce** Construire un microservice avec Nest ne signifie pas nécessairement que vous devez utiliser le package `@nestjs/microservices`. Par exemple, si vous voulez communiquer avec des services externes (disons d'autres microservices écrits dans des langages différents), vous n'aurez peut-être pas besoin de toutes les fonctionnalités fournies par la bibliothèque `@nestjs/microservice`.
> En fait, si vous n'avez pas besoin de décorateurs (`@EventPattern` ou `@MessagePattern`) qui vous permettent de définir les abonnés de manière déclarative, lancer une [Application autonome](/application-context) et maintenir manuellement les connexions/abonnements aux canaux devrait être suffisant pour la plupart des cas d'utilisation et vous fournira plus de flexibilité.

Avec un transporteur personnalisé, vous pouvez intégrer n'importe quel système/protocole de messagerie (y compris Google Cloud Pub/Sub, Amazon Kinesis, et d'autres) ou étendre le système existant, en ajoutant des fonctionnalités supplémentaires (par exemple, [QoS](https://github.com/mqttjs/MQTT.js/blob/master/README.md#qos) pour MQTT).

> info **Astuce** Pour mieux comprendre le fonctionnement des microservices Nest et la manière dont vous pouvez étendre les capacités des transporteurs existants, nous vous recommandons de lire les séries d'articles [NestJS Microservices in Action](https://dev.to/johnbiundo/series/4724) et [Advanced NestJS Microservices] (https://dev.to/nestjs/part-1-introduction-and-setup-1a2l).

#### Créer une stratégie

Tout d'abord, définissons une classe représentant notre transporteur personnalisé.

```typescript
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy {
  /**
   * Cette méthode est déclenchée lorsque vous exécutez "app.listen()".
   */
  listen(callback: () => void) {
    callback();
  }

  /**
   * Cette méthode est déclenchée lors de l'arrêt de l'application.
   */
  close() {}
}
```

> warning **Astuce** Veuillez noter que nous ne mettrons pas en œuvre un serveur Google Cloud Pub/Sub complet dans ce chapitre, car cela nécessiterait de plonger dans les détails techniques spécifiques au transporteur.

Dans notre exemple ci-dessus, nous avons déclaré la classe `GoogleCloudPubSubServer` et fourni les méthodes `listen()` et `close()` appliquées par l'interface `CustomTransportStrategy`.
De plus, notre classe étend la classe `Server` importée du package `@nestjs/microservices` qui fournit quelques méthodes utiles, par exemple, les méthodes utilisées par le runtime Nest pour enregistrer les gestionnaires de messages. Alternativement, dans le cas où vous voulez étendre les capacités d'une stratégie de transport existante, vous pouvez étendre la classe serveur correspondante, par exemple, `ServerRedis`.
Conventionnellement, nous avons ajouté le suffixe `"Server"` à notre classe car elle sera responsable de l'abonnement aux messages/événements (et d'y répondre, si nécessaire).

Ainsi, nous pouvons maintenant utiliser notre stratégie personnalisée au lieu d'utiliser un transporteur intégré, comme suit :

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new GoogleCloudPubSubServer(),
  },
);
```

En fait, au lieu de passer l'objet d'options normal du transporteur avec les propriétés `transport` et `options`, nous passons une seule propriété, `strategy`, dont la valeur est une instance de notre classe de transporteur personnalisée.

Pour en revenir à notre classe `GoogleCloudPubSubServer`, dans une application réelle, nous devrions établir une connexion avec notre courtier de messages/service externe et enregistrer des abonnés/écouter des canaux spécifiques dans la méthode `listen()` (puis supprimer les abonnements et fermer la connexion dans la méthode de démontage `close()`), mais comme cela nécessite une bonne compréhension de la façon dont les microservices Nest communiquent entre eux, nous vous recommandons de lire cette [série d'articles](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l).
Dans ce chapitre, nous allons plutôt nous concentrer sur les capacités de la classe `Server` et comment vous pouvez les exploiter pour construire des stratégies personnalisées.

Par exemple, disons que quelque part dans notre application, le gestionnaire de message suivant est défini :

```typescript
@MessagePattern('echo')
echo(@Payload() data: object) {
  return data;
}
```

Ce gestionnaire de messages sera automatiquement enregistré par le système d'exécution Nest. Avec la classe `Server`, vous pouvez voir quels modèles de messages ont été enregistrés et aussi, accéder et exécuter les méthodes qui leur ont été assignées.
Pour tester ceci, ajoutons un simple `console.log` dans la méthode `listen()` avant que la fonction `callback` ne soit appelée :

```typescript
listen(callback: () => void) {
  console.log(this.messageHandlers);
  callback();
}
```

Après le redémarrage de votre application, vous verrez le journal suivant dans votre terminal :

```typescript
Map { 'echo' => [AsyncFunction] { isEventHandler: false } }
```

> info **Astuce** Si nous utilisions le décorateur `@EventPattern`, vous verriez le même résultat, mais avec la propriété `isEventHandler` fixée à `true`.

Comme vous pouvez le voir, la propriété `messageHandlers` est une collection `Map` de tous les gestionnaires de messages (et d'événements), dans laquelle les modèles sont utilisés comme clés.
Maintenant, vous pouvez utiliser une clé (par exemple, `"echo"`) pour recevoir une référence au gestionnaire de message :

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  console.log(await echoHandler('Hello world!'));
  callback();
}
```

Une fois que nous avons exécuté le `echoHandler` en passant une chaîne arbitraire comme argument (ici `"Hello world !"`), nous devrions le voir dans la console :

```json
Hello world!
```

Cela signifie que notre gestionnaire de méthode a été correctement exécuté.

Lorsque l'on utilise une `CustomTransportStrategy` avec des [Intercepteurs](/interceptors), les handlers sont enveloppés dans des flux RxJS. Cela signifie que vous devez vous y abonner afin d'exécuter la logique sous-jacente des flux (par exemple, continuer dans la logique du contrôleur après qu'un intercepteur ait été exécuté).

Un exemple est donné ci-dessous :

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  const streamOrResult = await echoHandler('Hello World');
  if (isObservable(streamOrResult)) {
    streamOrResult.subscribe();
  }
  callback();
}
```

#### Proxy de client

Comme nous l'avons mentionné dans la première section, vous n'avez pas nécessairement besoin d'utiliser le package `@nestjs/microservices` pour créer des microservices, mais si vous décidez de le faire et que vous avez besoin d'intégrer une stratégie personnalisée, vous devrez également fournir une classe "client".

> info **Astuce** Encore une fois, l'implémentation d'une classe client complète compatible avec toutes les fonctionnalités de `@nestjs/microservices` (par exemple, le streaming) nécessite une bonne compréhension des techniques de communication utilisées par le framework. Pour en savoir plus, consultez cet [article](https://dev.to/nestjs/part-4-basic-client-component-16f9).

Pour communiquer avec un service externe/émettre et publier des messages (ou des événements), vous pouvez soit utiliser un package SDK spécifique à la bibliothèque, soit implémenter une classe client personnalisée qui étend le `ClientProxy`, comme suit :

```typescript
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {}
  async close() {}
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {}
  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {}
}
```

> warning **Attention** Veuillez noter que nous ne mettrons pas en œuvre un client Google Cloud Pub/Sub complet dans ce chapitre, car cela nécessiterait de plonger dans les détails techniques spécifiques au transporteur.

Comme vous pouvez le voir, la classe `ClientProxy` nous demande de fournir plusieurs méthodes pour établir et fermer la connexion et publier des messages (`publish`) et des événements (`dispatchEvent`).
Notez que si vous n'avez pas besoin d'un support de communication de type requête-réponse, vous pouvez laisser la méthode `publish()` vide. De même, si vous n'avez pas besoin de supporter une communication basée sur les évènements, ignorez la méthode `dispatchEvent()`.

Pour observer quand et comment ces méthodes sont exécutées, ajoutons plusieurs appels à `console.log`, comme suit :

```typescript
class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    console.log('connect');
  }

  async close() {
    console.log('close');
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {
    console.log('message:', packet);

    // Dans une application réelle, la fonction "callback" doit être exécutée
    // avec la charge utile renvoyée par le répondeur. Ici, nous allons simplement simuler (délai de 5 secondes)
    // que la réponse arrive en transmettant les mêmes "données" que celles que nous avons transmises à l'origine.
    setTimeout(() => callback({ response: packet.data }), 5000);

    return () => console.log('teardown');
  }
}
```

Avec ceci en place, créons une instance de la classe `GoogleCloudPubSubClient` et lançons la méthode `send()` (que vous avez pu voir dans les chapitres précédents), en nous abonnant au flux observable retourné.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .subscribe((response) => console.log(response));
```

Vous devriez maintenant voir la sortie suivante dans votre terminal :

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
Hello world! // <-- après 5 secondes
```

Pour tester si notre méthode "teardown" (que notre méthode `publish()` retourne) est correctement exécutée, appliquons un opérateur timeout à notre stream, en le fixant à 2 secondes pour s'assurer qu'il se lance avant que notre `setTimeout` n'appelle la fonction `callback`.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .pipe(timeout(2000))
  .subscribe(
    (response) => console.log(response),
    (error) => console.error(error.message),
  );
```

> info **Astuce** L'opérateur `timeout` est importé du paquet `rxjs/operators`.

Avec l'opérateur `timeout` appliqué, la sortie de votre terminal devrait ressembler à ce qui suit :

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
teardown // <-- teardown
Timeout has occurred
```

Pour envoyer un événement (au lieu d'envoyer un message), utilisez la méthode `emit()` :

```typescript
googlePubSubClient.emit('event', 'Hello world!');
```

C'est ce que vous devriez voir dans la console :

```typescript
connect
event to dispatch:  { pattern: 'event', data: 'Hello world!' }
```

#### Sérialisation des messages

Si vous avez besoin d'ajouter une logique personnalisée autour de la sérialisation des réponses du côté client, vous pouvez utiliser une classe personnalisée qui étend la classe `ClientProxy` ou l'une de ses classes enfantines. Pour modifier les requêtes réussies, vous pouvez surcharger la méthode `serializeResponse`, et pour modifier toutes les erreurs qui passent par ce client, vous pouvez surcharger la méthode `serializeError`. Pour utiliser cette classe personnalisée, vous pouvez passer la classe elle-même à la méthode `ClientsModule.register()` en utilisant la propriété `customClass`. Voici un exemple de `ClientProxy` personnalisé qui sérialise chaque erreur dans une `RpcException`.

```typescript
@@filename(error-handling.proxy)
import { ClientTcp, RpcException } from '@nestjs/microservices';

class ErrorHandlingProxy extends ClientTCP {
  serializeError(err: Error) {
    return new RpcException(err);
  }
}
```

et l'utiliser ensuite dans le module `Clients` comme suit :

```typescript
@@filename(app.module)
@Module({
  imports: [
    ClientsModule.register({
      name: 'CustomProxy',
      customClass: ErrorHandlingProxy,
    }),
  ]
})
export class AppModule
```

> info **Astuce** C'est la classe elle-même qui est passée à `customClass`, et non une instance de la classe. Nest créera l'instance sous le capot pour vous, et passera toutes les options données dans la propriété `options` au nouveau `ClientProxy`.
