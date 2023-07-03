import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CachingComponent } from './caching/caching.component';
import { CompressionComponent } from './compression/compression.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { CookiesComponent } from './cookies/cookies.component';
import { EventsComponent } from './events/events.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { HttpModuleComponent } from './http-module/http-module.component';
import { LoggerComponent } from './logger/logger.component';
import { MongoComponent } from './mongo/mongo.component';
import { MvcComponent } from './mvc/mvc.component';
import { PerformanceComponent } from './performance/performance.component';
import { QueuesComponent } from './queues/queues.component';
import { SerializationComponent } from './serialization/serialization.component';
import { ServerSentEventsComponent } from './server-sent-events/server-sent-events.component';
import { SessionComponent } from './sessions/sessions.component';
import { SqlComponent } from './sql/sql.component';
import { StreamingFilesComponent } from './streaming-files/streaming-files.component';
import { TaskSchedulingComponent } from './task-scheduling/task-scheduling.component';
import { ValidationComponent } from './validation/validation.component';
import { VersioningComponent } from './versioning/versioning.component';

const routes: Routes = [
  {
    path: 'authentication',
    redirectTo: '/security/authentication',
  },
  {
    path: 'mvc',
    component: MvcComponent,
    data: { title: 'Modèle-Vue-Contrôleur' },
  },
  {
    path: 'serialization',
    component: SerializationComponent,
    data: { title: 'Sérialisation' },
  },
  {
    path: 'caching',
    component: CachingComponent,
    data: { title: 'Gestion du cache' },
  },
  {
    path: 'validation',
    component: ValidationComponent,
    data: { title: 'Validation' },
  },
  {
    path: 'sql',
    redirectTo: 'database',
  },
  {
    path: 'database',
    component: SqlComponent,
    data: { title: 'Base de données' },
  },
  {
    path: 'mongodb',
    component: MongoComponent,
    data: { title: 'MongoDB' },
  },
  {
    path: 'file-upload',
    component: FileUploadComponent,
    data: { title: 'Téléchargement de fichiers' },
  },
  {
    path: 'streaming-files',
    component: StreamingFilesComponent,
    data: { title: 'Flux de fichier' },
  },
  {
    path: 'logger',
    component: LoggerComponent,
    data: { title: 'Journalisation' },
  },
  {
    path: 'performance',
    component: PerformanceComponent,
    data: { title: 'Performance (Fastify)' },
  },
  {
    path: 'http-module',
    component: HttpModuleComponent,
    data: { title: 'Module HTTP' },
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
    data: { title: 'Configuration' },
  },
  {
    path: 'security',
    redirectTo: '/security/helmet',
  },
  {
    path: 'cookies',
    component: CookiesComponent,
    data: { title: 'Cookies' },
  },
  {
    path: 'task-scheduling',
    component: TaskSchedulingComponent,
    data: { title: 'Planification des tâches' },
  },
  {
    path: 'compression',
    component: CompressionComponent,
    data: { title: 'Compression' },
  },
  {
    path: 'queues',
    component: QueuesComponent,
    data: { title: 'Queues' },
  },
  {
    path: 'hot-reload',
    redirectTo: '/recipes/hot-reload',
  },
  {
    path: 'server-sent-events',
    component: ServerSentEventsComponent,
    data: { title: 'Événements envoyés par le serveur' },
  },
  {
    path: 'versioning',
    component: VersioningComponent,
    data: { title: 'Gestion des versions' },
  },
  {
    path: 'events',
    component: EventsComponent,
    data: { title: 'Événements' },
  },
  {
    path: 'session',
    component: SessionComponent,
    data: { title: 'Session' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    SqlComponent,
    MvcComponent,
    MongoComponent,
    QueuesComponent,
    LoggerComponent,
    TaskSchedulingComponent,
    PerformanceComponent,
    EventsComponent,
    FileUploadComponent,
    HttpModuleComponent,
    ConfigurationComponent,
    CompressionComponent,
    VersioningComponent,
    ValidationComponent,
    CachingComponent,
    SerializationComponent,
    ServerSentEventsComponent,
    SessionComponent,
    CookiesComponent,
    StreamingFilesComponent,
  ],
})
export class TechniquesModule {}
