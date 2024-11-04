### Plugin CLI

Le système de réflexion sur les métadonnées de [TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html) présente plusieurs limites qui l'empêchent, par exemple, de déterminer les propriétés d'une classe ou de reconnaître si une propriété donnée est facultative ou obligatoire. Cependant, certaines de ces contraintes peuvent être résolues au moment de la compilation. Nest fournit un plugin qui améliore le processus de compilation de TypeScript afin de réduire la quantité de code de type "boilerplate" nécessaire.

> info **Astuce** Ce plugin est **sur activation**. Si vous préférez, vous pouvez déclarer tous les décorateurs manuellement, ou seulement les décorateurs spécifiques dont vous avez besoin.

#### Vue d'ensemble

Le plugin Swagger va automatiquement :

- annoter toutes les propriétés DTO avec `@ApiProperty` sauf si `@ApiHideProperty` est utilisé
- définir la propriété `required` en fonction du point d'interrogation (par exemple, `name? : string` définira `required : false`)
- fixer la propriété `type` ou `enum` en fonction du type (supporte aussi les tableaux)
- définir la propriété `default` en fonction de la valeur par défaut assignée
- définir plusieurs règles de validation basées sur les décorateurs `class-validator` (si `classValidatorShim` est fixé à `true`)
- ajouter un décorateur de réponse à chaque endpoint avec un statut et un `type` appropriés (modèle de réponse)
- générer des descriptions pour les propriétés et les endpoints en se basant sur les commentaires (si `introspectComments` est fixé à `true`)
- générer des exemples de valeurs pour les propriétés en se basant sur les commentaires (si `introspectComments` est fixé à `true`)

Veuillez noter que vos noms de fichiers **doivent avoir** l'un des suffixes suivants : `['.dto.ts', '.entity.ts']` (par exemple, `create-user.dto.ts`) afin d'être analysé par le plugin.

Si vous utilisez un suffixe différent, vous pouvez ajuster le comportement du plugin en spécifiant l'option `dtoFileNameSuffix` (voir ci-dessous).

Auparavant, si vous vouliez fournir une expérience interactive avec l'interface Swagger, vous deviez dupliquer beaucoup de code pour faire savoir au package comment vos modèles/composants devaient être déclarés dans la spécification. Par exemple, vous pouviez définir une simple classe `CreateUserDto` comme suit :

```typescript
export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: RoleEnum, default: [], isArray: true })
  roles: RoleEnum[] = [];

  @ApiProperty({ required: false, default: true })
  isEnabled?: boolean = true;
}
```

Bien qu'il ne s'agisse pas d'un problème important pour les projets de taille moyenne, il devient verbeux et difficile à maintenir une fois que vous avez un grand nombre de classes.

En [activant le plugin Swagger](/openapi/cli-plugin#utiliser-le-plugin-cli), la définition de la classe ci-dessus peut être déclarée simplement :

```typescript
export class CreateUserDto {
  email: string;
  password: string;
  roles: RoleEnum[] = [];
  isEnabled?: boolean = true;
}
```

> info **Note** Le plugin Swagger dérive les annotations @ApiProperty() des types TypeScript et des décorateurs de validation de classe. Cela permet de décrire clairement votre API dans la documentation générée par l'interface utilisateur Swagger. Cependant, la validation au moment de l'exécution sera toujours gérée par les décorateurs class-validator. Il est donc nécessaire de continuer à utiliser des validateurs comme `IsEmail()`, `IsNumber()`, etc.

Par conséquent, si vous avez l'intention de vous appuyer sur des annotations automatiques pour générer des documentations et que vous souhaitez toujours des validations au moment de l'exécution, les décorateurs class-validator sont toujours nécessaires.

> info **Astuce** Lorsque vous utilisez des [utilitaires de types mappés](/openapi/mapped-types) (comme `PartialType`) dans les DTOs, importez-les depuis `@nestjs/swagger` au lieu de `@nestjs/mapped-types` pour que le plugin prenne en compte le schéma.

Le plugin ajoute les décorateurs appropriés à la volée en se basant sur l'**Arbre Syntaxique Abstrait**. Ainsi, vous n'aurez pas à vous battre avec les décorateurs `@ApiProperty` disséminés dans le code.

> info **Astuce** Le plugin génère automatiquement toutes les propriétés swagger manquantes, mais si vous avez besoin de les surcharger, il vous suffit de les définir explicitement via `@ApiProperty()`.

#### Introspection des commentaires

Lorsque la fonction d'introspection des commentaires est activée, le plugin CLI génère des descriptions et des exemples de valeurs pour les propriétés en se basant sur les commentaires.

Par exemple, voici un exemple de propriété `roles` :

```typescript
/**
 * Une liste des rôles de l'utilisateur
 * @example ['admin']
 */
@ApiProperty({
  description: `Une liste des rôles de l'utilisateur`,
  example: ['admin'],
})
roles: RoleEnum[] = [];
```

Vous devez dupliquer les valeurs de description et d'exemple. Avec `introspectComments` activé, le plugin CLI peut extraire ces commentaires et fournir automatiquement des descriptions (et des exemples, si définis) pour les propriétés. Maintenant, la propriété ci-dessus peut être déclarée simplement comme suit :

```typescript
/**
 * Une liste des rôles de l'utilisateur
 * @example ['admin']
 */
roles: RoleEnum[] = [];
```

Il y a des options de plugin `dtoKeyOfComment` et `controllerKeyOfComment` que vous disponible pour personnaliser la façon dont le plugin va assigner les valeurs aux décorateurs `ApiProperty` et `ApiOperation` respectivement. Voir l'exemple ci-dessous :

```typescript
export class SomeController {
  /**
   * Créer une ressource
   */
  @Post()
  create() {}
}
```

Cela équivaut à l'instruction suivante :

```typescript
@ApiOperation({ summary: "Créer une ressource" })
```

> info **Astuce** Pour les modèles, la même logique s'applique mais est utilisée avec le décorateur `ApiProperty` à la place.

Pour les contrôleurs, vous pouvez fournir non seulement un résumé, mais aussi une description (remarques), des balises (telles que @deprecated`) et des exemples de réponses, comme ceci :

```typescript
/**
 * Créer un nouveau chat
 *
 * @remarks Cette opération permet de créer un nouveau chat.
 *
 * @deprecated
 * @throws {500} Something went wrong.
 * @throws {400} Bad Request.
 */
@Post()
async create(): Promise<Cat> {}
```

#### Utiliser le plugin CLI

Pour activer le plugin, ouvrez `nest-cli.json` (si vous utilisez [Nest CLI](/cli/overview)) et ajoutez la configuration `plugins` suivante :

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

Vous pouvez utiliser la propriété `options` pour personnaliser le comportement du plugin.

```javascript
"plugins": [
  {
    "name": "@nestjs/swagger",
    "options": {
      "classValidatorShim": false,
      "introspectComments": true
    }
  }
]
```

La propriété `options` doit remplir l'interface suivante :

```typescript
export interface PluginOptions {
  dtoFileNameSuffix?: string[];
  controllerFileNameSuffix?: string[];
  classValidatorShim?: boolean;
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
}
```

<table>
  <tr>
    <th>Option</th>
    <th>Par défaut</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>dtoFileNameSuffix</code></td>
    <td><code>['.dto.ts', '.entity.ts']</code></td>
    <td>Suffixe des fichiers DTO (Data Transfer Object)</td>
  </tr>
  <tr>
    <td><code>controllerFileNameSuffix</code></td>
    <td><code>.controller.ts</code></td>
    <td>Suffixe des fichiers du contrôleur</td>
  </tr>
  <tr>
    <td><code>classValidatorShim</code></td>
    <td><code>true</code></td>
    <td>Si la valeur est fixée à true, le module réutilisera les décorateurs de validation <code>class-validator</code> (par exemple, <code>@Max(10)</code> ajoutera <code>max: 10</code> à la définition du schéma) </td>
  </tr>
  <tr>
    <td><code>dtoKeyOfComment</code></td>
    <td><code>'description'</code></td>
    <td>Clé de propriété à laquelle attribuer le texte du commentaire sur <code>ApiProperty</code>.</td>
  </tr>
  <tr>
    <td><code>controllerKeyOfComment</code></td>
    <td><code>'summary'</code></td>
    <td>Clé de propriété à laquelle attribuer le texte du commentaire  <code>ApiOperation</code>.</td>
  </tr>
  <tr>
  <td><code>introspectComments</code></td>
    <td><code>false</code></td>
    <td>Si la valeur est fixée à true, le plugin génère des descriptions et des exemples de valeurs pour les propriétés en se basant sur les commentaires.</td>
  </tr>
</table>

Assurez-vous de supprimer le dossier `/dist` et de reconstruire votre application à chaque fois que les options du plugin sont mises à jour.
Si vous n'utilisez pas le CLI mais que vous avez une configuration personnalisée de `webpack`, vous pouvez utiliser ce plugin en combinaison avec `ts-loader` :

```javascript
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
```

#### Constructeur SWC 

Pour les configurations standard (non monorepo), pour utiliser les plugins CLI avec le constructeur SWC, vous devez activer le contrôle de type, comme décrit [ici](/recipes/swc#vérification-de-type).

```bash
$ nest start -b swc --type-check
```

Pour les installations monorepo, suivez les instructions [ici](/recipes/swc#monorepo-et-plugins-cli).

```bash
$ npx ts-node src/generate-metadata.ts
# OU npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

Maintenant, le fichier de métadonnées sérialisé doit être chargé par la méthode `SwaggerModule#loadPluginMetadata`, comme montré ci-dessous :

```typescript
import metadata from './metadata'; // <-- fichier généré automatiquement par le "PluginMetadataGenerator"

await SwaggerModule.loadPluginMetadata(metadata); // <-- ici
const document = SwaggerModule.createDocument(app, config);
```

#### Intégration avec `ts-jest` (tests e2e)

Pour exécuter les tests e2e, `ts-jest` compile vos fichiers de code source à la volée, en mémoire. Cela signifie qu'il n'utilise pas le compilateur Nest CLI et n'applique aucun plugin ou n'effectue aucune transformation AST.

Pour activer le plugin, créez le fichier suivant dans votre répertoire de tests e2e :

```javascript
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
// vous devez changer le numéro de version à chaque fois que vous modifiez la configuration ci-dessous - sinon, jest ne détectera pas les changements
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // options @nestjs/swagger/plugin (peut être vide)
    },
    cs.program, // "cs.tsCompiler.program" pour les anciennes versions de Jest (<= v27)
  );
};
```

Avec ceci en place, importez le transformateur AST dans votre fichier de configuration `jest`. Par défaut (dans l'application de démarrage), le fichier de configuration des tests e2e est situé dans le dossier `test` et est nommé `jest-e2e.json`.

```json
{
  ... // autres configurations
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<chemin d'accès au fichier créé ci-dessus>"]
      }
    }
  }
}
```

Si vous utilisez `jest@^29`, alors utilisez l'extrait ci-dessous, car l'approche précédente a été dépréciée.

```json
{
  ... // autres configurations
  "transform": {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        "astTransformers": {
          "before": ["<chemin d'accès au fichier créé ci-dessus>"]
        }
      }
    ]
  }
}
```

#### Dépannage de `jest` (tests e2e)

Dans le cas où `jest` ne semble pas prendre en compte vos changements de configuration, il est possible que Jest ait déjà **mis en cache** le résultat de la construction. Pour appliquer la nouvelle configuration, vous devez vider le répertoire de cache de Jest.

Pour vider le répertoire de cache, exécutez la commande suivante dans le dossier de votre projet NestJS :

```bash
$ npx jest --clearCache
```

Si la suppression automatique du cache échoue, vous pouvez toujours supprimer manuellement le dossier cache à l'aide des commandes suivantes :

```bash
# Trouver le répertoire de cache de jest (habituellement /tmp/jest_rs)
# en exécutant la commande suivante à la racine de votre projet NestJS
$ npx jest --showConfig | grep cache
# exemple de résultat :
#   "cache": true,
#   "cacheDirectory": "/tmp/jest_rs"

# Supprimer ou vider le répertoire de cache de Jest
$ rm -rf  <valeur de cacheDirectory>
# par exemple :
# rm -rf /tmp/jest_rs
```
