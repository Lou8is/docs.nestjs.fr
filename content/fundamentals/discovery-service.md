### Service de découverte

Le `DiscoveryService` fourni par le paquetage `@nestjs/core` est un utilitaire puissant qui permet aux développeurs d'inspecter et de récupérer dynamiquement des fournisseurs, des contrôleurs et d'autres métadonnées au sein d'une application NestJS. Ceci est particulièrement utile lors de la construction de plugins, de décorateurs ou de fonctionnalités avancées qui s'appuient sur l'introspection au moment de l'exécution. En utilisant `DiscoveryService`, les développeurs peuvent créer des architectures plus flexibles et modulaires, permettant l'automatisation et le comportement dynamique dans leurs applications.

#### Pour commencer

Avant d'utiliser `DiscoveryService`, vous devez importer le `DiscoveryModule` dans le module où vous avez l'intention de l'utiliser. Cela permet de s'assurer que le service est disponible pour l'injection de dépendances. Vous trouverez ci-dessous un exemple de configuration dans un module NestJS :

```typescript
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

Une fois le module mis en place, `DiscoveryService` peut être injecté dans n'importe quel fournisseur ou service nécessitant une découverte dynamique.

```typescript
@@filename(example.service)
@Injectable()
export class ExampleService {
  constructor(private readonly discoveryService: DiscoveryService) {}
}
@@switch
@Injectable()
@Dependencies(DiscoveryService)
export class ExampleService {
  constructor(discoveryService) {
    this.discoveryService = discoveryService;
  }
}
```

#### Découvrir les fournisseurs et les contrôleurs

L'une des principales fonctionnalités de `DiscoveryService` est la récupération de tous les fournisseurs enregistrés dans l'application. Ceci est utile pour traiter dynamiquement les fournisseurs en fonction de conditions spécifiques. L'extrait suivant montre comment accéder à tous les fournisseurs :

```typescript
const providers = this.discoveryService.getProviders();
console.log(providers);
```

Chaque objet fournisseur contient des informations telles que son instance, son jeton et ses métadonnées. De même, si vous avez besoin de récupérer tous les contrôleurs enregistrés dans l'application, vous pouvez le faire avec :

```typescript
const controllers = this.discoveryService.getControllers();
console.log(controllers);
```

Cette fonction est particulièrement utile pour les scénarios dans lesquels les contrôleurs doivent être traités de manière dynamique, comme le suivi analytique ou les mécanismes d'enregistrement automatique.

#### Extraction des métadonnées

Au-delà de la découverte des fournisseurs et des contrôleurs, `DiscoveryService` permet également de récupérer les métadonnées attachées à ces composants. Ceci est particulièrement utile lorsque l'on travaille avec des décorateurs personnalisés qui stockent des métadonnées à l'exécution.

Par exemple, considérons un cas où un décorateur personnalisé est utilisé pour étiqueter les fournisseurs avec des métadonnées spécifiques :

```typescript
import { DiscoveryService } from '@nestjs/core';

export const FeatureFlag = DiscoveryService.createDecorator();
```

L'application de ce décorateur à un service lui permet de stocker des métadonnées qui peuvent être interrogées ultérieurement :

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlag } from './custom-metadata.decorator';

@Injectable()
@FeatureFlag('experimental')
export class CustomService {}
```

Une fois que les métadonnées sont attachées aux fournisseurs de cette manière, `DiscoveryService` facilite le filtrage des fournisseurs sur la base des métadonnées attribuées. L'extrait de code suivant montre comment récupérer les fournisseurs qui ont été étiquetés avec une valeur de métadonnées spécifique :

```typescript
const providers = this.discoveryService.getProviders();

const [provider] = providers.filter(
  (item) =>
    this.discoveryService.getMetadataByDecorator(FeatureFlag, item) ===
    'experimental',
);

console.log(
  'Fournisseurs avec les métadonnées de l indicateur de fonctionnalité "experimental" :',
  provider,
);
```

#### Conclusion

Le `DiscoveryService` est un outil polyvalent et puissant qui permet l'introspection en cours d'exécution dans les applications NestJS. En permettant la découverte dynamique des fournisseurs, des contrôleurs et des métadonnées, il joue un rôle crucial dans la construction de frameworks extensibles, de plugins et de fonctionnalités automatisées. Que vous ayez besoin d'analyser et de traiter des fournisseurs, d'extraire des métadonnées pour un traitement avancé, ou de créer des architectures modulaires et évolutives, `DiscoveryService` fournit une approche efficace et structurée pour atteindre ces objectifs.