### Gateways

La plupart des concepts abordés ailleurs dans cette documentation, tels que l'injection de dépendance, les décorateurs, les filtres d'exception, les pipes, les gardes et les intercepteurs, s'appliquent également aux gateways. Dans la mesure du possible, Nest fait abstraction des détails de mise en œuvre afin que les mêmes composants puissent fonctionner sur des plates-formes HTTP, WebSockets et Microservices. Cette section couvre les aspects de Nest qui sont spécifiques aux WebSockets.

Dans Nest, une gateway est simplement une classe annotée avec le décorateur `@WebSocketGateway()`. Techniquement, les gateways sont agnostiques en termes de plateforme, ce qui les rend compatibles avec n'importe quelle bibliothèque WebSockets une fois qu'un adaptateur est créé. Deux plates-formes WS sont prises en charge dès le départ : [socket.io](https://github.com/socketio/socket.io) et [ws](https://github.com/websockets/ws). Vous pouvez choisir celle qui correspond le mieux à vos besoins. Vous pouvez également créer votre propre adaptateur en suivant ce [guide](/websockets/adapter).

<figure><img class="illustrative-image" src="/assets/Gateways_1.png" /></figure>

> info **Astuce** Les gateways peuvent être traitées comme des [providers](/providers) ; cela signifie qu'elles peuvent injecter des dépendances via le constructeur de la classe. Les passerelles peuvent également être injectées par d'autres classes (fournisseurs et contrôleurs).

#### Installation

Pour commencer à créer des applications basées sur les WebSockets, il faut d'abord installer le package requis :

```bash
@@filename()
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
@@switch
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
```

#### Vue d'ensemble

En général, chaque gateway écoute sur le même port que le **serveur HTTP**, à moins que votre application ne soit pas une application web, ou que vous ayez changé le port manuellement. Ce comportement par défaut peut être modifié en passant un argument au décorateur `@WebSocketGateway(80)` où `80` est un numéro de port choisi. Vous pouvez également définir un [namespace](https://socket.io/docs/v4/namespaces/) utilisé par la gateway en utilisant la construction suivante :

```typescript
@WebSocketGateway(80, { namespace: 'events' })
```

> warning **Attention** Les gateways ne sont pas instanciées tant qu'elles ne sont pas référencées dans le tableau des fournisseurs d'un module existant.

Vous pouvez passer n'importe quelle [option](https://socket.io/docs/v4/server-options/) supportée au constructeur de la socket avec le second argument du décorateur `@WebSocketGateway()`, comme montré ci-dessous :

```typescript
@WebSocketGateway(81, { transports: ['websocket'] })
```

La gateway est maintenant à l'écoute, mais nous n'avons pas encore souscrit aux messages entrants. Créons un handler qui s'abonnera aux messages `events` et répondra à l'utilisateur avec exactement les mêmes données.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): string {
  return data;
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  return data;
}
```

> info **Astuce** Les décorateurs `@SubscribeMessage()` et `@MessageBody()` sont importés du package `@nestjs/websockets`.

Une fois la gateway créée, nous pouvons l'enregistrer dans notre module.

```typescript
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@@filename(events.module)
@Module({
  providers: [EventsGateway]
})
export class EventsModule {}
```

Vous pouvez également transmettre une clé de propriété au décorateur pour qu'il l'extraie du corps du message entrant :

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody('id') id: number): number {
  // id === messageBody.id
  return id;
}
@@switch
@Bind(MessageBody('id'))
@SubscribeMessage('events')
handleEvent(id) {
  // id === messageBody.id
  return id;
}
```

Si vous préférez ne pas utiliser de décorateurs, le code suivant est fonctionnellement équivalent :

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(client: Socket, data: string): string {
  return data;
}
@@switch
@SubscribeMessage('events')
handleEvent(client, data) {
  return data;
}
```

Dans l'exemple ci-dessus, la fonction `handleEvent()` prend deux arguments. Le premier est une [instance de socket](https://socket.io/docs/v4/server-api/#socket) spécifique à la plate-forme, tandis que le second est la donnée reçue du client. Cette approche n'est cependant pas recommandée, car elle nécessite de simuler l'instance `socket` dans chaque test unitaire.

Une fois le message `events` reçu, le gestionnaire envoie un accusé de réception avec les mêmes données que celles envoyées sur le réseau. De plus, il est possible d'émettre des messages en utilisant une approche spécifique à la bibliothèque, par exemple en utilisant la méthode `client.emit()`. Pour accéder à une instance de socket connectée, utilisez le décorateur `@ConnectedSocket()`.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @ConnectedSocket() client: Socket,
): string {
  return data;
}
@@switch
@Bind(MessageBody(), ConnectedSocket())
@SubscribeMessage('events')
handleEvent(data, client) {
  return data;
}
```

> info **Astuce** Le décorateur `@ConnectedSocket()` est importé du package `@nestjs/websockets`.

Cependant, dans ce cas, vous ne pourrez pas utiliser les intercepteurs. Si vous ne voulez pas répondre à l'utilisateur, vous pouvez simplement sauter l'instruction `return` (ou retourner explicitement une valeur "falsy", par exemple `undefined`).

Maintenant, lorsqu'un client émet le message suivant :

```typescript
socket.emit('events', { name: 'Nest' });
```

La méthode `handleEvent()` sera exécutée. Afin d'écouter les messages émis par le gestionnaire ci-dessus, le client doit attacher un récepteur d'accusé de réception correspondant :

```typescript
socket.emit('events', { name: 'Nest' }, (data) => console.log(data));
```

#### Réponses multiples

L'accusé de réception n'est envoyé qu'une seule fois. En outre, il n'est pas pris en charge par les implémentations natives des WebSockets. Pour résoudre cette limitation, vous pouvez retourner un objet qui consiste en deux propriétés : `event` qui est le nom de l'événement émis et `data` qui doit être transmis au client.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  const event = 'events';
  return { event, data };
}
```

> info **Astuce** L'interface `WsResponse` est importée du package `@nestjs/websockets`.

> warning **Attention** Vous devez retourner une instance de classe qui implémente `WsResponse` si votre champ `data` repose sur `ClassSerializerInterceptor`, car il ignore les réponses d'objets JavaScript simples.

Afin d'écouter la ou les réponses entrantes, le client doit appliquer un autre écouteur d'événements.

```typescript
socket.on('events', (data) => console.log(data));
```

#### Réponses asynchrones

Les gestionnaires de messages peuvent répondre de manière synchrone ou **asynchrone**. Les méthodes `asynchrones` sont donc supportées. Un gestionnaire de message peut également retourner un `Observable`, auquel cas les valeurs de résultat seront émises jusqu'à ce que le flux soit terminé.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
onEvent(data) {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
```

Dans l'exemple ci-dessus, le gestionnaire de message répondra **3 fois** (avec chaque élément du tableau).

#### Hooks du cycle de vie

Il existe trois hooks utiles pour le cycle de vie. Ils ont tous des interfaces correspondantes et sont décrits dans le tableau suivant :

<table>
  <tr>
    <td>
      <code>OnGatewayInit</code>
    </td>
    <td>
      Oblige à mettre en œuvre la méthode <code>afterInit()</code>. Prend en argument l'instance de serveur spécifique à la bibliothèque (et
      étend le reste si nécessaire).
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayConnection</code>
    </td>
    <td>
      Oblige à mettre en œuvre la méthode <code>handleConnection()</code>. Prend l'instance de socket client spécifique à la bibliothèque
      comme argument.
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayDisconnect</code>
    </td>
    <td>
      Oblige à mettre en œuvre la méthode <code>handleDisconnect()</code>. Prend l'instance de socket client spécifique à la bibliothèque
      comme argument.
    </td>
  </tr>
</table>

> info **Astuce** Chaque interface de cycle de vie est exposée dans le package `@nestjs/websockets`.

#### Serveur et Namespace

Occasionnellement, vous pouvez vouloir avoir un accès direct à l'instance du serveur natif, **spécifique à la plateforme**. La référence à cet objet est passée comme argument à la méthode `afterInit()` (interface `OnGatewayInit`). Une autre option consiste à utiliser le décorateur `@WebSocketServer()`.

```typescript
@WebSocketServer()
server: Server;
```

Vous pouvez également récupérer le namespace correspondant en utilisant l'attribut `namespace`, comme suit :

```typescript
@WebSocketServer({ namespace : 'my-namespace' })
namespace : Namespace ;
```

> warning **Remarque** Le décorateur `@WebSocketServer()` est importé du package `@nestjs/websockets`.

Nest attribuera automatiquement l'instance de serveur à cette propriété lorsqu'elle sera prête à être utilisée.

<app-banner-enterprise></app-banner-enterprise>

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/02-gateways).
