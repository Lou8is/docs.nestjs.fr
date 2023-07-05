### Protection CSRF

Cross-site request forgery (également connu sous le nom de CSRF ou XSRF) est un type d'exploitation malveillante d'un site web où des commandes **non autorisées** sont transmises par un utilisateur en qui l'application web a confiance. Pour atténuer ce type d'attaque, vous pouvez utiliser le package [csurf](https://github.com/expressjs/csurf).

#### Utilisation avec Express (par défaut)

Commencez par installer le package requis :

```bash
$ npm i --save csurf
```

> warning **Attention** Ce package est obsolète, référez-vous à la [documentation `csurf`](https://github.com/expressjs/csurf#csurf) pour plus d'informations.

> warning **Attention** Comme expliqué dans la [documentation `csurf`](https://github.com/expressjs/csurf#csurf), ce middleware nécessite que le middleware de session ou le `cookie-parser` soit initialisé en premier. Veuillez consulter cette documentation pour plus d'instructions.

Une fois l'installation terminée, appliquez le middleware `csurf` en tant que middleware global.

```typescript
import * as csurf from 'csurf';
// ...
// quelque part dans votre fichier d'initialisation
app.use(csurf());
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
