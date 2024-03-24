### Types mappés

Lorsque vous développez des fonctionnalités telles que **CRUD** (Create/Read/Update/Delete, littéralement Créer/Lire/Mettre à jour/Supprimer), il est souvent utile de construire des variantes d'un type d'entité de base. Nest fournit plusieurs fonctions utilitaires qui effectuent des transformations de type pour rendre cette tâche plus pratique.

#### Partial

Lors de la création de types de validation d'entrée (également appelés DTO), il est souvent utile de créer des variantes **create** et **update** du même type. Par exemple, la variante **create** peut exiger tous les champs, tandis que la variante **update** peut rendre tous les champs optionnels.

Nest fournit la fonction utilitaire `PartialType()` pour rendre cette tâche plus facile et minimiser le travail fastidieux.

La fonction `PartialType()` renvoie un type (classe) avec toutes les propriétés du type d'entrée définies comme optionnelles. Par exemple, supposons que nous ayons un type **create** comme suit :

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Par défaut, tous ces champs sont obligatoires. Pour créer un type avec les mêmes champs, mais avec chacun d'entre eux optionnel, utilisez `PartialType()` en passant la référence de la classe (`CreateCatDto`) comme argument :

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **Astuce** La fonction `PartialType()` est importée du paquet `@nestjs/swagger`.

#### Pick

La fonction `PickType()` construit un nouveau type (classe) en choisissant un ensemble de propriétés à partir d'un type d'entrée. Par exemple, supposons que nous commencions avec un type comme :

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Nous pouvons choisir un ensemble de propriétés dans cette classe en utilisant la fonction utilitaire `PickType()` :

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **Astuce** La fonction `PickType()` est importée du paquet `@nestjs/swagger`.

#### Omit

La fonction `OmitType()` construit un type en prenant toutes les propriétés d'un type d'entrée et en supprimant un ensemble particulier de clés. Par exemple, supposons que nous commencions avec un type comme :

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Nous pouvons générer un type dérivé qui possède toutes les propriétés **excepté** `name` comme montré ci-dessous. Dans cette construction, le second argument de `OmitType` est un tableau de noms de propriétés.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **Astuce** La fonction `OmitType()` est importée du paquet `@nestjs/swagger`.

#### Intersection

La fonction `IntersectionType()` combine deux types en un nouveau type (classe). Par exemple, supposons que nous commencions avec deux types comme :

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  breed: string;
}

export class AdditionalCatInfo {
  @ApiProperty()
  color: string;
}
```

Nous pouvons générer un nouveau type qui combine toutes les propriétés des deux types.

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

> info **Astuce** La fonction `IntersectionType()` est importée du paquet `@nestjs/swagger`.

#### Composition

Les fonctions utilitaires de mise en correspondance des types sont composables. Par exemple, la fonction suivante produira un type (classe) qui possède toutes les propriétés du type `CreateCatDto` à l'exception de `name`, et ces propriétés seront définies comme optionnelles :

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```
