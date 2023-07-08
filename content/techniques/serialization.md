### Sérialisation

La sérialisation est un processus qui se déroule avant que les objets ne soient renvoyés dans une réponse réseau. Il s'agit d'un endroit approprié pour fournir des règles de transformation et d'assainissement des données à renvoyer au client. Par exemple, les données sensibles telles que les mots de passe doivent toujours être exclues de la réponse. Par ailleurs, certaines propriétés peuvent nécessiter une transformation supplémentaire, comme l'envoi d'un sous-ensemble de propriétés d'une entité. Effectuer ces transformations manuellement peut s'avérer fastidieux et source d'erreurs, et peut vous laisser dans l'incertitude que tous les cas ont été pris en compte.

#### Vue d'ensemble

Nest fournit une fonctionnalité intégrée qui permet de s'assurer que ces opérations peuvent être effectuées de manière simple. L'intercepteur `ClassSerializerInterceptor` utilise le puissant package [class-transformer](https://github.com/typestack/class-transformer) pour fournir un moyen déclaratif et extensible de transformer les objets. L'opération de base qu'il effectue est de prendre la valeur retournée par un gestionnaire de méthode et d'appliquer la fonction `instanceToPlain()` de [class-transformer](https://github.com/typestack/class-transformer). Ce faisant, il peut appliquer les règles exprimées par les décorateurs `class-transformer` sur une classe entité/DTO, comme décrit ci-dessous.

> info **Astuce** La sérialisation ne s'applique pas aux réponses [StreamableFile](https://docs.nestjs.com/techniques/streaming-files#streamable-file-class).

#### Exclure des propriétés

Supposons que nous voulions exclure automatiquement une propriété `password` d'une entité utilisateur. Nous annotons l'entité comme suit :

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

Considérons maintenant un contrôleur avec un gestionnaire de méthode qui renvoie une instance de cette classe.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password',
  });
}
```

> **Attention** Notez que nous devons renvoyer une instance de la classe. Si vous renvoyez un simple objet JavaScript, par exemple, `{{ '{' }} user : new UserEntity() {{ '}' }}`, l'objet ne sera pas correctement sérialisé.

> info **Astuce** La classe `ClassSerializerInterceptor` est importée de `@nestjs/common`.

Lorsque ce point d'accès est sollicité, le client reçoit la réponse suivante :

```json
{
  "id": 1,
  "firstName": "Kamil",
  "lastName": "Mysliwiec"
}
```

Notez que l'intercepteur peut être appliqué à l'ensemble de l'application (comme indiqué [ici](https://docs.nestjs.com/interceptors#binding-interceptors)). La combinaison de l'intercepteur et de la déclaration de la classe d'entité assure que **n'importe quelle méthode qui retourne une `UserEntity` sera sûre de supprimer la propriété `password`. Cela permet de centraliser l'application de cette règle de gestion.

#### Exposer des propriétés

Vous pouvez utiliser le décorateur `@Expose()` pour fournir des noms d'alias pour les propriétés, ou pour exécuter une fonction afin de calculer la valeur d'une propriété (analogue aux fonctions **getter**), comme illustré ci-dessous.

```typescript
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

#### Transformer

Vous pouvez effectuer des transformations de données supplémentaires en utilisant le décorateur `@Transform()`. Par exemple, la construction suivante renvoie la propriété name de l'entité `RoleEntity` au lieu de renvoyer l'objet entier.

```typescript
@Transform(({ value }) => value.name)
role: RoleEntity;
```

#### Passer des options

Vous pouvez vouloir modifier le comportement par défaut des fonctions de transformation. Pour surcharger les paramètres par défaut, passez-les dans un objet `options` avec le décorateur `@SerializeOptions()`.

```typescript
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
```

> info **Astuce** Le décorateur `@SerializeOptions()` est importé de `@nestjs/common`.

Les options passées via `@SerializeOptions()` sont passées en tant que second argument de la fonction sous-jacente `instanceToPlain()`. Dans cet exemple, nous excluons automatiquement toutes les propriétés qui commencent par le préfixe `_`.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/21-serializer).

#### WebSockets et Microservices

Bien que ce chapitre montre des exemples utilisant des applications de type HTTP (par exemple, Express ou Fastify), le `ClassSerializerInterceptor` fonctionne de la même manière pour les WebSockets et les Microservices, quelle que soit la méthode de transport utilisée.

#### En savoir plus

Pour en savoir plus sur les décorateurs et options disponibles dans le package `class-transformer` [lisez ceci](https://github.com/typestack/class-transformer).
