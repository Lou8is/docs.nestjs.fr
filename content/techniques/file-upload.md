### Téléchargement de fichiers

Pour gérer le téléchargement de fichiers, Nest fournit un module intégré basé sur le package middleware [multer](https://github.com/expressjs/multer) pour Express. Multer gère les données affichées au format `multipart/form-data`, qui est principalement utilisé pour le téléchargement de fichiers via une requête HTTP `POST`. Ce module est entièrement configurable et vous pouvez adapter son comportement aux besoins de votre application.

> warning **Attention** Multer ne peut pas traiter les données qui ne sont pas dans le format multipart supporté (`multipart/form-data`). Notez également que ce paquet n'est pas compatible avec le `FastifyAdapter`.

Pour une meilleure sécurité des types, installons le paquet de types Multer :

```shell
$ npm i -D @types/multer
```

Avec ce paquet installé, nous pouvons maintenant utiliser le type `Express.Multer.File` (vous pouvez importer ce type comme suit : `import {{ '{' }} Express {{ '}' }} from 'express'`).

#### Exemple basique

Pour télécharger un seul fichier, il suffit de lier l'intercepteur `FileInterceptor()` au gestionnaire de route et d'extraire `file` de la `request` en utilisant le décorateur `@UploadedFile()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
@@switch
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
```

> info **Astuce** Le décorateur `FileInterceptor()` est exporté depuis le paquet `@nestjs/platform-express`. Le décorateur `@UploadedFile()` est exporté depuis le paquet `@nestjs/common`.

Le décorateur `FileInterceptor()` prend deux arguments :

- `fieldName`: chaîne de caractères qui fournit le nom du champ du formulaire HTML qui contient un fichier
- `options`: objet optionnel de type `MulterOptions`. C'est le même objet que celui utilisé par le constructeur de multer (plus de détails [ici](https://github.com/expressjs/multer#multeropts)).

> warning **Attention** `FileInterceptor()` peut ne pas être compatible avec des fournisseurs de clouds tiers tels que Google Firebase ou autres.

#### Validation de fichiers

Souvent, il peut être utile de valider les métadonnées d'un fichier entrant, comme la taille ou le mime-type du fichier. Pour cela, vous pouvez créer votre propre [Pipe](https://docs.nestjs.com/pipes) et le lier au paramètre annoté avec le décorateur `UploadedFile`. L'exemple ci-dessous montre comment un pipe basique de validation de taille de fichier pourrait être implémenté :

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value" est un objet contenant les attributs et les métadonnées du fichier
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
```

Nest fournit un pipe intégré pour gérer les cas d'utilisation courants et faciliter/standardiser l'ajout de nouveaux cas. Ce tube est appelé `ParseFilePipe`, et vous pouvez l'utiliser comme suit :

```typescript
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... Ensemble d'instances de validateurs de fichiers ici
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
```

Comme vous pouvez le voir, il est nécessaire de spécifier un tableau de validateurs de fichiers qui seront exécutés par le `ParseFilePipe`. Nous allons discuter de l'interface d'un validateur, mais il vaut la peine de mentionner que ce pipe a aussi deux options **optionnelles** supplémentaires :

<table>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td>Le code d'état HTTP à afficher en cas d'échec de <b>n'importe lequel</b> des validateurs. La valeur par défaut est <code>400</code> (BAD REQUEST)</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td>Une fabrique qui reçoit le message d'erreur et renvoie une erreur.</td>
  </tr>
</table>

Revenons maintenant à l'interface `FileValidator`. Pour intégrer des validateurs à cette pipe, vous devez soit utiliser les implémentations intégrées, soit fournir votre propre `FileValidator`. Voir l'exemple ci-dessous :

```typescript
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * Indique si ce fichier doit être considéré comme valide, selon les options passées dans le constructeur.
   * @param file le fichier contenu dans l'objet requête
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * Crée un message d'erreur en cas d'échec de la validation.
   * @param file le fichier contenu dans l'objet requête
   */
  abstract buildErrorMessage(file: any): string;
}
```

> info **Astuce** L'interface `FileValidator` supporte la validation asynchrone via sa fonction `isValid`. Pour tirer parti de la sécurité des types, vous pouvez aussi taper le paramètre `file` comme `Express.Multer.File` dans le cas où vous utilisez express (par défaut) comme pilote.

`FileValidator` est une classe normale qui a accès à l'objet fichier et le valide en fonction des options fournies par le client. Nest possède deux implémentations intégrées de `FileValidator` que vous pouvez utiliser dans votre projet :

- `MaxFileSizeValidator` - Vérifie si la taille d'un fichier donné est inférieure à la valeur fournie (mesurée en `bytes`)
- `FileTypeValidator` - Vérifie si le type de mime d'un fichier donné correspond à la valeur donnée.

> warning **Attention** Pour vérifier le type de fichier, la classe [FileTypeValidator](https://github.com/nestjs/nest/blob/master/packages/common/pipes/file/file-type.validator.ts) utilise le type détecté par multer. Par défaut, multer déduit le type de fichier à partir de l'extension du fichier sur l'appareil de l'utilisateur. Cependant, il ne vérifie pas le contenu réel du fichier. Comme les fichiers peuvent être renommés avec des extensions arbitraires, envisagez d'utiliser une implémentation personnalisée (comme la vérification du [nombre magique](https://www.ibm.com/support/pages/what-magic-number) du fichier) si votre application nécessite une solution plus sûre.

Pour comprendre comment ils peuvent être utilisés en conjonction avec le `FileParsePipe` mentionné plus haut, nous allons utiliser un extrait modifié du dernier exemple présenté :

```typescript
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
```

> info **Astuce** Si le nombre de validateurs augmente considérablement ou si leurs options encombrent le fichier, vous pouvez définir ce tableau dans un fichier séparé et l'importer ici sous la forme d'une constante nommée comme `fileValidators`.

Enfin, vous pouvez utiliser la classe spéciale `ParseFilePipeBuilder` qui vous permet de composer et de construire vos validateurs. En l'utilisant comme indiqué ci-dessous, vous pouvez éviter l'instanciation manuelle de chaque validateur et simplement passer leurs options directement :

```typescript
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
```

> info **Astuce** La présence d'un fichier est requise par défaut, mais vous pouvez la rendre optionnelle en ajoutant le paramètre `fileIsRequired : false` dans les options de la fonction `build` (au même niveau que `errorHttpStatusCode`).

#### Liste de fichiers

Pour télécharger un ensemble de fichiers (identifiés par un seul nom de champ), utilisez le décorateur `FilesInterceptor()` (notez le pluriel **Files** dans le nom du décorateur). Ce décorateur prend trois arguments :

- `fieldName`: comme décrit ci-dessus
- `maxCount`: nombre facultatif définissant le nombre maximum de fichiers à accepter
- `options`: objet facultatif `MulterOptions`, comme décrit ci-dessus

Lorsque vous utilisez `FilesInterceptor()`, extrayez les fichiers de la `request` avec le décorateur `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
```

> info **Astuce** Le décorateur `FilesInterceptor()` est exporté depuis le paquet `@nestjs/platform-express`. Le décorateur `@UploadedFiles()` est exporté depuis le paquet `@nestjs/common`.

#### Fichiers multiples

Pour télécharger plusieurs fichiers (tous avec des noms de champs différents), utilisez le décorateur `FileFieldsInterceptor()`. Ce décorateur prend deux arguments :

- `uploadedFields`: un tableau d'objets, où chaque objet spécifie une propriété obligatoire `name` avec une valeur de chaîne spécifiant un nom de champ, comme décrit ci-dessus, et une propriété optionnelle `maxCount`, comme décrit ci-dessus
- `options`: objet facultatif `MulterOptions`, comme décrit ci-dessus

Lorsque vous utilisez `FileFieldsInterceptor()`, extrayez les fichiers de la `request` avec le décorateur `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
```

#### N'importe quel fichier

Pour télécharger tous les champs avec des clés de noms de champs arbitraires, utilisez le décorateur `AnyFilesInterceptor()`. Ce décorateur peut accepter un objet optionnel `options` comme décrit ci-dessus.

Lorsque vous utilisez `AnyFilesInterceptor()`, extrayez les fichiers de la `request` avec le décorateur `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
```


#### Pas de fichier

Pour accepter `multipart/form-data` mais ne pas autoriser le téléchargement de fichiers, utilisez le `NoFilesInterceptor`. Cela définit les données multipart comme des attributs sur le corps de la requête. Tout fichier envoyé avec la requête lancera une `BadRequestException`.

```typescript
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
```

#### Options par défaut

Vous pouvez spécifier des options multer dans les intercepteurs de fichiers comme décrit ci-dessus. Pour définir les options par défaut, vous pouvez appeler la méthode statique `register()` lorsque vous importez le `MulterModule`, en passant les options supportées. Vous pouvez utiliser toutes les options listées [ici](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register({
  dest: './upload',
});
```

> info **Astuce** La classe `MulterModule` est exportée du paquetage `@nestjs/platform-express`.

#### Configuration asynchrone

Lorsque vous avez besoin de définir les options de `MulterModule` de manière asynchrone plutôt que statique, utilisez la méthode `registerAsync()`. Comme pour la plupart des modules dynamiques, Nest fournit plusieurs techniques pour gérer la configuration asynchrone.

Une technique consiste à utiliser une fonction d'usine :

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
```

Comme les autres [fournisseurs d'usine](/fundamentals/custom-providers#fournisseurs-de-factory--usefactory), notre fonction d'usine peut être `async` et peut injecter des dépendances via `inject`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

Alternativement, vous pouvez configurer le `MulterModule` en utilisant une classe au lieu d'une fabrique, comme montré ci-dessous :

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

La construction ci-dessus instancie `MulterConfigService` à l'intérieur de `MulterModule`, en l'utilisant pour créer l'objet d'options requis. Notez que dans cet exemple, le `MulterConfigService` doit implémenter l'interface `MulterOptionsFactory`, comme montré ci-dessous. Le `MulterModule` appellera la méthode `createMulterOptions()` sur l'objet instancié de la classe fournie.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
```

Si vous voulez réutiliser un fournisseur d'options existant au lieu de créer une copie privée dans le `MulterModule`, utilisez la syntaxe `useExisting`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Vous pouvez également passer ce que l'on appelle des `extraProviders` à la méthode `registerAsync()`. Ces fournisseurs seront fusionnés avec les fournisseurs du module.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

C'est utile lorsque vous souhaitez fournir des dépendances supplémentaires à la fonction d'usine ou au constructeur de la classe.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/29-file-upload).
