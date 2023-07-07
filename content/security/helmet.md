### Helmet

[Helmet](https://github.com/helmetjs/helmet) peut vous aider à protéger votre application contre certaines vulnérabilités Web bien connues en définissant les en-têtes HTTP de manière appropriée. En général, Helmet est juste une collection de fonctions middleware plus petites qui définissent des en-têtes HTTP liés à la sécurité (en lire [plus](https://github.com/helmetjs/helmet#how-it-works)).

> info **Astuce** Notez que l'application de `helmet` en tant que global ou son enregistrement doit venir avant d'autres appels à `app.use()` ou des fonctions de configuration qui peuvent appeler `app.use()`. Ceci est dû à la façon dont la plateforme sous-jacente (c'est-à-dire Express ou Fastify) fonctionne, où l'ordre dans lequel les middlewares/routes sont définis est important. Si vous utilisez un middleware comme `helmet` ou `cors` après avoir défini une route, alors ce middleware ne s'appliquera pas à cette route, il ne s'appliquera qu'aux routes définies après le middleware.

#### Utilisation avec Express (par défaut)

Commencez par installer le package requis.

```bash
$ npm i --save helmet
```

Une fois l'installation terminée, appliquez-le en tant que middleware global.

```typescript
import helmet from 'helmet';
// quelque part dans votre fichier d'initialisation
app.use(helmet());
```

> warning **Attention** Lorsque vous utilisez `helmet`, `@apollo/server` (4.x), et la [Sandbox Apollo](/graphql/quick-start#apollo-sandbox), il peut y avoir un problème avec [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) sur la Sandbox Apollo. Pour résoudre ce problème, configurez le CSP comme indiqué ci-dessous :
>
> ```typescript
> app.use(helmet({
>   crossOriginEmbedderPolicy: false,
>   contentSecurityPolicy: {
>     directives: {
>       imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>       manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
>       frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
>     },
>   },
> }));

#### Utilisation avec Fastify

Si vous utilisez `FastifyAdapter`, installez le package [@fastify/helmet](https://github.com/fastify/fastify-helmet) :

```bash
$ npm i --save @fastify/helmet
```

[fastify-helmet](https://github.com/fastify/fastify-helmet) ne doit pas être utilisé comme un middleware, mais comme un [plugin Fastify](https://www.fastify.io/docs/latest/Reference/Plugins/), c'est-à-dire en utilisant `app.register()` :

```typescript
import helmet from '@fastify/helmet'
// quelque part dans votre fichier d'initialisation
await app.register(helmet)
```

> warning **Attention** Lors de l'utilisation de `apollo-server-fastify` et `@fastify/helmet`, il peut y avoir un problème avec [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) sur le terrain de jeu GraphQL, pour résoudre cette collision, configurez le CSP comme indiqué ci-dessous :
>
> ```typescript
> await app.register(fastifyHelmet, {
>    contentSecurityPolicy: {
>      directives: {
>        defaultSrc: [`'self'`, 'unpkg.com'],
>        styleSrc: [
>          `'self'`,
>          `'unsafe-inline'`,
>          'cdn.jsdelivr.net',
>          'fonts.googleapis.com',
>          'unpkg.com',
>        ],
>        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
>        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
>        scriptSrc: [
>          `'self'`,
>          `https: 'unsafe-inline'`,
>          `cdn.jsdelivr.net`,
>          `'unsafe-eval'`,
>        ],
>      },
>    },
>  });
>
> // Si vous n'avez pas l'intention d'utiliser CSP, vous pouvez utiliser ceci :
> await app.register(fastifyHelmet, {
>   contentSecurityPolicy: false,
> });
> ```
