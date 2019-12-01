import { Component } from './framework'

const renderParamsChanged = (oldParams, newParams) => {
  let propsChanged;
  if (!isObject(oldParams.props) || !isObject(newParams.props)) {
    propsChanged = oldParams.props !== newParams.props;
  } else if (!keysEqual(oldParams.props, newParams.props)) {
    propsChanged = true;
  } else {
    propsChanged = Object.keys(newParams.props)
      .filter(k => k !== "__source")
      .some(k => {
        if (k === 'children') {
          // special check for children
          // if children exist, let's rerender
          return newParams.props[k].length > 0
        }
        else {
          return oldParams.props[k] !== newParams.props[k]
        }
       });
  }
  let stateChanged = oldParams.state !== newParams.state;
  return propsChanged || stateChanged;
};

const keysEqual = (o1, o2) => {
  const o1Keys = Object.keys(o1);
  const o2Keys = Object.keys(o2);
  o1Keys.sort();
  o2Keys.sort();
  return JSON.stringify(o1Keys) === JSON.stringify(o2Keys);
};

const isObject = o => {
  return typeof o === "object" && o !== null;
};

function isComponentClass(o: any): boolean {
  if (o && o.prototype instanceof Component) {
    return true;
  }
  return false;
}

function isElementNode(o: any): boolean {
  if (o && o.type && o.props && o.children) {
    return true;
  }
  return false;
}

function getDisplayName(element: any): string {
  if (!isElementNode(element)) {
    return String(element);
  }
  if (isComponentClass(element.type)) {
    return element.type.name;
  }
  return element.type;
}

export {
  renderParamsChanged,
  isObject,
  isComponentClass,
  isElementNode,
  getDisplayName
};
