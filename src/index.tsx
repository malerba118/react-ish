import { createElement, mount, Component } from "./framework";

// Struggling to get typescript to compile jsx with different pragma
// So just mocking out React.createElement with my own implementation
const React = { createElement };

class App extends Component {
  render = () => {
    console.log("App rendering");
    return (
      <div>
        <Parent />
      </div>
    );
  };
}

class Parent extends Component {
  initialState = {
    color: "red"
  };

  toggleColor = () => {
    this.setState(prev => ({
      color: prev.color === "teal" ? "red" : "teal"
    }));
  };

  render = ({ state }) => {
    console.log("Parent rendering");
    return (
      <div>
        <button
          style={{ fontSize: "16px", color: state.color }}
          onClick={this.toggleColor}
        >
          Toggle color
        </button>
        <ChildOne color={state.color}>Child One</ChildOne>
        <ChildTwo />
      </div>
    );
  };
}

class ChildOne extends Component {
  render = ({ props }) => {
    console.log("ChildOne rendering");
    return <h1 style={{ color: props.color }}>{props.children}</h1>;
  };
}

class ChildTwo extends Component {
  render = () => {
    console.log("ChildTwo rendering");
    return <h1>Child Two</h1>;
  };
}

const rootElement = document.getElementById("root");

mount(<App />, rootElement);
