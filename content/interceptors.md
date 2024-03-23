### Intercepteurs

Un intercepteur est une classe annotée avec le décorateur `@Injectable()` et implémentant l'interface `NestInterceptor`.

<figure><img src="/assets/Interceptors_1.png" /></figure>

Les intercepteurs disposent d'un ensemble de fonctionnalités utiles qui s'inspirent de la [Programmation Orientée Aspect](https://en.wikipedia.org/wiki/Aspect-oriented_programming) (POA). Ils permettent de :

- lier une logique supplémentaire avant/après l'exécution de la méthode
- transformer le résultat renvoyé par une fonction
- transformer l'exception lancée par une fonction
- étendre le comportement de base d'une fonction
- remplacer complètement une fonction en fonction de conditions spécifiques (par exemple, à des fins de mise en cache)

#### Principes de base

Chaque intercepteur implémente la méthode `intercept()`, qui prend deux arguments. Le premier est l'instance `ExecutionContext` (exactement le même objet que pour [les gardes](/guards)). Le `ExecutionContext` hérite de `ArgumentsHost`. Nous avons déjà vu `ArgumentsHost` dans le chapitre sur les filtres d'exception. Là, nous avons vu que c'est une enveloppe autour des arguments qui ont été passés au gestionnaire original, et qui contient différentes listes d'arguments basées sur le type de l'application. Vous pouvez vous référer aux [filtres d'exception](/exception-filters#argumentshost) pour plus d'informations sur ce sujet.

#### Contexte d'exécution

En étendant `ArgumentsHost`, `ExecutionContext` ajoute également plusieurs nouvelles méthodes d'aide qui fournissent des détails supplémentaires sur le processus d'exécution en cours. Ces détails peuvent être utiles pour construire des intercepteurs plus génériques qui peuvent fonctionner à travers un large ensemble de contrôleurs, de méthodes et de contextes d'exécution. En savoir plus sur `ExecutionContext` [ici](/fundamentals/execution-context).

#### Gestionnaire d'appels

Le second argument est un `CallHandler`. L'interface `CallHandler` implémente la méthode `handle()`, que vous pouvez utiliser pour invoquer une méthode de gestionnaire de route à un moment donné dans votre intercepteur. Si vous n'appelez pas la méthode `handle()` dans votre implémentation de la méthode `intercept()`, la méthode du gestionnaire de route ne sera pas exécutée du tout.

Cette approche signifie que la méthode `intercept()` **enveloppe** effectivement le flux de requête/réponse. Par conséquent, vous pouvez implémenter une logique personnalisée **avant et après** l'exécution du gestionnaire de route final. Il est clair que vous pouvez écrire du code dans votre méthode `intercept()` qui s'exécute **avant** d'appeler `handle()`, mais comment affecter ce qui se passe après ? Parce que la méthode `handle()` retourne un `Observable`, nous pouvons utiliser les puissants opérateurs [RxJS](https://github.com/ReactiveX/rxjs) pour manipuler davantage la réponse. En utilisant la terminologie de la Programmation Orientée Aspect, l'invocation du gestionnaire de route (c'est-à-dire l'appel de `handle()`) est appelé un [Pointcut](https://en.wikipedia.org/wiki/Pointcut), indiquant que c'est le point où notre logique additionnelle est insérée.

Considérons, par exemple, une requête `POST /cats` entrante. Cette requête est destinée au gestionnaire `create()` défini dans le `CatsController`. Si un intercepteur qui n'appelle pas la méthode `handle()` est appelé n'importe où sur le chemin, la méthode `create()` ne sera pas exécutée. Une fois que `handle()` est appelée (et que son `Observable` a été retourné), le gestionnaire `create()` sera déclenché. Et une fois que le flux de réponse est reçu par l'intermédiaire de l'observable, des opérations supplémentaires peuvent être effectuées sur le flux, et un résultat final renvoyé à l'appelant.

<app-banner-devtools></app-banner-devtools>

#### Interception des aspects

Le premier cas d'utilisation que nous allons examiner est l'utilisation d'un intercepteur pour enregistrer l'interaction de l'utilisateur (par exemple, stocker les appels de l'utilisateur, envoyer des événements de manière asynchrone ou calculer un horodatage). Nous montrons ci-dessous un simple `LoggingInterceptor` :

```typescript
@@filename(logging.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  intercept(context, next) {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
```

> info **Astuce** `NestInterceptor<T, R>` est une interface générique dans laquelle `T` indique le type d'un `Observable<T>` (supportant le flux de réponse), et `R` est le type de la valeur enveloppée par `Observable<R>`.

> warning **Remarque** Les intercepteurs, comme les contrôleurs, les fournisseurs, les gardes, et ainsi de suite, peuvent **injecter des dépendances** à travers leur constructeur (`constructor`).

Puisque `handle()` renvoie un `Observable` RxJS, nous avons un large choix d'opérateurs que nous pouvons utiliser pour manipuler le flux. Dans l'exemple ci-dessus, nous avons utilisé l'opérateur `tap()`, qui invoque notre fonction de journalisation anonyme en cas de fin gracieuse ou exceptionnelle du flux observable, mais qui n'interfère pas autrement avec le cycle de réponse.

#### Liaison des intercepteurs

Afin de mettre en place l'intercepteur, nous utilisons le décorateur `@UseInterceptors()` importé du package `@nestjs/common`. Comme pour les [pipes](/pipes) et les [gardes](/guards), les intercepteurs peuvent être à l'échelle du contrôleur, à l'échelle de la méthode ou à l'échelle globale.

```typescript
@@filename(cats.controller)
@UseInterceptors(LoggingInterceptor)
export class CatsController {}
```

> info **Astuce** Le décorateur `@UseInterceptors()` est importé du package `@nestjs/common`.

En utilisant la construction ci-dessus, chaque gestionnaire de route défini dans `CatsController` utilisera `LoggingInterceptor`. Quand quelqu'un appelle le point de terminaison `GET /cats`, vous verrez la sortie suivante dans votre sortie standard :

```typescript
Before...
After... 1ms
```

Notez que nous avons passé la classe `LoggingInterceptor` (au lieu d'une instance), laissant la responsabilité de l'instanciation au framework et permettant l'injection de dépendance. Comme pour les pipes, les gardes et les filtres d'exception, nous pouvons également passer une instance :

```typescript
@@filename(cats.controller)
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}
```

Comme mentionné, la construction ci-dessus attache l'intercepteur à chaque handler déclaré par ce contrôleur. Si nous voulons restreindre la portée de l'intercepteur à une seule méthode, nous appliquons simplement le décorateur **au niveau de la méthode**.

Pour mettre en place un intercepteur global, nous utilisons la méthode `useGlobalInterceptors()` de l'instance de l'application Nest :

```typescript
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(new LoggingInterceptor());
```

Les intercepteurs globaux sont utilisés dans toute l'application, pour chaque contrôleur et chaque gestionnaire de route. En termes d'injection de dépendances, les intercepteurs globaux enregistrés en dehors de tout module (avec `useGlobalInterceptors()`, comme dans l'exemple ci-dessus) ne peuvent pas injecter de dépendances puisque cela est fait en dehors du contexte de tout module. Afin de résoudre ce problème, vous pouvez mettre en place un intercepteur **directement depuis n'importe quel module** en utilisant la construction suivante :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

> info **Astuce** Lorsque vous utilisez cette approche pour réaliser l'injection de dépendances pour l'intercepteur, notez que, quel que soit le module dans lequel cette construction est employée, l'intercepteur est, en fait, global. Où cela doit-il être fait ? Choisissez le module où l'intercepteur (`LoggingInterceptor` dans l'exemple ci-dessus) est défini. De plus, `useClass` n'est pas la seule façon de gérer l'enregistrement de fournisseurs personnalisés. Apprenez-en plus [ici](/fundamentals/custom-providers).

#### Mappage des réponses

Nous savons déjà que `handle()` retourne un `Observable`. Le flux contient la valeur **retournée** par le gestionnaire de route, et nous pouvons donc facilement le modifier en utilisant l'opérateur `map()` de RxJS.

> warning **Attention** La fonction de mappage des réponses ne fonctionne pas avec la stratégie de réponse spécifique à la bibliothèque (l'utilisation directe de l'objet `@Res()` est interdite).

Créons le `TransformInterceptor`, qui va modifier chaque réponse d'une manière triviale pour démontrer le processus. Il utilisera l'opérateur `map()` de RxJS pour assigner l'objet de la réponse à la propriété `data` d'un objet nouvellement créé, renvoyant le nouvel objet au client.

```typescript
@@filename(transform.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ data })));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor {
  intercept(context, next) {
    return next.handle().pipe(map(data => ({ data })));
  }
}
```

> info **Astuce** Les intercepteurs Nest fonctionnent avec les méthodes `intercept()` synchrones et asynchrones. Vous pouvez simplement passer la méthode à `async` si nécessaire.

Avec la construction ci-dessus, lorsque quelqu'un appelle le endpoint `GET /cats`, la réponse ressemblerait à ce qui suit (en supposant que le gestionnaire de route renvoie un tableau vide `[]`) :

```json
{
  "data": []
}
```

Les intercepteurs sont très utiles pour créer des solutions réutilisables à des besoins qui se manifestent dans l'ensemble d'une application.
Par exemple, imaginons que nous ayons besoin de transformer chaque occurrence d'une valeur `null` en une chaîne vide `''`. Nous pouvons le faire en utilisant une ligne de code et lier l'intercepteur globalement afin qu'il soit automatiquement utilisé par chaque gestionnaire enregistré.

```typescript
@@filename()
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
```

#### Mappage d'exception

Un autre cas d'utilisation intéressant est de profiter de l'opérateur `catchError()` de RxJS pour surcharger les exceptions lancées :

```typescript
@@filename(errors.interceptor)
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
@@switch
import { Injectable, BadGatewayException } from '@nestjs/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
```

#### Remplacement d'un flux

Il y a plusieurs raisons pour lesquelles nous pouvons parfois vouloir éviter complètement d'appeler le gestionnaire et renvoyer une valeur différente à la place. Un exemple évident est la mise en place d'un cache pour améliorer le temps de réponse. Examinons un **intercepteur de cache** simple qui renvoie sa réponse à partir d'un cache. Dans un exemple réaliste, nous voudrions prendre en compte d'autres facteurs comme le TTL, l'invalidation du cache, la taille du cache, etc. Mais cela dépasse le cadre de cette discussion. Nous fournirons ici un exemple de base qui démontre le concept principal.

```typescript
@@filename(cache.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { of } from 'rxjs';

@Injectable()
export class CacheInterceptor {
  intercept(context, next) {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
```

Notre `CacheInterceptor` a une variable `isCached` codée en dur et une réponse `[]` codée en dur également. Le point clé à noter est que nous retournons ici un nouveau flux, créé par l'opérateur RxJS `of()`, donc le gestionnaire de route **ne sera pas appelé** du tout. Quand quelqu'un appelle un endpoint qui utilise `CacheInterceptor`, la réponse (un tableau vide codé en dur) sera retournée immédiatement. Afin de créer une solution générique, vous pouvez tirer parti de `Reflector` et créer un décorateur personnalisé. Le `Reflector` est bien décrit dans le chapitre [gardes](/guards).

#### Autres opérateurs

La possibilité de manipuler le flux à l'aide d'opérateurs RxJS nous offre de nombreuses possibilités. Considérons un autre cas d'utilisation courant. Imaginez que vous souhaitiez gérer les **timeouts** sur les requêtes de route. Lorsque votre point d'accès ne renvoie rien après un certain temps, vous voulez terminer avec une réponse d'erreur. La construction suivante permet de le faire :

```typescript
@@filename(timeout.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  };
};
@@switch
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  };
};
```

Après 5 secondes, le traitement de la requête sera annulé. Vous pouvez également ajouter une logique personnalisée avant de lancer `RequestTimeoutException` (par exemple, libérer des ressources).
