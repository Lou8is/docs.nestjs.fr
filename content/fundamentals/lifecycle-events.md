### Événements du cycle de vie

Une application Nest, ainsi que chaque élément de l'application, a un cycle de vie géré par Nest. Nest fournit des **hooks de cycle de vie** qui donnent une visibilité sur les événements clés du cycle de vie, et la possibilité d'agir (exécuter le code enregistré sur vos modules, fournisseurs ou contrôleurs) lorsqu'ils se produisent.

#### Séquence du cycle de vie

Le diagramme suivant illustre la séquence des événements clés du cycle de vie de l'application, depuis le démarrage de l'application jusqu'à la fin du processus node. Nous pouvons diviser le cycle de vie global en trois phases : **initialisation**, **exécution** et **arrêt**. Grâce à ce cycle de vie, vous pouvez planifier l'initialisation appropriée des modules et des services, gérer les connexions actives et arrêter gracieusement votre application lorsqu'elle reçoit un signal d'arrêt.

<figure><img class="illustrative-image" src="/assets/lifecycle-events.png" /></figure>

#### Événements du cycle de vie

Les événements du cycle de vie se produisent pendant le démarrage et l'arrêt de l'application. Nest appelle les méthodes de hook de cycle de vie enregistrées sur les modules, les fournisseurs et les contrôleurs à chacun des événements de cycle de vie suivants (**les hooks d'arrêt** doivent être activés en premier, comme décrit [ci-dessous](/fundamentals/lifecycle-events#arrêt-de-lapplication)). Comme le montre le diagramme ci-dessus, Nest appelle également les méthodes sous-jacentes appropriées pour commencer à écouter les connexions, et pour arrêter d'écouter les connexions.

Dans le tableau suivant, `onModuleInit` et `onApplicationBootstrap` ne sont déclenchés que si vous appelez explicitement `app.init()` ou `app.listen()`.

Dans le tableau suivant, `onModuleDestroy`, `beforeApplicationShutdown` et `onApplicationShutdown` ne sont déclenchés que si vous appelez explicitement `app.close()` ou si le processus reçoit un signal système spécial (tel que SIGTERM) et que vous avez correctement appelé `enableShutdownHooks` au démarrage de l'application (voir ci-dessous la partie **Arrêt de l'application**).

| Méthode hook du cycle de vie           | Événement du cycle de vie déclenchant l'appel à la méthode hook                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onModuleInit()`                | Appelée une fois que les dépendances du module hôte ont été résolues.                                                                                                                                                    |
| `onApplicationBootstrap()`      | Appelée une fois que tous les modules ont été initialisés, mais avant d'écouter les connexions.                                                                                                                              |
| `onModuleDestroy()`\*           | Appelée après réception d'un signal de fin (par exemple, `SIGTERM`).                                                                                                                                            |
| `beforeApplicationShutdown()`\* | Appelée après que tous les gestionnaires `onModuleDestroy()` aient terminé (promesses résolues ou rejetées);<br />une fois terminé (promesses résolues ou rejetées), toutes les connexions existantes seront fermées (`app.close()` appeléz). |
| `onApplicationShutdown()`\*     | Appelée après la fermeture des connexions (`app.close()` résout).                                                                                                                                                          |

Pour ces événements, si vous n'appelez pas explicitement `app.close()`, vous devez choisir de les faire fonctionner avec des signaux système tels que `SIGTERM`. Voir [Arrêt de l'application](fundamentals/lifecycle-events#arrêt-de-lapplication) ci-dessous.

> warning **Attention** Les hooks de cycle de vie énumérés ci-dessus ne sont pas déclenchés pour les classes à portée de requête. Les classes à portée de requête ne sont pas liées au cycle de vie de l'application et leur durée de vie est imprévisible. Elles sont créées exclusivement pour chaque requête et sont automatiquement mises au rebut après l'envoi de la réponse.

> info **Astuce** L'ordre d'exécution de `onModuleInit()` et `onApplicationBootstrap()` dépend directement de l'ordre d'importation des modules, en attendant le hook précédent.

#### Usage

Chaque crochet du cycle de vie est représenté par une interface. Les interfaces sont techniquement optionnelles car elles n'existent pas après la compilation de TypeScript. Néanmoins, c'est une bonne pratique de les utiliser afin de bénéficier d'un typage fort et des outils de l'éditeur. Pour enregistrer un crochet de cycle de vie, implémentez l'interface appropriée. Par exemple, pour enregistrer une méthode à appeler pendant l'initialisation du module sur une classe particulière (par exemple, Controller, Provider ou Module), implémenter l'interface `OnModuleInit` en fournissant une méthode `onModuleInit()`, comme montré ci-dessous :

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

#### Initialisation asynchrone

Les crochets `OnModuleInit` et `OnApplicationBootstrap` vous permettent de différer le processus d'initialisation de l'application (retour d'une `Promise` ou marquage de la méthode comme `async` et `await` un achèvement de méthode asynchrone dans le corps de la méthode).

```typescript
@@filename()
async onModuleInit(): Promise<void> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```

#### Arrêt de l'application

Les hooks `onModuleDestroy()`, `beforeApplicationShutdown()` et `onApplicationShutdown()` sont appelés dans la phase de terminaison (en réponse à un appel explicite à `app.close()` ou à la réception de signaux système tels que SIGTERM si l'option est choisie). Cette fonctionnalité est souvent utilisée avec [Kubernetes](https://kubernetes.io/) pour gérer les cycles de vie des conteneurs, par [Heroku](https://www.heroku.com/) pour les dynos ou des services similaires.

Les listeners de hooks d'arrêt consomment des ressources système, ils sont donc désactivés par défaut. Pour utiliser les hooks d'arrêt, vous **devez activer les listeners** en appelant `enableShutdownHooks()` :

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Commence à écouter les hooks d'arrêt
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **Attention** En raison des limitations inhérentes à la plate-forme, NestJS a un support limité pour les hooks d'arrêt d'application sous Windows. Vous pouvez vous attendre à ce que `SIGINT` fonctionne, ainsi que `SIGBREAK` et dans une certaine mesure `SIGHUP` - [en savoir plus](https://nodejs.org/api/process.html#process_signal_events). Cependant, `SIGTERM` ne fonctionnera jamais sous Windows car tuer un processus dans le gestionnaire de tâches est inconditionnel, "c'est-à-dire qu'il n'y a aucun moyen pour une application de le détecter ou de l'empêcher". Voici une [documentation pertinente](https://docs.libuv.org/en/v1.x/signal.html) de libuv pour en savoir plus sur la façon dont `SIGINT`, `SIGBREAK` et d'autres sont gérés sous Windows. Voir aussi la documentation Node.js de [Process Signal Events](https://nodejs.org/api/process.html#process_signal_events)

> info **Info** `enableShutdownHooks` consomme de la mémoire en démarrant des listeners. Dans les cas où vous exécutez plusieurs applications Nest dans un seul processus Node (par exemple, lorsque vous exécutez des tests parallèles avec Jest), Node peut se plaindre d'un nombre excessif de processus d'écoute. Pour cette raison, `enableShutdownHooks` n'est pas activé par défaut. Soyez conscient de cette condition lorsque vous exécutez plusieurs instances dans un seul processus Node.

Lorsque l'application reçoit un signal d'arrêt, elle appelle toutes les méthodes enregistrées `onModuleDestroy()`, `beforeApplicationShutdown()`, puis `onApplicationShutdown()` (dans la séquence décrite ci-dessus) avec le signal correspondant comme premier paramètre. Si une fonction enregistrée attend un appel asynchrone (renvoie une promesse), Nest ne continuera pas dans la séquence jusqu'à ce que la promesse soit résolue ou rejetée.

```typescript
@@filename()
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
  }
}
@@switch
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // e.g. "SIGINT"
  }
}
```

> info **Info** Appeler `app.close()` ne termine pas le processus Node mais déclenche seulement les hooks `onModuleDestroy()` et `onApplicationShutdown()`, donc s'il y a des intervalles, des tâches de fond qui tournent longtemps, etc. le processus ne sera pas automatiquement terminé.
