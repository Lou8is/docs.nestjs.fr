### Logger

Nest est livré avec un logger textuel intégré qui est utilisé pendant le démarrage de l'application et dans d'autres circonstances telles que l'affichage des exceptions capturées (c'est-à-dire la journalisation du système). Cette fonctionnalité est fournie par la classe `Logger` dans le package `@nestjs/common`. Vous pouvez entièrement contrôler le comportement du système de journalisation, y compris ce qui suit :

- désactiver complètement la journalisation
- spécifier le niveau de détail du journal (par exemple, afficher les erreurs, les avertissements, les informations de débogage, etc.)
- remplacer l'horodatage dans le logger par défaut (par exemple, utiliser la norme ISO8601 comme format de date)
- remplacer complètement le logger par défaut
- personnaliser le logger par défaut en l'étendant
- utiliser l'injection de dépendances pour simplifier la composition et le test de votre application

Vous pouvez également utiliser le logger intégré, ou créer votre propre implémentation personnalisée, pour enregistrer vos propres événements et messages au niveau de l'application.

Pour des fonctionnalités de journalisation plus avancées, vous pouvez utiliser n'importe quel package de journalisation Node.js, tel que [Winston](https://github.com/winstonjs/winston), pour mettre en œuvre un système de journalisation entièrement personnalisé et de qualité production.

#### Personnalisation de base

Pour désactiver la journalisation, mettez la propriété `logger` à `false` dans l'objet (optionnel) options de l'application Nest passé comme second argument à la méthode `NestFactory.create()`.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(3000);
```

Pour activer des niveaux de journalisation spécifiques, définissez la propriété `logger` avec un tableau de caractères spécifiant les niveaux de journalisation à afficher, comme suit :

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(3000);
```

Les valeurs du tableau peuvent être n'importe quelle combinaison de `'log'`, `'error'`, `'warn'`, `'debug'`, et `'verbose'`.

> info **Astuce** Pour désactiver la couleur dans les messages de l'enregistreur par défaut, définissez la variable d'environnement `NO_COLOR` avec une chaîne de caractères non vide.

#### Implémentation personnalisée

Vous pouvez fournir une implémentation de logger personnalisée qui sera utilisée par Nest pour la journalisation du système en définissant la valeur de la propriété `logger` à un objet qui satisfait l'interface `LoggerService`. Par exemple, vous pouvez demander à Nest d'utiliser l'objet JavaScript global intégré `console` (qui implémente l'interface `LoggerService`), comme suit :

```typescript
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(3000);
```

L'implémentation de votre propre logger personnalisé est simple. Il suffit d'implémenter chacune des méthodes de l'interface `LoggerService` comme indiqué ci-dessous.

```typescript
import { LoggerService } from '@nestjs/common';

export class MyLogger implements LoggerService {
  /**
   * Écrit un journal de niveau "log".
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * Écrit un journal de niveau "error" (erreur).
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * Écrit un journal de niveau "warn" (avertissement).
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * Écrit un journal de niveau "debug" (débogage).
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * Écrit un journal de niveau "verbose" (verbeux).
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

Vous pouvez alors fournir une instance de `MyLogger` via la propriété `logger` de l'objet d'options de l'application Nest.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(3000);
```

Cette technique, bien que simple, n'utilise pas l'injection de dépendance pour la classe `MyLogger`. Cela peut poser quelques problèmes, en particulier pour les tests, et limiter la réutilisation de `MyLogger`. Pour une meilleure solution, voir la section <a href="techniques/logger#injection-de-dépendance">Injection de dépendances</a> ci-dessous.

#### Étendre le logger intégré

Plutôt que d'écrire un logger à partir de zéro, vous pouvez répondre à vos besoins en étendant la classe intégrée `ConsoleLogger` et en surchargeant certains comportements de l'implémentation par défaut.

```typescript
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // ajoutez ici votre logique personnalisée
    super.error(...arguments);
  }
}
```

Vous pouvez utiliser un tel logger étendu dans vos modules de fonctionnalités comme décrit dans la section <a href="techniques/logger#utilisation-du-logger-pour-la-journalisation-des-applications" >utilisation du logger pour la journalisation des applications</a> ci-dessous.

Vous pouvez demander à Nest d'utiliser votre logger étendu pour la journalisation du système en lui passant une instance via la propriété `logger` de l'objet d'options de l'application (comme indiqué dans la section <a href="techniques/logger#implémentation-personnalisée" >Implémentation personnalisée</a> ci-dessus), ou en utilisant la technique indiquée dans la section <a href="techniques/logger#injection-de-dépendance" >Injection de dépendance</a> ci-dessous. Si vous le faites, vous devez prendre soin d'appeler `super`, comme indiqué dans l'exemple de code ci-dessus, pour déléguer l'appel de la méthode de log spécifique à la classe mère (intégrée) afin que Nest puisse s'appuyer sur les fonctionnalités intégrées qu'il attend.

<app-banner-courses></app-banner-courses>

#### Injection de dépendance

Pour des fonctionnalités de journalisation plus avancées, vous voudrez tirer parti de l'injection de dépendances. Par exemple, vous pouvez injecter un `ConfigService` dans votre logger pour le personnaliser, et à son tour injecter votre logger personnalisé dans d'autres contrôleurs et/ou fournisseurs. Pour activer l'injection de dépendance pour votre logger personnalisé, créez une classe qui implémente `LoggerService` et enregistrez cette classe comme fournisseur dans un module. Par exemple, vous pouvez

1. Définir une classe `MyLogger` qui étend la classe intégrée `ConsoleLogger` ou la remplace complètement, comme montré dans les sections précédentes. Assurez-vous d'implémenter l'interface `LoggerService`.
2. Créer un `LoggerModule` comme montré ci-dessous, et fournir `MyLogger` à partir de ce module.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Avec cette construction, vous fournissez maintenant votre logger personnalisé pour qu'il puisse être utilisé par n'importe quel autre module. Parce que votre classe `MyLogger` fait partie d'un module, elle peut utiliser l'injection de dépendances (par exemple, pour injecter un `ConfigService`). Il y a encore une technique nécessaire pour fournir ce logger personnalisé afin qu'il soit utilisé par Nest pour la journalisation du système (par exemple, pour le bootstrapping et la gestion des erreurs).

Parce que l'instanciation de l'application (`NestFactory.create()`) se produit en dehors du contexte d'un module, elle ne participe pas à la phase normale d'injection de dépendance de l'initialisation. Nous devons donc nous assurer qu'au moins un module d'application importe le `LoggerModule` pour déclencher l'instanciation par Nest d'une instance singleton de notre classe `MyLogger`.

Nous pouvons alors demander à Nest d'utiliser la même instance singleton de `MyLogger` avec la construction suivante :

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

> info **Remarque** Dans l'exemple ci-dessus, nous avons mis `bufferLogs` à `true` pour nous assurer que tous les logs seront mis en mémoire tampon jusqu'à ce qu'un logger personnalisé soit attaché (`MyLogger` dans ce cas) et que le processus d'initialisation de l'application soit terminé ou échoue. Si le processus d'initialisation échoue, Nest se rabattra sur le `ConsoleLogger` original pour imprimer tous les messages d'erreur rapportés. Vous pouvez également définir `autoFlushLogs` à `false` (par défaut `true`) pour vider manuellement les logs (en utilisant la méthode `Logger#flush()`).

Ici, nous utilisons la méthode `get()` sur l'instance `NestApplication` pour récupérer l'instance singleton de l'objet `MyLogger`. Cette technique est essentiellement un moyen d'"injecter" une instance d'un logger pour qu'il soit utilisé par Nest. L'appel à `app.get()` récupère l'instance singleton de `MyLogger`, et dépend de l'injection préalable de cette instance dans un autre module, comme décrit ci-dessus.

Vous pouvez également injecter ce fournisseur `MyLogger` dans vos classes de fonctionnalités, assurant ainsi un comportement de journalisation cohérent à travers la journalisation du système Nest et la journalisation de l'application. Voir <a href="techniques/logger#utilisation-du-logger-pour-la-journalisation-des-applications">Utilisation du logger pour la journalisation des applications</a> et <a href="techniques/logger#injection-dun-logger-personnalisé">Injection d'un logger personnalisé</a> ci-dessous pour plus d'informations.

#### Utilisation du logger pour la journalisation des applications

Nous pouvons combiner plusieurs des techniques ci-dessus pour fournir un comportement et un formatage cohérents à la fois pour la journalisation du système Nest et pour la journalisation des événements/messages de nos propres applications.

Une bonne pratique est d'instancier la classe `Logger` de `@nestjs/common` dans chacun de nos services. Nous pouvons fournir le nom de notre service comme argument `context` dans le constructeur de `Logger`, comme ceci :

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something...');
  }
}
```

Dans l'implémentation par défaut du logger, `context` est imprimé entre crochets, comme `NestFactory` dans l'exemple ci-dessous :

```bash
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
```

Si nous fournissons un logger personnalisé via `app.useLogger()`, il sera en fait utilisé par Nest en interne. Cela signifie que notre code reste agnostique en matière d'implémentation, alors que nous pouvons facilement remplacer le logger par défaut par notre logger personnalisé en appelant `app.useLogger()`.

Ainsi, si nous suivons les étapes de la section précédente et appelons `app.useLogger(app.get(MyLogger))`, les appels suivants à `this.logger.log()` depuis `MyService` résulteront en des appels à la méthode `log` depuis l'instance `MyLogger`.

Cela devrait convenir dans la plupart des cas. Mais si vous avez besoin de plus de personnalisation (comme l'ajout et l'appel de méthodes personnalisées), passez à la section suivante.

#### Injection d'un logger personnalisé

Pour commencer, étendez le logger intégré avec le code suivant. Nous fournissons l'option `scope` comme métadonnée de configuration pour la classe `ConsoleLogger`, en spécifiant un scope [transient](/fundamentals/injection-scopes), pour s'assurer que nous aurons une instance unique de `MyLogger` dans chaque module de fonctionnalité. Dans cet exemple, nous n'étendons pas les méthodes individuelles de `ConsoleLogger` (comme `log()`, `warn()`, etc.), bien que vous puissiez choisir de le faire.

```typescript
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
```

Ensuite, créez un `LoggerModule` avec une construction comme celle-ci :

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Ensuite, importez le `LoggerModule` dans votre module de fonctionnalité. Puisque nous avons étendu le `Logger` par défaut, nous avons la possibilité d'utiliser la méthode `setContext`. Nous pouvons donc commencer à utiliser le logger personnalisé en fonction du contexte, comme ceci :

```typescript
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // En raison de la portée transitoire, CatsService possède sa propre instance de MyLogger,
    // ainsi, la définition du contexte ici n'affectera pas d'autres instances dans d'autres services.
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // Vous pouvez appeler toutes les méthodes par défaut
    this.myLogger.warn('About to return cats!');
    // Et vos méthodes personnalisées
    this.myLogger.customLog();
    return this.cats;
  }
}
```

Enfin, demandez à Nest d'utiliser une instance du logger personnalisé dans votre fichier `main.ts` comme montré ci-dessous. Bien sûr, dans cet exemple, nous n'avons pas vraiment personnalisé le comportement du logger (en étendant les méthodes `Logger` comme `log()`, `warn()`, etc), donc cette étape n'est pas vraiment nécessaire. Mais elle **serait** nécessaire si vous ajoutiez une logique personnalisée à ces méthodes et que vous vouliez que Nest utilise la même implémentation.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(3000);
```

> info **Astuce** Alternativement, au lieu de mettre `bufferLogs` à `true`, vous pouvez désactiver temporairement le logger avec l'instruction `logger : false`. Soyez conscient que si vous fournissez `logger : false` à `NestFactory.create`, rien ne sera enregistré jusqu'à ce que vous appeliez `useLogger`, donc vous pourriez manquer d'importantes erreurs d'initialisation. Si cela ne vous dérange pas que certains de vos messages initiaux soient enregistrés avec le logger par défaut, vous pouvez simplement omettre l'option `logger : false`.

#### Utilisation d'un logger externe

Les applications de production ont souvent des exigences spécifiques en matière de journalisation, y compris le filtrage avancé, le formatage et la journalisation centralisée. Le logger intégré de Nest est utilisé pour surveiller le comportement du système Nest et peut également être utile pour la journalisation de texte formaté de base dans vos modules de fonctionnalité pendant le développement, mais les applications de production tirent souvent parti de modules de journalisation dédiés tels que [Winston](https://github.com/winstonjs/winston). Comme pour toute application Node.js standard, vous pouvez tirer pleinement parti de ces modules dans Nest.
