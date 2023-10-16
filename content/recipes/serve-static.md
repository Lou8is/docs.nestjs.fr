### Serve Static

Afin de servir un contenu statique comme une application à page unique (SPA), nous pouvons utiliser le module `ServeStaticModule` du package [`@nestjs/serve-static`](https://www.npmjs.com/package/@nestjs/serve-static).

#### Installation

Nous devons d'abord installer le package requis :

```bash
$ npm install --save @nestjs/serve-static
```

#### Bootstrap

Une fois le processus d'installation terminé, nous pouvons importer le module `ServeStaticModule` dans le module racine `AppModule` et le configurer en passant un objet de configuration à la méthode `forRoot()`.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Avec ceci en place, construisez le site web statique et placez son contenu dans l'emplacement spécifié par la propriété `rootPath`.

#### Configuration

[ServeStaticModule](https://github.com/nestjs/serve-static) peut être configuré avec une variété d'options pour personnaliser son comportement.
Vous pouvez définir le chemin de rendu de votre application statique, spécifier des chemins exclus, activer ou désactiver l'en-tête de réponse Cache-Control, etc. Voir la liste complète des options [ici](https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts).

> warning **Remarque** Le `renderPath` par défaut de l'application statique est `*` (tous les chemins), et le module enverra des fichiers "index.html" en réponse.
> Il vous permet de créer un routage côté client pour votre SPA. Les chemins d'accès spécifiés dans vos contrôleurs seront renvoyés vers le serveur.
> Vous pouvez modifier ce comportement en paramétrant `serveRoot`, `renderPath` en les combinant avec d'autres options.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/24-serve-static).
