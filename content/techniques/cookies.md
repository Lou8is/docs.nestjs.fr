### Cookies

Un **cookie HTTP** est un petit élément de données stocké par le navigateur de l'utilisateur. Les cookies ont été conçus comme un mécanisme fiable permettant aux sites web de se souvenir d'informations relatives à un état. Lorsque l'utilisateur visite à nouveau le site web, le cookie est automatiquement envoyé avec la requête.

#### Utiliser avec Express (par défaut)

Commencez par installer le [package requis](https://github.com/expressjs/cookie-parser) (et ses types pour les utilisateurs de TypeScript) :

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

Une fois l'installation terminée, appliquez le middleware `cookie-parser` comme middleware global (par exemple, dans votre fichier `main.ts`).

```typescript
import cookieParser from 'cookie-parser';
// quelque part dans votre fichier d'initialisation
app.use(cookieParser());
```

Vous pouvez passer plusieurs options au middleware `cookieParser` :

- `secret` : une chaîne de caractères ou un tableau utilisé pour signer les cookies. Ceci est optionnel et si ce n'est pas spécifié, les cookies signés ne seront pas analysés. Si une chaîne de caractères est fournie, elle est utilisée comme secret. Si un tableau est fourni, une tentative sera faite pour vérifier le cookie avec chaque secret dans l'ordre.
- `options` : un objet qui est passé à `cookie.parse` comme deuxième option. Voir [cookie](https://www.npmjs.org/package/cookie) pour plus d'informations.

Le middleware va analyser l'en-tête `Cookie` de la requête et exposer les données du cookie en tant que propriété `req.cookies` et, si un secret a été fourni, en tant que propriété `req.signedCookies`. Ces propriétés sont des paires nom-valeur du nom du cookie et de la valeur du cookie.

Lorsque secret est fourni, ce module désignera et validera toutes les valeurs des cookies signés et déplacera ces paires nom-valeur de `req.cookies` dans `req.signedCookies`. Un cookie signé est un cookie dont la valeur est préfixée par `s:`. Les cookies signés qui échouent à la validation de la signature auront la valeur `false` à la place de la valeur altérée.

Ainsi, vous pouvez maintenant lire les cookies à partir des gestionnaires de routes, comme suit :

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // ou "request.cookies['cookieKey']"
  // ou console.log(request.signedCookies);
}
```

> info **Astuce** Le décorateur `@Req()` est importé du package `@nestjs/common`, tandis que `Request` est importé du package `express`.

Pour attacher un cookie à une réponse sortante, utilisez la méthode `Response#cookie()` :

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value')
}
```

> warning **Attention** Si vous voulez laisser la logique de gestion des réponses au framework, n'oubliez pas de mettre l'option `passthrough` à `true`, comme indiqué ci-dessus. Pour en savoir plus, cliquez ici (/controllers#approche-spécifique-aux-bibliothèques).

> info **Astuce** Le décorateur `@Res()` est importé du package `@nestjs/common`, tandis que `Response` est importé du package `express`.

#### Utilisation avec Fastify

Installez d'abord le package requis :

```shell
$ npm i @fastify/cookie
```

Une fois l'installation terminée, enregistrez le plugin `@fastify/cookie` :

```typescript
import fastifyCookie from '@fastify/cookie';

// quelque part dans votre fichier d'initialisation
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(fastifyCookie, {
  secret: 'my-secret', // pour la signature des cookies
});
```

Ceci étant fait, vous pouvez maintenant lire les cookies à partir des gestionnaires d'itinéraires, comme suit :

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // ou "request.cookies['cookieKey']"
}
```

> info **Astuce** Le décorateur `@Req()` est importé du paquet `@nestjs/common`, tandis que `FastifyRequest` est importé du paquet `fastify`.

Pour attacher un cookie à une réponse sortante, utilisez la méthode `FastifyReply#setCookie()` :

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value')
}
```

Pour en savoir plus sur la méthode `FastifyReply#setCookie()`, consultez cette [page](https://github.com/fastify/fastify-cookie#sending).

> warning **Attention** Si vous voulez laisser la logique de gestion des réponses au framework, n'oubliez pas de mettre l'option `passthrough` à `true`, comme indiqué ci-dessus. Pour en savoir plus, cliquez ici (/controllers#approche-spécifique-aux-bibliothèques).

> info **Astuce** Le décorateur `@Res()` est importé du paquet `@nestjs/common`, tandis que `FastifyReply` est importé du paquet `fastify`.

#### Création d'un décorateur personnalisé (multiplateforme)

Pour disposer d'un moyen pratique et déclaratif d'accéder aux cookies entrants, nous pouvons créer un [décorateur personnalisé](/custom-decorators).

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);
```

Le décorateur `@Cookies()` extrait tous les cookies ou un cookie nommé de l'objet `req.cookies` et remplit le paramètre décoré avec cette valeur.

Ceci étant fait, nous pouvons maintenant utiliser le décorateur dans la signature d'un gestionnaire de route, comme suit :

```typescript
@Get()
findAll(@Cookies('name') name: string) {}
```
