### Sentry

[Sentry](https://sentry.io) est une plateforme de suivi des erreurs et de contrôle des performances qui aide les développeurs à identifier et à résoudre les problèmes en temps réel. Cette recette montre comment intégrer le [SDK NestJS](https://docs.sentry.io/platforms/javascript/guides/nestjs/) de Sentry à votre application NestJS.

#### Installation

Tout d'abord, installez les dépendances nécessaires :

```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```

> info **Astuce** `@sentry/profiling-node` est optionnel, mais recommandé pour le profilage des performances.

#### Configuration de base

Pour commencer à utiliser Sentry, vous devez créer un fichier nommé `instrument.ts` qui doit être importé avant tout autre module de votre application :

```typescript
@@filename(instrument)
const Sentry = require("@sentry/nestjs");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Veillez à l'appeler avant de demander d'autres modules !
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Ajouter notre intégration de profilage
    nodeProfilingIntegration(),
  ],

 // Ajoutez le traçage en définissant tracesSampleRate
 // Nous recommandons d'ajuster cette valeur en production
  tracesSampleRate: 1.0,

  // Définir la fréquence d'échantillonnage pour le profilage
  // Cette valeur est relative à tracesSampleRate
  profilesSampleRate: 1.0,
});
```

Mettez à jour votre fichier `main.ts` pour importer `instrument.ts` avant les autres importations :

```typescript
@@filename(main)
// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

Ensuite, ajoutez le `SentryModule` comme module racine à votre module principal :

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...autres modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Gestion des exceptions

Si vous utilisez un filtre d'exception global (qui est soit un filtre enregistré avec `app.useGlobalFilters()` ou un filtre enregistré dans les fournisseurs de votre module d'application annoté avec un décorateur `@Catch()` sans arguments), ajoutez un décorateur `@SentryExceptionCaptured()` à la méthode `catch()` du filtre. Ce décorateur rapportera à Sentry toutes les erreurs inattendues reçues par votre filtre d'erreur global :

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // votre implémentation ici
  }
}
```

Par défaut, seules les exceptions non gérées qui ne sont pas prises en compte par un filtre d'erreur sont signalées à Sentry. Les `HttpExceptions` (y compris [dérivées](/exception-filters#exceptions-http-intégrées)) ne sont pas non plus capturées par défaut parce qu'elles agissent principalement comme des véhicules de flux de contrôle.

Si vous n'avez pas de filtre d'exception global, ajoutez le `SentryGlobalFilter` aux fournisseurs de votre module principal. Ce filtre rapportera à Sentry toutes les erreurs non gérées qui ne sont pas capturées par d'autres filtres d'erreurs.

> warning **Attention** Le `SentryGlobalFilter` doit être enregistré avant tout autre filtre d'exception.

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // ...autres fournisseurs
  ],
})
export class AppModule {}
```

#### Stack traces lisibles

Selon la façon dont vous avez configuré votre projet, les stack traces dans vos erreurs Sentry ne ressembleront probablement pas à votre code réel.

Pour y remédier, téléchargez vos cartes de sources (sourcemaps) dans Sentry. La façon la plus simple de le faire est d'utiliser l'assistant Sentry :

```bash
npx @sentry/wizard@latest -i sourcemaps
```

#### Tester l'intégration

Pour vérifier que l'intégration de Sentry fonctionne, vous pouvez ajouter un point de terminaison de test qui génère une erreur :

```typescript
@Get("debug-sentry")
getError() {
  throw new Error("Ma première erreur Sentry !");
}
```

Visitez `/debug-sentry` dans votre application, et vous devriez voir l'erreur apparaître dans votre tableau de bord Sentry.

### Résumé

Pour une documentation complète sur le SDK NestJS de Sentry, y compris les options de configuration et les fonctionnalités avancées, consultez la [documentation officielle de Sentry](https://docs.sentry.io/platforms/javascript/guides/nestjs/).

Bien que les bugs logiciels soient le propre de Sentry, nous en écrivons toujours. Si vous rencontrez des problèmes lors de l'installation de notre SDK, veuillez ouvrir un [GitHub Issue](https://github.com/getsentry/sentry-javascript/issues) ou nous contacter sur [Discord](https://discord.com/invite/sentry).