//tslint:disable no-multiline-string
//tslint:disable import-name
import * as pluginTester from 'babel-plugin-tester';
import * as path from 'path';
import main from '../src/main';

pluginTester({
  plugin: main,
  pluginName: 'controlflow-asyncawait',
  fixtures: path.join(__dirname, '..', '__fixtures__'),
});
