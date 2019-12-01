import * as snabbdom from "snabbdom";
import clazz from "snabbdom/modules/class";
import props from "snabbdom/modules/props";
import style from "snabbdom/modules/style";
import listeners from "snabbdom/modules/eventlisteners";
import h from "snabbdom/h";
import { Node, PathItem, map, forEach } from "./graph";
import PruneMap from "./PruneMap";
import {
  renderParamsChanged,
  isComponentClass,
  isElementNode,
  getDisplayName
} from "./utils";
import throttle from 'lodash.throttle'

var patch = snabbdom.init([clazz, props, style, listeners]);

type Element = any;

interface Props {
  [key: string]: any;
}

abstract class Component {
  render: (options: {
      props: Props;
      state: any;
      setState: (updater: any) => void;
    }) => Element;
  subscriptions: any[];
  getDisplayName = (): string => this.constructor.name;
  initialState: any;
  setState: Function;

  constructor(setState) {
    this.setState = setState
  }
}

interface RenderContext {
  requestRender: () => void;
}

const createElement = (type, props, ...children) => {
  return new ElementNode(type, props, children);
};

class ElementNode implements Node {
  public type: Component | string;
  public props: Props;
  public children: Element[];

  constructor(type: typeof Component | string, props: Props, children: Element[]) {
    this.type = type;
    this.props = props;
    //If array provided as children, flatten it
    this.children = children.flatMap(x => x);
  }
}

const elementToVdom = (element: Element): any => {
  if (!isElementNode(element)) {
    if (!element) {
      return "";
    }
    return String(element);
  }
  return h(
    element.type,
    {
      ...element.props,
      on: {
        click: element.props.onClick
      }
    },
    element.children ? element.children.map(c => elementToVdom(c)) : []
  );
};

class ComponentStateNode {
  private context: RenderContext;
  private component: Component;
  private elementTree: Element = null;
  private state: object = {};
  private componentMap = new PruneMap<ComponentStateNode>();
  private oldParams = {};

  constructor(ComponentClass: typeof Component, context: RenderContext) {
    this.context = context;
    this.component = new ComponentClass();
    this.component.setState = this.setState
    this.state = this.component.initialState;
  }

  setState = updater => {
    let nextState = updater;
    if (typeof updater === "function") {
      nextState = updater(this.state);
    }
    this.state = nextState;
    this.context.requestRender();
  };

  update = (props: Props) => {
    // prepare map to prune unused components at the end of the update
    this.componentMap.reset();
    let newParams = {
      props,
      state: this.state,
      setState: this.setState
    };
    // rerender this component if any state/props have changed
    if (renderParamsChanged(this.oldParams, newParams)) {
      this.elementTree = this.component.render(newParams);
      this.oldParams = newParams;
    }
    forEach(this.elementTree, (elementNode, path) => {
      if (elementNode && isComponentClass(elementNode.type)) {
        const pathStr = getPathStr(path);
        let child = this.componentMap.get(pathStr);
        if (!child) {
          child = new ComponentStateNode(elementNode.type, this.context);
          this.componentMap.set(pathStr, child);
        }
        child.update({
          ...elementNode.props, 
          children: elementNode.children
        });
      }
    });
    // prune components that are unmounting
    this.componentMap.prune();
  };

  toElement = (): Element => {
    return map<Element, Element>(this.elementTree, (elementNode, path) => {
      if (!isElementNode(elementNode)) {
        return elementNode;
      }
      if (isComponentClass(elementNode.type)) {
        const pathStr = getPathStr(path);
        let child = this.componentMap.get(pathStr);
        return child.toElement();
      }
      return new ElementNode(
        elementNode.type,
        elementNode.props,
        elementNode.children
      );
    });
  };
}

const mount = (element: Element, container: HTMLElement) => {
  // Make a component on the fly to render the element tree
  // passed to the mount function
  class RootComponent extends Component {
    render = () => element
  }

  let lastDom = container;

  const render = () => {
    // update all components (ones with same props/state will not rerender)
    rootNode.update({});
    // reduce to element tree and then to snabbdom tree
    let nextDom = elementToVdom(rootNode.toElement());
    // patch last dom with new one
    patch(lastDom, nextDom);
    // update last dom to new one
    lastDom = nextDom;
  };

  let rootNode = new ComponentStateNode(RootComponent, {
    // Called on setState to indicate an update needs to happen
    // right now this is sync, but for performance/batching
    // reasons it should be throttled
    requestRender: throttle(() => {
      render();
    }, 5)
  });

  render();
};

const getPathStr = (path: PathItem<Element>[]) =>
  path
    .map(pathItem => `${pathItem.key}-${getDisplayName(pathItem.value)}`)
    .join(".");

export { mount, createElement, ElementNode, Component };
