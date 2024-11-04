### Gestion des versions

> info **Astuce** Ce chapitre ne concerne que les applications basées sur le protocole HTTP.

La gestion des versions vous permet d'avoir **différentes versions** de vos contrôleurs ou de vos itinéraires individuels fonctionnant dans la même application. Les applications changent très souvent et il n'est pas rare que vous deviez apporter des modifications radicales tout en continuant à supporter la version précédente de l'application.

Il existe 4 types de gestion des versions qui sont pris en charge :

<table>
  <tr>
    <td><a href='techniques/versioning#versionnage-des-uri'><code>Versionnage des URI</code></a></td>
    <td>La version sera transmise dans l'URI de la requête (par défaut)</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#versionnage-des-en-têtes'><code>Versionnage des en-têtes</code></a></td>
    <td>Un en-tête de requête personnalisé spécifiera la version</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#versionnage-des-types-de-médias'><code>Versionnage des types de médias</code></a></td>
    <td>L'en-tête <code>Accept</code> de la requête spécifiera la version</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#versionnage-personnalisé'><code>Versionnage personnalisé</code></a></td>
    <td>Tout aspect de la requête peut être utilisé pour spécifier la (les) version(s). Une fonction personnalisée est fournie pour extraire cette (ces) version(s).</td>
  </tr>
</table>

#### Versionnage des URI

Le versionnage de l'URI utilise la version transmise dans l'URI de la requête, comme `https://example.com/v1/route` et `https://example.com/v2/route`.

> warning **Remarque** Avec le versionnage de l'URI, la version sera automatiquement ajoutée à l'URI après le <a href="faq/global-prefix">préfixe du chemin global</a> (s'il existe), et avant tout contrôleur ou chemin d'accès.

Pour activer le versionnage des URI pour votre application, procédez comme suit :

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
// ou "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
```

> warning **Remarque** La version dans l'URI sera automatiquement préfixée par `v` par défaut, cependant la valeur du préfixe peut être configurée en définissant la clé `prefix` avec le préfixe désiré ou `false` si vous souhaitez le désactiver.

> info **Astuce** L'enum `VersioningType` est disponible pour la propriété `type` et est importé du package `@nestjs/common`.

#### Versionnage des en-têtes

Le versionnage de l'en-tête utilise un en-tête de requête personnalisé, spécifié par l'utilisateur, pour spécifier la version, la valeur de l'en-tête étant la version à utiliser pour la requête.

Exemple de requêtes HTTP pour le versionnage des en-têtes :

Pour activer le **versionnage des en-têtes** pour votre application, procédez comme suit :

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
```

La propriété `header` doit être le nom de l'en-tête qui contiendra la version de la requête.

> info **Astuce** L'enum `VersioningType` est disponible pour la propriété `type` et est importé du package `@nestjs/common`.

#### Versionnage des types de médias

Le versionnage du type de média utilise l'en-tête `Accept` de la requête pour spécifier la version.

Dans l'en-tête `Accept`, la version sera séparée du type de média par un point-virgule, `;`. Il devrait ensuite contenir une paire clé-valeur qui représente la version à utiliser pour la requête, comme `Accept : application/json;v=2`. La clé est plutôt traitée comme un préfixe lors de la détermination de la version, qui devra être configurée pour inclure la clé et le séparateur.

Pour activer le **versionnage du type de média** pour votre application, procédez comme suit :

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
```

La propriété `key` doit être la clé et le séparateur de la paire clé-valeur qui contient la version. Pour l'exemple `Accept : application/json;v=2`, la propriété `key` serait fixée à `v=`.

> info **Astuce** L'enum `VersioningType` est disponible pour la propriété `type` et est importé du package `@nestjs/common`.

#### Versionnage personnalisé

Le versionnage personnalisé utilise n'importe quel aspect de la requête pour spécifier la (ou les) version(s). La requête entrante est analysée à l'aide d'une fonction `extractor` qui renvoie une chaîne de caractères ou un tableau de caractères.

Si plusieurs versions sont fournies par la requête, la fonction d'extraction peut renvoyer un tableau de caractères, triés dans l'ordre de la version la plus grande/la plus élevée à la version la plus petite/la plus basse. Les versions sont associées aux itinéraires dans l'ordre de la plus grande à la plus petite.

Si une chaîne de caractères ou un tableau vide est renvoyé par l'extracteur, aucune route n'est prise en compte et un message 404 est renvoyé.

Par exemple, si une requête entrante spécifie qu'elle supporte les versions `1`, `2`, et `3`, l'extracteur ** DOIT** renvoyer `[3, 2, 1]`. Cela permet de s'assurer que la version de route la plus élevée possible est sélectionnée en premier.

Si les versions `[3, 2, 1]` sont extraites, mais que les routes n'existent que pour les versions `2` et `1`, la route qui correspond à la version `2` est sélectionnée (la version `3` est automatiquement ignorée).

> warning **Remarque** La sélection de la version la plus élevée basée sur le tableau retourné par `extractor` **ne fonctionne pas de manière fiable** avec l'adaptateur Express en raison de limitations de conception. Une version unique (soit une chaîne de caractères, soit un tableau de 1 élément) fonctionne parfaitement dans Express. Fastify supporte correctement la sélection de la version la plus élevée et la sélection d'une seule version.

Pour activer le **versionnage personnalisé** pour votre application, créez une fonction `extractor` et passez-la dans votre application
comme suit :

```typescript
@@filename(main)
// Exemple d'extracteur qui extrait une liste de versions d'un en-tête personnalisé et la transforme en un tableau trié.
// Cet exemple utilise Fastify, mais les requêtes Express peuvent être traitées de manière similaire.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
```

#### Usage

Le versionnage vous permet de versionner les contrôleurs, les routes individuelles et fournit également un moyen pour certaines ressources de ne pas utiliser le versionnage. L'utilisation du versionnage est la même quel que soit le type de versionnage utilisé par votre application.

> warning **Remarque** Si le versioning est activé pour l'application mais que le contrôleur ou la route ne spécifie pas la version, toutes les requêtes vers ce contrôleur/route seront retournées avec le statut de réponse `404`. De même, si une requête est reçue contenant une version qui n'a pas de contrôleur ou d'itinéraire correspondant, elle sera également renvoyée avec un statut de réponse `404`.

#### Versions de contrôleurs

Une version peut être appliquée à un contrôleur, définissant la version pour tous les itinéraires au sein du contrôleur.

Pour ajouter une version à un contrôleur, procédez comme suit :

```typescript
@@filename(cats.controller)
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
@@switch
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1';
  }
}
```

#### Versions de routes

Une version peut être appliquée à une route individuelle. Cette version remplacera toute autre version qui affecterait la route, telle que la version du contrôleur.

Pour ajouter une version à une route individuelle, procédez comme suit :

```typescript
@@filename(cats.controller)
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
@@switch
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'This action returns all cats for version 2';
  }
}
```

#### Versions multiples

Plusieurs versions peuvent être appliquées à un contrôleur ou à une route. Pour utiliser plusieurs versions, vous devez définir la version comme un tableau.

Pour ajouter plusieurs versions, procédez comme suit :

```typescript
@@filename(cats.controller)
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
@@switch
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1 or 2';
  }
}
```

#### Version "neutre"

Certains contrôleurs ou routes peuvent ne pas se soucier de la version et avoir la même fonctionnalité quelle que soit la version. Pour tenir compte de cela, la version peut être définie avec le symbole `VERSION_NEUTRAL`.

Une requête entrante sera affectée à un contrôleur ou à une route `VERSION_NEUTRAL` quelle que soit la version envoyée dans la requête et même si la requête ne contient pas de version du tout.

> warning **Remarque** Pour le versionnage des URI, une ressource `VERSION_NEUTRAL` n'aurait pas la version présente dans l'URI.

Pour le versionnage des URI, une ressource `VERSION_NEUTRAL` n'aurait pas la version présente dans l'URI.

```typescript
@@filename(cats.controller)
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
@@switch
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats regardless of version';
  }
}
```

#### Version globale par défaut

Si vous ne voulez pas fournir une version pour chaque contrôleur et/ou route individuelle, ou si vous voulez qu'une version spécifique soit définie comme version par défaut pour chaque contrôleur/route qui n'a pas la version spécifiée, vous pouvez définir `defaultVersion` de la façon suivante :

```typescript
@@filename(main)
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // ou
  defaultVersion: ['1', '2']
  // ou
  defaultVersion: VERSION_NEUTRAL
});
```

#### Versionnage des middlewares

Les [Middlewares](/middleware) peuvent également utiliser les métadonnées de version pour configurer le middleware en fonction de la version d'une route spécifique. Pour ce faire, il faut fournir le numéro de version comme l'un des paramètres de la méthode `MiddlewareConsumer.forRoutes()` :

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

Avec le code ci-dessus, le `LoggerMiddleware` ne sera appliqué qu'à la version '2' de l'endpoint `/cats`.

> info **Remarque** Les middlewares fonctionnent avec tous les types de version décrits dans cette section : `URI`, `en-tête`, `type de média` ou `personnalisé`.
