import React from 'react';

const TodoListItem = (props) => <tr>
    <td>
        <button onClick={props.onDelete}>delete</button>
        <button onClick={props.onUpdate}>update</button>
    </td>
    <td>
        {props.item.id}
    </td>
    <td>
        {props.item.task}
    </td>
</tr>;

export default TodoListItem;