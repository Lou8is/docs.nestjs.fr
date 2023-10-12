### Adaptateurs

Le module WebSockets est agnostique, vous pouvez donc apporter votre propre bibliothèque (ou même une implémentation native) en utilisant l'interface `WebSocketAdapter`. Cette interface oblige à implémenter quelques méthodes décrites dans le tableau suivant :

<table>
  <tr>
    <td><code>create</code></td>
    <td>Crée une instance de socket sur la base des arguments fournis</td>
  </tr>
  <tr>
    <td><code>bindClientConnect</code></td>
    <td>Lie l'événement de connexion du client</td>
  </tr>
  <tr>
    <td><code>bindClientDisconnect</code></td>
    <td>Lie l'événement de déconnexion du client (optionnel*)</td>
  </tr>
  <tr>
    <td><code>bindMessageHandlers</code></td>
    <td>Relie le message entrant au gestionnaire de message correspondant</td>
  </tr>
  <tr>
    <td><code>close</code></td>
    <td>Met fin à une instance de serveur</td>
  </tr>
</table>

#### Étendre socket.io

Le package [socket.io](https://github.com/socketio/socket.io) est enveloppé dans une classe `IoAdapter`. Que se passe-t-il si vous souhaitez améliorer la fonctionnalité de base de l'adaptateur ? Par exemple, vos exigences techniques requièrent une capacité à diffuser des événements à travers de multiples instances de votre service web. Pour cela, vous pouvez étendre `IoAdapter` et surcharger une méthode unique dont la responsabilité est d'instancier de nouveaux serveurs socket.io. Mais tout d'abord, installons le package nécessaire.

> warning **Attention** Pour utiliser socket.io avec plusieurs instances à load-balancées, vous devez soit désactiver le polling en réglant `transports : ['websocket']` dans la configuration de socket.io de vos clients ou vous devez activer le routage basé sur les cookies dans votre équilibreur de charge. Redis seul n'est pas suffisant. Voir [ici](https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session) pour plus d'informations.

```bash
$ npm i --save redis socket.io @socket.io/redis-adapter
```

Une fois le package installé, nous pouvons créer une classe `RedisIoAdapter`.

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://localhost:6379` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

Ensuite, il suffit de basculer vers l'adaptateur Redis nouvellement créé.

```typescript
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();

app.useWebSocketAdapter(redisIoAdapter);
```

#### Bibliothèque Ws

Un autre adaptateur disponible est le `WsAdapter` qui agit comme un proxy entre le framework et la bibliothèque [ws](https://github.com/websockets/ws), rapide et soigneusement testée. Cet adaptateur est entièrement compatible avec les WebSockets natifs des navigateurs et est bien plus rapide que le package socket.io. Malheureusement, il a beaucoup moins de fonctionnalités disponibles par défaut. Dans certains cas, vous n'en avez pas nécessairement besoin.

> info **Astuce** La bibliothèque `ws` ne supporte pas les espaces de noms (canaux de communication popularisés par `socket.io`). Cependant, pour imiter cette fonctionnalité, vous pouvez monter plusieurs serveurs `ws` sur des chemins différents (exemple : `@WebSocketGateway({{ '{' }} path : '/users' {{ '}' }})`).

Afin d'utiliser `ws`, nous devons tout d'abord installer le package requis :

```bash
$ npm i --save @nestjs/platform-ws
```

Une fois le package installé, nous pouvons changer d'adaptateur :

```typescript
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

> info **Astuce** Le `WsAdapter` est importé de `@nestjs/platform-ws`.

#### Avancé (adaptateur personnalisé)

Pour la démonstration, nous allons intégrer manuellement la bibliothèque [ws](https://github.com/websockets/ws). Comme mentionné, l'adaptateur pour cette bibliothèque est déjà créé et est exposé depuis le package `@nestjs/platform-ws` en tant que classe `WsAdapter`. Voici à quoi pourrait ressembler l'implémentation simplifiée :

```typescript
@@filename(ws-adapter)
import * as WebSocket from 'ws';
import { WebSocketAdapter, INestApplicationContext } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
```

> info **Astuce** Si vous voulez profiter de la bibliothèque [ws](https://github.com/websockets/ws), utilisez l'adaptateur intégré `WsAdapter` au lieu de créer votre propre adaptateur.

Ensuite, nous pouvons mettre en place un adaptateur personnalisé en utilisant la méthode `useWebSocketAdapter()` :

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

#### Exemple

Un exemple de travail utilisant `WsAdapter` est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/16-gateways-ws).
