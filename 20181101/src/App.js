import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import TodoSelector from './components/TodoSelector';

class App extends Component {
  render() {
    return (
      <div className="app">
        <div className="app-content">
          <h1>Todo List</h1>
          <TodoSelector />
        </div>
      </div>
    );
  }
}

export default App;
