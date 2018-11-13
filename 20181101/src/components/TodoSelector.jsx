import React, { Component } from 'react';
import TodoList from './TodoList';

const API_URL = 'http://todoapiswin.azurewebsites.net/api';

class TodoSelector extends Component {
    state = {
        selected: 'test',
        keys: ['test']
    }

    constructor(props) {
        super(props);
    }

    async componentWillMount() {
        await this.read();
    };

    async read() {
        let keys = await (await fetch(`${API_URL}/Todo/keys`)).json();
        this.setState({keys});
    };

    render() {
        return(<div>
            <select option={this.state.selected} onChange={e => this.setState({selected: e.target.value})}>
                {this.state.keys.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>

            <TodoList apiKey={this.state.selected}/>
        </div>);
    }
}

export default TodoSelector;