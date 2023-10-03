### Guide de migration

Cet article fournit un ensemble de lignes directrices pour la migration de la version 9 de Nest vers la version 10.
Pour en savoir plus sur les nouvelles fonctionnalités de la version 10, consultez cet [article](https://trilon.io/blog/nestjs-10-is-now-available).
Il y a eu quelques changements très mineurs qui ne devraient pas affecter la plupart des utilisateurs - vous pouvez en trouver la liste complète [ici](https://github.com/nestjs/nest/releases/tag/v10.0.0).

#### Mise à jour des packages

Bien que vous puissiez mettre à jour vos packages manuellement, nous vous recommandons d'utiliser [ncu (npm check updates)](https://npmjs.com/package/npm-check-updates).

#### Module de cache

Le `CacheModule` a été supprimé du package `@nestjs/common` et est maintenant disponible en tant que package autonome - `@nestjs/cache-manager`. Ce changement a été fait pour éviter des dépendances inutiles dans le package `@nestjs/common`. Vous pouvez en savoir plus sur le package `@nestjs/cache-manager` [ici](/techniques/caching).

#### Dépréciations

Toutes les méthodes et modules obsolètes ont été supprimés.

#### Plugins CLI et TypeScript >= 4.8

Les plugins NestJS CLI (disponibles pour les packages `@nestjs/swagger` et `@nestjs/graphql`) nécessiteront désormais TypeScript >= v4.8 et donc les versions plus anciennes de TypeScript ne seront plus supportées. La raison de ce changement est que [TypeScript v4.8 a introduit plusieurs changements importants](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html#decorators-are-placed-on-modifiers-on-typescripts-syntax-trees) dans son arbre syntaxique abstrait (AST) que nous utilisons pour générer automatiquement les schémas OpenAPI et GraphQL.

#### Abandon du support de Node.js v12

À partir de NestJS 10, nous ne supportons plus Node.js v12, car [v12 est devenu EOL](https://twitter.com/nodejs/status/1524081123579596800) le 30 avril 2022 (EOL signifie End Of Life, littéralement fin de vie). Cela signifie que NestJS 10 nécessite Node.js v16 ou plus. Cette décision a été prise pour nous permettre de fixer enfin la cible à `ES2021` dans notre configuration TypeScript, au lieu d'envoyer des polyfills comme nous le faisions dans le passé.

A partir de maintenant, chaque package officiel de NestJS sera compilé en `ES2021` par défaut, ce qui devrait se traduire par une taille de bibliothèque plus petite et parfois même par des performances (légèrement) meilleures.

Il est également fortement recommandé d'utiliser la dernière version LTS (Long-Time Support, littéralement Support Longue-Durée).
