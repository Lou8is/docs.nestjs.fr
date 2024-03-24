### Sécurité

Pour définir les mécanismes de sécurité à utiliser pour une opération spécifique, utilisez le décorateur `@ApiSecurity()`.

```typescript
@ApiSecurity('basic')
@Controller('cats')
export class CatsController {}
```

Avant de lancer votre application, n'oubliez pas d'ajouter la définition de sécurité à votre document de base en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addSecurity('basic', {
  type: 'http',
  scheme: 'basic',
});
```

Certaines des techniques d'authentification les plus populaires sont intégrées (par exemple, `basic` et `bearer`) et vous n'avez donc pas à définir manuellement les mécanismes de sécurité comme indiqué ci-dessus.

#### Authentification de base

Pour activer l'authentification de base, utilisez `@ApiBasicAuth()`.

```typescript
@ApiBasicAuth()
@Controller('cats')
export class CatsController {}
```

Avant de lancer votre application, n'oubliez pas d'ajouter la définition de sécurité à votre document de base en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addBasicAuth();
```

#### Authentification du porteur

Pour activer l'authentification du porteur, utilisez `@ApiBearerAuth()`.

```typescript
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```

Avant de lancer votre application, n'oubliez pas d'ajouter la définition de sécurité à votre document de base en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addBearerAuth();
```

#### Authentification OAuth2

Pour activer OAuth2, utilisez `@ApiOAuth2()`.

```typescript
@ApiOAuth2(['pets:write'])
@Controller('cats')
export class CatsController {}
```

Avant de lancer votre application, n'oubliez pas d'ajouter la définition de sécurité à votre document de base en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addOAuth2();
```

#### Authentification par cookie

Pour activer l'authentification par cookie, utilisez `@ApiCookieAuth()`.

```typescript
@ApiCookieAuth()
@Controller('cats')
export class CatsController {}
```

Avant de lancer votre application, n'oubliez pas d'ajouter la définition de sécurité à votre document de base en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addCookieAuth('optional-session-id');
```
