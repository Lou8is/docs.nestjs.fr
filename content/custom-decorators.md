### Décorateurs de routes personnalisés

Nest est construit autour d'une fonctionnalité du langage appelée **décorateurs**. Les décorateurs sont un concept bien connu dans de nombreux langages de programmation, mais dans le monde JavaScript, ils sont encore relativement nouveaux. Pour mieux comprendre le fonctionnement des décorateurs, nous vous recommandons de lire [cet article](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841). Voici une définition simple :

<blockquote class="external">
  Un décorateur ES2016 est une expression qui renvoie une fonction et peut prendre une cible, un nom et un descripteur de propriété comme arguments.
 Vous l'appliquez en préfixant le décorateur avec un caractère <code>@</code> et en le plaçant tout en haut de ce que vous essayez de décorer.
 Les décorateurs peuvent être définis pour une classe, une méthode ou une propriété.
</blockquote>

#### Décorateurs de paramètres

Nest fournit un ensemble de **décorateurs de paramètres** utiles que vous pouvez utiliser avec les gestionnaires de routes HTTP. Voici une liste des décorateurs fournis et des objets Express (ou Fastify) qu'ils représentent

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td>
    </tr>
    <tr>
      <td><code>@Response(), @Res()</code></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(param?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[param]</code></td>
    </tr>
    <tr>
      <td><code>@Body(param?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[param]</code></td>
    </tr>
    <tr>
      <td><code>@Query(param?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[param]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(param?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[param]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

En outre, vous pouvez créer vos propres **décorateurs personnalisés**. Pourquoi cela est-il utile ?

Dans le monde de node.js, il est courant d'attacher des propriétés à l'objet **request**. Ensuite, vous les extrayez manuellement dans chaque gestionnaire de route, en utilisant un code comme le suivant :

```typescript
const user = req.user;
```

Afin de rendre votre code plus lisible et transparent, vous pouvez créer un décorateur `@User()` et le réutiliser dans tous vos contrôleurs.

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

Vous pouvez ensuite l'utiliser là où vous le souhaitez.

```typescript
@@filename()
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}
@@switch
@Get()
@Bind(User())
async findOne(user) {
  console.log(user);
}
```

#### Transmettre des données

Lorsque le comportement de votre décorateur dépend de certaines conditions, vous pouvez utiliser le paramètre `data` pour passer un argument à la fonction factory du décorateur. Un cas d'utilisation pour cela est un décorateur personnalisé qui extrait des propriétés de l'objet de requête par clé. Supposons, par exemple, que notre <a href="techniques/authentication#implementing-passport-strategies">couche d'authentification</a> valide les requêtes et attache une entité utilisateur à l'objet requête. L'entité utilisateur pour une requête authentifiée pourrait ressembler à :

```json
{
  "id": 101,
  "firstName": "Alan",
  "lastName": "Turing",
  "email": "alan@email.com",
  "roles": ["admin"]
}
```

Définissons un décorateur qui prend un nom de propriété comme clé, et retourne la valeur associée si elle existe (ou `undefined` si elle n'existe pas, ou si l'objet `user` n'a pas été créé).

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
@@switch
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user && user[data] : user;
});
```

Voici comment accéder à une propriété particulière via le décorateur `@User()` dans le contrôleur :

```typescript
@@filename()
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}
@@switch
@Get()
@Bind(User('firstName'))
async findOne(firstName) {
  console.log(`Hello ${firstName}`);
}
```

Vous pouvez utiliser ce même décorateur avec différentes clés pour accéder à différentes propriétés. Si l'objet `user` est profond ou complexe, cela peut rendre l'implémentation du gestionnaire de requête plus facile et plus lisible.

> info **Astuce** Pour les utilisateurs de TypeScript, notez que `createParamDecorator<T>()` est un générique. Cela signifie que vous pouvez explicitement appliquer la sécurité de type, par exemple `createParamDecorator<string>((data, ctx) => ...)`. Il est également possible de spécifier un type de paramètre dans la fonction fabrique, par exemple `createParamDecorator((data : string, ctx) => ...)`. Si vous omettez les deux, le type de `data` sera `any`.

#### Travailler avec des pipes

Nest traite les décorateurs de paramètres personnalisés de la même manière que les décorateurs intégrés (`@Body()`, `@Param()` et `@Query()`). Cela signifie que les pipes sont exécutés pour les paramètres annotés de manière personnalisée (dans nos exemples, l'argument `user`). De plus, vous pouvez appliquer le pipe directement au décorateur personnalisé :

```typescript
@@filename()
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
@@switch
@Get()
@Bind(User(new ValidationPipe({ validateCustomDecorators: true })))
async findOne(user) {
  console.log(user);
}
```

> info **Astuce** Notez que l'option `validateCustomDecorators` doit être fixée à true. `ValidationPipe` ne valide pas les arguments annotés avec les décorateurs personnalisés par défaut.

#### Composition des décorateurs

Nest fournit une méthode d'aide pour composer plusieurs décorateurs. Par exemple, supposons que vous souhaitiez combiner tous les décorateurs liés à l'authentification en un seul décorateur. Cela peut se faire avec la construction suivante :

```typescript
@@filename(auth.decorator)
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
@@switch
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

Vous pouvez alors utiliser ce décorateur personnalisé `@Auth()` comme suit :

```typescript
@Get('users')
@Auth('admin')
findAllUsers() {}
```

Cela a pour effet d'appliquer les quatre décorateurs en une seule déclaration.

> warning **Attention** Le décorateur `@ApiHideProperty()` du paquet `@nestjs/swagger` n'est pas composable et ne fonctionnera pas correctement avec la fonction `applyDecorators`.
