import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit {
  @Input()
  isSidebarOpened = true;
  readonly items = [
    {
      title: 'Introduction',
      isOpened: false,
      path: '/',
    },
    {
      title: 'Vue d\'ensemble',
      isOpened: true,
      children: [
        { title: 'Premiers pas', path: '/first-steps' },
        { title: 'Contrôleurs', path: '/controllers' },
        { title: 'Fournisseurs', path: '/providers' },
        { title: 'Modules', path: '/modules' },
        { title: 'Middleware', path: '/middleware' },
        { title: 'Filtres d\'exception', path: '/exception-filters' },
        { title: 'Pipes', path: '/pipes' },
        { title: 'Gardes', path: '/guards' },
        { title: 'Intercepteurs', path: '/interceptors' },
        { title: 'Décorateurs personnalisés', path: '/custom-decorators' },
      ],
    },
    {
      title: 'Fondamentaux',
      isOpened: false,
      children: [
        { title: 'Fournisseurs personnalisés', path: '/fundamentals/custom-providers' },
        {
          title: 'Fournisseurs asynchrones',
          path: '/fundamentals/async-providers',
        },
        {
          title: 'Modules dynamiques',
          path: '/fundamentals/dynamic-modules',
        },
        {
          title: 'Portées d\'injection',
          path: '/fundamentals/injection-scopes',
        },
        {
          title: 'Dépendance circulaire',
          path: '/fundamentals/circular-dependency',
        },
        {
          title: 'Référence de module',
          path: '/fundamentals/module-ref',
        },
        {
          title: 'Lazy-loading de modules',
          path: '/fundamentals/lazy-loading-modules',
        },
        {
          title: 'Contexte d\'exécution',
          path: '/fundamentals/execution-context',
        },
        {
          title: 'Événements du cycle de vie',
          path: '/fundamentals/lifecycle-events',
        },
        {
          title: 'Agnosticisme de plateforme',
          path: '/fundamentals/platform-agnosticism',
        },
        { title: 'Tests', path: '/fundamentals/testing' },
      ],
    },
    {
      title: 'Techniques',
      isOpened: false,
      children: [
        { title: 'Configuration', path: '/techniques/configuration' },
        { title: 'Base de données', path: '/techniques/database' },
        { title: 'Mongo', path: '/techniques/mongodb' },
        { title: 'Validation', path: '/techniques/validation' },
        { title: 'Gestion du cache', path: '/techniques/caching' },
        { title: 'Sérialisation', path: '/techniques/serialization' },
        { title: 'Gestion des versions', path: '/techniques/versioning' },
        { title: 'Planification des tâches', path: '/techniques/task-scheduling' },
        { title: 'Queues', path: '/techniques/queues' },
        { title: 'Journalisation', path: '/techniques/logger' },
        { title: 'Cookies', path: '/techniques/cookies' },
        { title: 'Événements', path: '/techniques/events' },
        { title: 'Compression', path: '/techniques/compression' },
        { title: 'Téléchargement de fichiers', path: '/techniques/file-upload' },
        { title: 'Flux de fichier', path: '/techniques/streaming-files' },
        { title: 'Module HTTP', path: '/techniques/http-module' },
        { title: 'Session', path: '/techniques/session' },
        { title: 'Modèle-Vue-Contrôleur', path: '/techniques/mvc' },
        { title: 'Performance (Fastify)', path: '/techniques/performance' },
        { title: 'Événements envoyés par le serveur', path: '/techniques/server-sent-events' },
      ],
    },
    {
      title: 'Sécurité',
      isOpened: false,
      children: [
        { title: 'Authentification', path: '/security/authentication' },
        { title: 'Autorisation', path: '/security/authorization' },
        {
          title: 'Chiffrement et hachage',
          path: '/security/encryption-and-hashing',
        },
        { title: 'Helmet', path: '/security/helmet' },
        { title: 'CORS', path: '/security/cors' },
        { title: 'Protection CSRF', path: '/security/csrf' },
        { title: 'Limitation du débit', path: '/security/rate-limiting' },
      ],
    },
    {
      title: 'GraphQL',
      isOpened: false,
      children: [
        { title: 'Démarrage rapide', path: '/graphql/quick-start' },
        { title: 'Résolveurs', path: '/graphql/resolvers' },
        { title: 'Mutations', path: '/graphql/mutations' },
        { title: 'Abonnements', path: '/graphql/subscriptions' },
        { title: 'Scalaires', path: '/graphql/scalars' },
        { title: 'Directives', path: '/graphql/directives' },
        { title: 'Interfaces', path: '/graphql/interfaces' },
        { title: 'Unions et Enums', path: '/graphql/unions-and-enums' },
        { title: 'Field middleware', path: '/graphql/field-middleware' },
        { title: 'Types mappés', path: '/graphql/mapped-types' },
        { title: 'Plugins', path: '/graphql/plugins' },
        { title: 'Complexité', path: '/graphql/complexity' },
        { title: 'Extensions', path: '/graphql/extensions' },
        { title: 'Plugin CLI', path: '/graphql/cli-plugin' },
        { title: 'Générer le SDL', path: '/graphql/generating-sdl' },
        { title: 'Partage de modèles', path: '/graphql/sharing-models' },
        {
          title: 'Autres fonctionnalités',
          path: '/graphql/other-features',
        },
        { title: 'Fédération', path: '/graphql/federation' },
        { title: 'Guide de migration', path: '/graphql/migration-guide' },
      ],
    },
    {
      title: 'WebSockets',
      isOpened: false,
      children: [
        { title: 'Gateways', path: '/websockets/gateways' },
        { title: 'Filtres d\'exception', path: '/websockets/exception-filters' },
        { title: 'Pipes', path: '/websockets/pipes' },
        { title: 'Gardes', path: '/websockets/guards' },
        { title: 'Intercepteurs', path: '/websockets/interceptors' },
        { title: 'Adaptateurs', path: '/websockets/adapter' },
      ],
    },
    {
      title: 'Microservices',
      isOpened: false,
      children: [
        { title: 'Vue d\'ensemble', path: '/microservices/basics' },
        { title: 'Redis', path: '/microservices/redis' },
        { title: 'MQTT', path: '/microservices/mqtt' },
        { title: 'NATS', path: '/microservices/nats' },
        { title: 'RabbitMQ', path: '/microservices/rabbitmq' },
        { title: 'Kafka', path: '/microservices/kafka' },
        { title: 'gRPC', path: '/microservices/grpc' },
        {
          title: 'Transporteurs personnalisés',
          path: '/microservices/custom-transport',
        },
        {
          title: 'Filtres d\'exception',
          path: '/microservices/exception-filters',
        },
        { title: 'Pipes', path: '/microservices/pipes' },
        { title: 'Gardes', path: '/microservices/guards' },
        { title: 'Intercepteurs', path: '/microservices/interceptors' },
      ],
    },
    {
      title: 'Applications indépendantes',
      isOpened: false,
      path: '/application-context',
    },
    {
      title: 'CLI',
      isOpened: false,
      children: [
        { title: 'Vue d\'ensemble', path: '/cli/overview' },
        { title: 'Espaces de travail', path: '/cli/monorepo' },
        { title: 'Bibliothèques', path: '/cli/libraries' },
        { title: 'Usage', path: '/cli/usages' },
        { title: 'Scripts', path: '/cli/scripts' },
      ],
    },
    {
      title: 'OpenAPI',
      isOpened: false,
      children: [
        { title: 'Introduction', path: '/openapi/introduction' },
        {
          title: 'Types et paramètres',
          path: '/openapi/types-and-parameters',
        },
        { title: 'Opérations', path: '/openapi/operations' },
        { title: 'Sécurité', path: '/openapi/security' },
        { title: 'Types mappés', path: '/openapi/mapped-types' },
        { title: 'Décorateurs', path: '/openapi/decorators' },
        { title: 'Plugin CLI', path: '/openapi/cli-plugin' },
        { title: 'Autres fonctionnalités', path: '/openapi/other-features' },
        { title: 'Guide de migration', path: '/openapi/migration-guide' },
      ],
    },
    {
      title: 'Recettes',
      isOpened: false,
      children: [
        { title: 'REPL', path: '/recipes/repl' },
        { title: 'Générateur CRUD', path: '/recipes/crud-generator' },
        { title: 'SWC (fast compiler)', path: '/recipes/swc' },
        { title: 'Passport (auth)', path: '/recipes/passport' },
        { title: 'Rechargement à chaud', path: '/recipes/hot-reload' },
        { title: 'MikroORM', path: '/recipes/mikroorm' },
        { title: 'TypeORM', path: '/recipes/sql-typeorm' },
        { title: 'Mongoose', path: '/recipes/mongodb' },
        { title: 'Sequelize', path: '/recipes/sql-sequelize' },
        { title: 'Module Router', path: '/recipes/router-module' },
        { title: 'Swagger', path: '/recipes/swagger' },
        { title: 'Contrôles de santé', path: '/recipes/terminus' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'Compodoc', path: '/recipes/documentation' },
        { title: 'Prisma', path: '/recipes/prisma' },
        { title: 'Serve static', path: '/recipes/serve-static' },
        { title: 'Commander', path: '/recipes/nest-commander' },
        { title: 'Async local storage', path: '/recipes/async-local-storage' },
        { title: 'Automock', path: '/recipes/automock' },
      ],
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'Serverless', path: '/faq/serverless' },
        { title: 'Adaptateur HTTP', path: '/faq/http-adapter' },
        { title: 'Préfixe de chemin global', path: '/faq/global-prefix' },
        { title: 'Corps brut', path: '/faq/raw-body' },
        { title: 'Application hybride', path: '/faq/hybrid-application' },
        { title: 'HTTPS et serveurs multiples', path: '/faq/multiple-servers' },
        { title: 'Cycle de vie de la requête', path: '/faq/request-lifecycle' },
        { title: 'Erreurs fréquentes', path: '/faq/common-errors' },
        {
          title: 'Exemples',
          externalUrl: 'https://github.com/nestjs/nest/tree/master/sample',
        },
      ],
    },
    {
      title: 'Devtools',
      isNew: true,
      isOpened: false,
      children: [
        { title: 'Vue d\'ensemble', path: '/devtools/overview' },
        { title: 'Intégration CI/CD', path: '/devtools/ci-cd-integration' },
      ],
    },
    {
      title: 'Guide de migration',
      isOpened: false,
      path: '/migration-guide',
    },
    {
      title: 'Cours officiels',
      externalUrl: 'https://courses.nestjs.com/',
    },
    {
      title: 'Découvrir',
      isOpened: false,
      children: [{ title: 'Qui utilise Nest ?', path: '/discover/companies' }],
    },
    // {
    //   title: 'T-Shirts and Hoodies',
    //   externalUrl: 'https://nestjs.threadless.com/',
    // },
    {
      title: 'Soutenez-nous',
      isOpened: false,
      path: '/support',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((event) => this.toggleCategory());

    this.toggleCategory();
  }

  toggleCategory() {
    const { firstChild } = this.route.snapshot;
    if (
      (firstChild.url && firstChild.url[1]) ||
      (firstChild.url &&
        firstChild.routeConfig &&
        firstChild.routeConfig.loadChildren)
    ) {
      const { path } = firstChild.url[0];
      const index = this.items.findIndex(
        ({ title }) => title.toLowerCase() === path,
      );
      if (index < 0) {
        return;
      }
      this.items[index].isOpened = true;
      this.items[1].isOpened = false;
    }
  }
}
