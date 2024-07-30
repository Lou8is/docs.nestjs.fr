### Flux de fichier

> info **Note** Ce chapitre montre comment vous pouvez diffuser des fichiers à partir de votre **application HTTP**. Les exemples présentés ci-dessous ne s'appliquent pas aux applications GraphQL ou Microservice.

Il peut arriver que vous souhaitiez renvoyer un fichier au client à partir de votre API REST. Pour ce faire avec Nest, vous devez normalement procéder comme suit :

```ts
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

Mais en faisant cela, vous finissez par perdre l'accès à votre logique d'interception post-contrôleur. Pour gérer cela, vous pouvez retourner une instance de `StreamableFile` et sous le capot, le framework s'occupera du piping de la réponse.

#### Classe StreamableFile

Un `StreamableFile` est une classe qui conserve le flux qui doit être retourné. Pour créer un nouveau `StreamableFile`, vous pouvez passer un `Buffer` ou un `Stream` au constructeur de `StreamableFile`.

> info **Astuce** La classe `StreamableFile` peut être importée depuis `@nestjs/common`.

#### Support multi-plateforme

Fastify, par défaut, peut supporter l'envoi de fichiers sans avoir besoin d'appeler `stream.pipe(res)`, donc vous n'avez pas besoin d'utiliser la classe `StreamableFile`. Cependant, Nest supporte l'utilisation de `StreamableFile` dans les deux types de plateformes, donc si vous passez d'Express à Fastify, il n'y a pas besoin de s'inquiéter de la compatibilité entre les deux moteurs.

#### Exemple

Vous pouvez trouver un exemple simple de retour du `package.json` comme un fichier au lieu d'un JSON ci-dessous, mais l'idée s'étend naturellement aux images, aux documents, et à tout autre type de fichier.

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

Le type de contenu par défaut (la valeur de l'en-tête de réponse HTTP `Content-Type`) est `application/octet-stream`. Si vous avez besoin de personnaliser cette valeur, vous pouvez utiliser l'option `type` de `StreamableFile`, ou utiliser la méthode `res.set` ou le décorateur [`@Header()`](/controllers#headers), comme ceci :

```ts
import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express'; // En partant du principe que nous utilisons l'adaptateur HTTP ExpressJS

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
      // Si vous souhaitez définir la valeur Content-Length avec une autre valeur au lieu de la longueur du fichier :
      // length: 123,
    });
  }

  // Or even:
  @Get()
  getFileChangingResponseObjDirectly(@Res({ passthrough: true }) res: Response): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }

  // Ou même :
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="package.json"')
  getFileUsingStaticValues(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }  
}
```
