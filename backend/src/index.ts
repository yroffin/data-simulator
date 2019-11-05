import { Container } from 'inversify';
import { ApplicationServer } from './interface/application-server';
import { WebServer } from './app/server';
import { DefaultCtrl } from './ctrl/default-controller';
import { Store } from './interface/store';
import { QuadStore } from './service/quad-store';
import { DefaultLogger } from './service/default-logger';
import { Logger } from './interface/logger';

const myContainer = new Container();
myContainer.bind<Logger>("Logger").to(DefaultLogger).inSingletonScope();
myContainer.bind<DefaultCtrl>("DefaultCtrl").to(DefaultCtrl).inSingletonScope();
myContainer.bind<Store>("Store").to(QuadStore).inSingletonScope();
myContainer.bind<ApplicationServer>("WebServer").to(WebServer).inSingletonScope();

myContainer.get<Logger>("Logger").initialize();
myContainer.get<Store>("Store").initialize();

myContainer.get<ApplicationServer>("WebServer").listen();