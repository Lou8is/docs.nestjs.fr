### Connections Keep-Alive 

Par défaut, les adaptateurs HTTP de NestJS attendent que la réponse soit terminée avant de fermer l'application. Mais parfois, ce comportement n'est pas souhaité, ou inattendu. Il peut y avoir des requêtes qui utilisent des en-têtes `Connection : Keep-Alive` qui durent longtemps.

Pour ces scénarios où vous voulez toujours que votre application se termine sans attendre la fin des requêtes, vous pouvez activer l'option `forceCloseConnections` lors de la création de votre application NestJS.

> warning **Astuce** La plupart des utilisateurs n'auront pas besoin d'activer cette option. Mais le symptôme de la nécessité de cette option est que votre application ne se termine pas quand vous vous y attendez. Habituellement, lorsque `app.enableShutdownHooks()` est activé et que vous remarquez que l'application ne redémarre pas/ne se termine pas. Très probablement lors de l'exécution de l'application NestJS pendant le développement avec `--watch`.

#### Usage

Dans votre fichier `main.ts`, activez l'option lors de la création de votre application NestJS :

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(3000);
}

bootstrap();
```
