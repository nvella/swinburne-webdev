import React, { Component } from 'react';
import TodoListItem from './TodoListItem';
import TodoListInput from './TodoListInput';

const API_URL = 'http://todoapiswin.azurewebsites.net/api';

class TodoList extends Component {
    state = {
        items: []
    };

    constructor(props) {
        super({apiKey: 'test', ...props});
    }

    getOpts = () => `?apiKey=${this.props.apiKey}`;

    async componentWillMount() {
        await this.read();
    };

    componentWillReceiveProps(newProps) {
        if(newProps.apiKey !== this.props.apiKey) setImmediate(() => {
            this.read();
        });
    };

    async delete(item) {
        await fetch(`${API_URL}/Todo/${item.id}${this.getOpts()}`, {
            method: 'DELETE'
        });
        await this.read();
    };

    async update(item) {
        //todo_input_task
        await fetch(`${API_URL}/Todo/${item.id}${this.getOpts()}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task: document.getElementById('todo_input_task').value
            })
        });
        await this.read();
    }

    async create(item) {
        await fetch(`${API_URL}/Todo${this.getOpts()}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        await this.read();
    }

    async read() {
        let items = await (await fetch(`${API_URL}/Todo${this.getOpts()}`)).json();
        this.setState({items});
    };

    render() {
        return(
            <div>
                <TodoListInput onSubmit={(text) => {
                    this.create({
                        task: text
                    });
                }}/>
                <table className="todo-list">
                    <tbody>
                        {this.state.items.map((item) => <TodoListItem 
                            key={item.id}
                            item={item} 
                            onDelete={() => this.delete(item)}
                            onUpdate={() => this.update(item)}
                        />)}
                    </tbody>                
                </table>
            </div>
        );
    };
}

export default TodoList;
