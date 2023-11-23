### Événements

Le package [Event Emitter](https://www.npmjs.com/package/@nestjs/event-emitter) (`@nestjs/event-emitter`) fournit une implémentation simple d'observateur, vous permettant de vous abonner et d'écouter les différents événements qui se produisent dans votre application. Les événements sont un excellent moyen de découpler les différents aspects de votre application, puisqu'un seul événement peut avoir plusieurs auditeurs qui ne dépendent pas les uns des autres.

`EventEmitterModule` utilise en interne le package [eventemitter2](https://github.com/EventEmitter2/EventEmitter2).

#### Pour commencer

Installez d'abord le package requis :

```shell
$ npm i --save @nestjs/event-emitter
```

Une fois l'installation terminée, importez le module `EventEmitterModule` dans le module racine `AppModule` et exécutez la méthode statique `forRoot()` comme indiqué ci-dessous :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
```

L'appel `.forRoot()` initialise l'émetteur d'événements et enregistre tous les récepteurs d'événements déclaratifs qui existent dans votre application. L'enregistrement a lieu lorsque le hook du cycle de vie `onApplicationBootstrap` se produit, en s'assurant que tous les modules ont été chargés et ont déclaré tous les travaux planifiés.

Pour configurer l'instance `EventEmitter` sous-jacente, passez l'objet de configuration à la méthode `.forRoot()`, comme suit :

```typescript
EventEmitterModule.forRoot({
  // mettre ce paramètre à `true` pour utiliser les caractères joker
  wildcard: false,
  // le délimiteur utilisé pour segmenter les espaces de noms
  delimiter: '.',
  // mettez ceci à `true` si vous voulez émettre l'événement newListener
  newListener: false,
  // mettez ceci à `true` si vous voulez émettre l'événement removeListener
  removeListener: false,
  // le nombre maximum d'auditeurs pouvant être affectés à un événement
  maxListeners: 10,
  // afficher le nom de l'événement dans le message de fuite de mémoire lorsque le nombre d'auditeurs attribués est supérieur au nombre maximal.
  verboseMemoryLeak: false,
  // désactiver le lancement de uncaughtException si un événement d'erreur est émis et qu'il n'a pas d'auditeurs
  ignoreErrors: false,
});
```

#### Envoi d'événements

Pour envoyer (c'est-à-dire déclencher) un événement, il faut d'abord injecter `EventEmitter2` en utilisant l'injection de constructeur standard :

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **Astuce** Importez le `EventEmitter2` depuis le package `@nestjs/event-emitter`.

Utilisez-le ensuite dans une classe comme suit :

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### Écouter les événements

Pour déclarer un récepteur d'événements, décorez une méthode avec le décorateur `@OnEvent()` précédant la définition de la méthode contenant le code à exécuter, comme suit :

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

> warning **Attention** Les abonnés aux événements ne peuvent pas faire l'objet d'une requête.

Le premier argument peut être une `string` ou un `symbol` pour un émetteur d'événement simple et un `string | symbol | Array<string | symbol>` dans le cas d'un émetteur joker.

Le second argument (optionnel) est un objet d'options d'écoute comme suit:


```typescript
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of append) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", the onEvent callback will not throw an error while handling the event. Otherwise, if "false" it will throw an error.
   * 
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **Astuce** En savoir plus sur l'objet d'options OnOptions depuis [`eventemitter2`](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean).

Pour utiliser les espaces de noms et les jokers, passez l'option `wildcard` dans la méthode `EventEmitterModule#forRoot()`. Lorsque les espaces de noms et les caractères génériques sont activés, les événements peuvent être soit des chaînes de caractères (`foo.bar`) séparées par un délimiteur, soit des tableaux (`['foo', 'bar']`). Le délimiteur est également configurable en tant que propriété de configuration (`delimiter`). Avec la fonctionnalité namespaces activée, vous pouvez vous abonner à des événements en utilisant un joker :

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // gère et traite un événement
}
```

Notez qu'un tel joker ne s'applique qu'à un seul bloc. L'argument `order.*` correspondra, par exemple, aux événements `order.created` et `order.shipped` mais pas à `order.delayed.out_of_stock`. Afin d'écouter de tels événements, utilisez le motif `multilevel wildcard` (i.e., `**`), décrit dans la [documentation](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards) de `EventEmitter2` .

Grâce à ce modèle, vous pouvez, par exemple, créer un écouteur d'événements qui capture tous les événements.

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // gère et traite un événement
}
```

> info **Astuce** La classe `EventEmitter2` fournit plusieurs méthodes utiles pour interagir avec les événements, comme `waitFor` et `onAny`. Vous pouvez en savoir plus sur ces méthodes [ici](https://github.com/EventEmitter2/EventEmitter2).

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter).
