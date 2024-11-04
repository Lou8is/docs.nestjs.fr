### Protection CSRF

Le Cross-site request forgery (CSRF ou XSRF) est un type d'attaque par lequel des commandes **non autorisées** sont envoyées d'un utilisateur de confiance à une application web. Pour éviter cela, vous pouvez utiliser le paquet [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf).

#### Utilisation avec Express (par défaut)

Commencez par installer le package requis :

```bash
$ npm i csrf-csrf
```

> warning **Attention** Comme indiqué dans la [documentation csrf-csrf] (https://github.com/Psifi-Solutions/csrf-csrf?tab=readme-ov-file#getting-started), ce middleware nécessite que le middleware de session ou `cookie-parser` soit initialisé au préalable. Veuillez vous référer à la documentation pour plus de détails.

Une fois l'installation terminée, appliquez le middleware `csrf-csrf` en tant que middleware global.

```typescript
import { doubleCsrf } from 'csrf-csrf';
// ...
// quelque part dans votre fichier d'initialisation
const {
  invalidCsrfTokenError, // This is provided purely for convenience if you plan on creating your own middleware.
  generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
```

#### Utilisation avec Fastify

Commencez par installer le package requis :

```bash
$ npm i --save @fastify/csrf-protection
```

Une fois l'installation terminée, enregistrez le plugin `@fastify/csrf-protection`, comme suit :

```typescript
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// quelque part dans votre fichier d'initialisation après l'enregistrement d'un plugin de stockage
await app.register(fastifyCsrf);
```

> warning **Attention** Comme expliqué dans la documentation `@fastify/csrf-protection` [ici](https://github.com/fastify/csrf-protection#usage), ce plugin nécessite l'initialisation préalable d'un plugin de stockage. Veuillez consulter cette documentation pour plus d'instructions.
