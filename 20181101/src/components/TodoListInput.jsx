import React from 'react';

const TodoListInput = (props) => <div>
    <table className="todo-input">
        <tbody>
            <tr>
                <td>
                    Item
                </td>
                <td>
                    <input className="todo-input-box" id="todo_input_task"/>
                </td>
            </tr>
            <tr>
                <td>
                    <button onClick={() => props.onSubmit(document.getElementById('todo_input_task').value)}>submit ;)</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>;

export default TodoListInput;