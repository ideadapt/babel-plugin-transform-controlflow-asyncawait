//tslint:disable function-name
//tslint:disable no-default-export
//tslint:disable no-implicit-dependencies

import {NodePath} from 'babel-traverse';
import * as t from 'babel-types';

// tslint:disable-next-line typedef
export default function () {
  const webdriverCommands = [
    'click',
    'getText',
    'sendKeys',
    'isSelected',
    'isEnabled',
    'getAttribute',
  ];

  const protractorApi = [
    'count',
    'isDisplayed',
  ];

  function createCustomCallRegex(customNames: string = 'get|open|enter|clear') {
    return new RegExp(`^\\w*(${customNames})\\w*`, 'mi');
  }

  return {
    name: 'transformAsyncAwait',
    visitor: {
      Identifier(path: NodePath<t.Identifier>) {
        if (path.node.name === 'it') {
          if (path.parentPath.isCallExpression()) {
            const itFn = path.parent as t.CallExpression;
            if (t.isFunctionExpression(itFn.arguments[1]) || t.isArrowFunctionExpression(itFn.arguments[1])) {
              const callback = itFn.arguments[1] as t.FunctionExpression | t.ArrowFunctionExpression;
              if (!callback.async) {
                callback.async = true;
              }
            }
          }
        }

        if (webdriverCommands.includes(path.node.name) || protractorApi.includes(path.node.name)) {
          if (t.isMemberExpression(path.parentPath)) {
            const wrappingStatement = path.getStatementParent();
            const callExpression = path.findParent((p: NodePath) => t.isCallExpression(p)) as NodePath<t.CallExpression>;
            const statementContainsCall = callExpression != null && wrappingStatement.node.start <= callExpression.node.start;
            if (statementContainsCall) {
              if (!callExpression.parentPath.isAwaitExpression()) {
                callExpression.replaceWith(t.awaitExpression(callExpression.node));
                callExpression.getFunctionParent().node.async = true;
              }
            }
          }
        }
      },
      CallExpression(path: NodePath<t.CallExpression>, state: {opts: { customCalls: string}}) {
        if (!path.parentPath.isAwaitExpression() && !path.parentPath.isMemberExpression()) {
          const customCallsRegex = createCustomCallRegex(state.opts.customCalls);
          let toTest = '';
          if (t.isMemberExpression(path.node.callee)) {
            const member = path.node.callee as t.MemberExpression;
            toTest = (member.property as t.Identifier).name;
          } else if (t.isIdentifier(path.node.callee)) {
            toTest = (path.node.callee as t.Identifier).name;
          }
          if (customCallsRegex.test(toTest)) {
            path.replaceWith(t.awaitExpression(path.node));
            path.getFunctionParent().node.async = true;
          }
        }
      },
    },
  };
}
