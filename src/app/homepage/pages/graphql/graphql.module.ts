import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MigrationComponent } from './migration/migration.component';
import { CliPluginComponent } from './cli-plugin/cli-plugin.component';
import { ComplexityComponent } from './complexity/complexity.component';
import { DirectivesComponent } from './directives/directives.component';
import { ExtensionsComponent } from './extensions/extensions.component';
import { FederationComponent } from './federation/federation.component';
import { FieldMiddlewareComponent } from './field-middleware/field-middleware.component';
import { GuardsInterceptorsComponent } from './guards-interceptors/guards-interceptors.component';
import { InterfacesComponent } from './interfaces/interfaces.component';
import { MappedTypesComponent } from './mapped-types/mapped-types.component';
import { MutationsComponent } from './mutations/mutations.component';
import { PluginsComponent } from './plugins/plugins.component';
import { QuickStartComponent } from './quick-start/quick-start.component';
import { ResolversMapComponent } from './resolvers-map/resolvers-map.component';
import { ScalarsComponent } from './scalars/scalars.component';
import { SchemaGeneratorComponent } from './schema-generator/schema-generator.component';
import { SharingModelsComponent } from './sharing-models/sharing-models.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { UnionsAndEnumsComponent } from './unions-and-enums/unions.component';

const routes: Routes = [
  {
    path: 'quick-start',
    component: QuickStartComponent,
    data: { title: 'GraphQL + TypeScript' },
  },
  {
    path: 'resolvers-map',
    redirectTo: 'resolvers',
  },
  {
    path: 'resolvers',
    component: ResolversMapComponent,
    data: { title: 'GraphQL + TypeScript - Résolveurs' },
  },
  {
    path: 'mutations',
    component: MutationsComponent,
    data: { title: 'GraphQL + TypeScript - Mutations' },
  },
  {
    path: 'scalars',
    component: ScalarsComponent,
    data: { title: 'GraphQL + TypeScript - Scalaires' },
  },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
    data: { title: 'GraphQL + TypeScript - Abonnements' },
  },
  {
    path: 'guards-interceptors',
    redirectTo: 'other-features',
  },
  {
    path: 'tooling',
    redirectTo: 'other-features',
  },
  {
    path: 'other-features',
    component: GuardsInterceptorsComponent,
    data: { title: 'GraphQL + TypeScript - Autres fonctionnalités' },
  },
  {
    path: 'federation',
    component: FederationComponent,
    data: { title: 'GraphQL + TypeScript - Fédération' },
  },
  {
    path: 'directives',
    component: DirectivesComponent,
    data: { title: 'GraphQL + TypeScript - Directives' },
  },
  {
    path: 'migration-guide',
    component: MigrationComponent,
    data: { title: 'GraphQL + TypeScript - Guide de migration' },
  },
  {
    path: 'field-middleware',
    component: FieldMiddlewareComponent,
    data: { title: 'GraphQL + TypeScript - Field middleware' },
  },
  {
    path: 'complexity',
    component: ComplexityComponent,
    data: { title: 'GraphQL + TypeScript - Complexité' },
  },
  {
    path: 'extensions',
    component: ExtensionsComponent,
    data: { title: 'GraphQL + TypeScript - Extensions' },
  },
  {
    path: 'enums',
    redirectTo: 'unions-and-enums',
  },
  {
    path: 'unions',
    redirectTo: 'unions-and-enums',
  },
  {
    path: 'unions-and-enums',
    component: UnionsAndEnumsComponent,
    data: { title: 'GraphQL + TypeScript - Unions et Enums' },
  },
  {
    path: 'plugins',
    component: PluginsComponent,
    data: { title: 'GraphQL + TypeScript - Plugins' },
  },
  {
    path: 'interfaces',
    component: InterfacesComponent,
    data: { title: 'GraphQL + TypeScript - Interfaces' },
  },
  {
    path: 'sharing-models',
    component: SharingModelsComponent,
    data: { title: 'GraphQL + TypeScript - Partage de modèles' },
  },
  {
    path: 'mapped-types',
    component: MappedTypesComponent,
    data: { title: 'GraphQL + TypeScript - Types mappés' },
  },
  {
    path: 'cli-plugin',
    component: CliPluginComponent,
    data: { title: 'GraphQL + TypeScript - Plugin CLI' },
  },
  {
    path: 'generating-sdl',
    component: SchemaGeneratorComponent,
    data: { title: 'GraphQL + TypeScript - Générer le SDL' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    QuickStartComponent,
    ResolversMapComponent,
    MutationsComponent,
    SubscriptionsComponent,
    DirectivesComponent,
    UnionsAndEnumsComponent,
    PluginsComponent,
    GuardsInterceptorsComponent,
    ScalarsComponent,
    SchemaGeneratorComponent,
    MappedTypesComponent,
    SharingModelsComponent,
    CliPluginComponent,
    FederationComponent,
    ComplexityComponent,
    ExtensionsComponent,
    FieldMiddlewareComponent,
    MigrationComponent,
    InterfacesComponent,
  ],
})
export class GraphqlModule {}
