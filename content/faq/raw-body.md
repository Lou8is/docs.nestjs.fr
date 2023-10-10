### Corps brut

L'un des cas d'utilisation les plus courants pour avoir accès au corps de la requête brute est la vérification de la signature du webhook. Généralement, pour effectuer des validations de signature de webhook, le corps de la requête non sérialisé est nécessaire pour calculer un hachage HMAC.

> warning **Astuce** Cette fonctionnalité ne peut être utilisée que si le middleware de l'analyseur de corps de requête intégré est activé, c'est-à-dire que vous ne devez pas passer `bodyParser : false` lors de la création de l'application.

#### Utilisation avec Express

Activez d'abord l'option lors de la création de votre application Nest Express :

```typescript
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

// dans la fonction "bootstrap"
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  rawBody: true,
});
await app.listen(3000);
```

Pour accéder au corps de la requête brute dans un contrôleur, une interface de commodité `RawBodyRequest` est fournie pour exposer un champ `rawBody` sur la requête : utilisez le type d'interface `RawBodyRequest` :

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody; // renvoie un `Buffer`.
  }
}
```

#### Enregistrer un autre analyseur syntaxique

Par défaut, seuls les parseurs `json` et `urlencoded` sont enregistrés. Si vous voulez enregistrer un parseur différent à la volée, vous devrez le faire explicitement.

Par exemple, pour enregistrer un parseur `text`, vous pouvez utiliser le code suivant :

```typescript
app.useBodyParser('text');
```

> warning **Attention** Assurez-vous que vous fournissez le bon type d'application à l'appel `NestFactory.create`. Pour les applications Express, le type correct est `NestExpressApplication`. Sinon, la méthode `.useBodyParser` ne sera pas trouvée.

#### Limite de taille de l'analyseur

Si votre application a besoin d'analyser un corps plus grand que les `100kb` par défaut d'Express, utilisez ce qui suit :

```typescript
app.useBodyParser('json', { limit: '10mb' });
```

La méthode `.useBodyParser` respecte l'option `rawBody` passée dans les options de l'application.

#### Utilisation avec Fastify

Activez d'abord l'option lors de la création de votre application Nest Fastify :

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

// dans la fonction "bootstrap"
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  {
    rawBody: true,
  },
);
await app.listen(3000);
```

Pour accéder au corps de la requête brute dans un contrôleur, une interface de commodité `RawBodyRequest` est fournie pour exposer un champ `rawBody` sur la requête : utilisez le type d'interface `RawBodyRequest` :

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<FastifyRequest>) {
    const raw = req.rawBody; // renvoie un `Buffer`.
  }
}
```

#### Enregistrer un autre analyseur syntaxique

Par défaut, seuls les parseurs `application/json` et `application/x-www-form-urlencoded` sont enregistrés. Si vous voulez enregistrer un parseur différent à la volée, vous devrez le faire explicitement.

Par exemple, pour enregistrer un analyseur `text/plain`, vous pouvez utiliser le code suivant :

```typescript
app.useBodyParser('text/plain');
```

> warning **Attention** Assurez-vous que vous fournissez le bon type d'application à l'appel `NestFactory.create`. Pour les applications Fastify, le type correct est `NestFastifyApplication`. Sinon, la méthode `.useBodyParser` ne sera pas trouvée.

#### Limite de taille de l'analyseur

Si votre application a besoin d'analyser un corps plus grand que les 1 Mo de Fastify par défaut, utilisez ce qui suit :

```typescript
const bodyLimit = 10_485_760; // 10MiB
app.useBodyParser('application/json', { bodyLimit });
```

La méthode `.useBodyParser` respecte l'option `rawBody` passée dans les options de l'application.
