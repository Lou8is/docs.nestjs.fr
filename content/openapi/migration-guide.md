### Guide de migration

Si vous utilisez actuellement `@nestjs/swagger@3.*`, notez les changements suivants dans la version 4.0.

#### Changements de rupture

Les décorateurs suivants ont été modifiés/renommés :

- `@ApiModelProperty` est maintenant `@ApiProperty`
- `@ApiModelPropertyOptional` est maintenant `@ApiPropertyOptional`
- `@ApiResponseModelProperty` est maintenant `@ApiResponseProperty`
- `@ApiImplicitQuery` est maintenant `@ApiQuery`
- `@ApiImplicitParam` est maintenant `@ApiParam`
- `@ApiImplicitBody` est maintenant `@ApiBody`
- `@ApiImplicitHeader` est maintenant `@ApiHeader`
- `@ApiOperation({{ '{' }} title: 'test' {{ '}' }})` est maintenant `@ApiOperation({{ '{' }} summary: 'test' {{ '}' }})`
- `@ApiUseTags` est maintenant `@ApiTags`

`DocumentBuilder` changements radicaux (mise à jour des signatures de méthodes) :

- `addTag`
- `addBearerAuth`
- `addOAuth2`
- `setContactEmail` est maintenant `setContact`
- `setHost` a été supprimé
- `setSchemes` a été supprimé (utiliser `addServer` à la place, par exemple, `addServer('http://')`)

#### Nouvelles méthodes

Les méthodes suivantes ont été ajoutées :

- `addServer`
- `addApiKey`
- `addBasicAuth`
- `addSecurity`
- `addSecurityRequirements`

<app-banner-devtools></app-banner-devtools>
