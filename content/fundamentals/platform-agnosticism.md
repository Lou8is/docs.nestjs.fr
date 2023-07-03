### Agnosticisme de plateforme

Nest est un framework indépendant de toute plateforme. Cela signifie que vous pouvez développer des **parties logiques réutilisables** qui peuvent être utilisées dans différents types d'applications. Par exemple, la plupart des composants peuvent être réutilisés sans changement à travers différents frameworks de serveurs HTTP sous-jacents (par exemple, Express et Fastify), et même à travers différents _types_ d'applications (par exemple, des frameworks de serveurs HTTP, des microservices avec différentes couches de transport, et des WebSockets).

#### Construire une fois, utiliser partout

La section **Vue d'ensemble** de la documentation montre principalement des techniques de codage utilisant des frameworks de serveurs HTTP (par exemple, des applications fournissant une API REST ou fournissant une application rendue côté serveur de style MVC). Cependant, tous ces blocs de construction peuvent être utilisés au-dessus de différentes couches de transport ([microservices](/microservices/basics) ou [websockets](/websockets/gateways)).

En outre, Nest est livré avec un module [GraphQL](/graphql/quick-start) dédié. Vous pouvez utiliser GraphQL comme couche d'API de manière interchangeable avec une API REST.

En outre, la fonctionnalité de [contexte d'application](/application-context) permet de créer n'importe quel type d'application Node.js - y compris des tâches CRON et des applications CLI - au-dessus de Nest.

Nest aspire à être une plateforme à part entière pour les applications Node.js qui apporte un niveau supérieur de modularité et de réutilisation à vos applications. Construisez une fois, utilisez partout !
