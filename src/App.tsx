import { useEffect, useState } from 'react';
import './App.css';
import { supabase } from './lib/supabase';

type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

// input에 텍스트 입력
// 추가 버튼 입력
// input에 있는 텍스트가 setTodos를 통해 todos 값에 추가
function App() {
    const [input, setInput] = useState<string>(() => '텍스트');
    const [todos, setTodos] = useState<Todo[]>([]);
    const subscribe = supabase
        .channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
            console.log('Change received!', payload);
        })
        .subscribe();

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                setTodos(data);
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    const inputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
    };

    const addTodoHandler = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        try {
            const { data, error } = await supabase
                .from('todos')
                .insert([{ text: input }])
                .select();
            setInput('');
            if (data && data.length > 0) {
                //setTodos((prev) => [...data, ...prev]);
            }
        } catch (e) {
            console.error('Error adding todo:', e);
            return;
        }
    };

    const toggleTodoHandler = async (id: string) => {
        try {
            const targetTodo = todos.find((todo) => todo.id === id);
            if (!targetTodo) return;
            const { data, error } = await supabase.from('todos').update({ completed: !targetTodo.completed }).eq('id', id).select();
        } catch (e) {
            console.error('Error toggling todo:', e);
            return;
        }
    };

    const deleteTodoHandler = async (id: string) => {
        try {
            const { data, error } = await supabase.from('todos').delete().eq('id', id).select();
            if (error) return;
        } catch (e) {
            console.error('Error deleting todo:', e);
            return;
        }
    };

    return (
        <div className='app'>
            <div className='todo-container'>
                <header className='header'>
                    <h1>✅🏃 Todo List</h1>
                    <p className='subtitle'>일정을 체계적으로 관리하세요</p>
                </header>
                <form className='input-form'>
                    <input className='todo-input' type='text' value={input} onChange={inputChangeHandler} placeholder='새로운 할 일을 입력하세요...' />
                    <button type='submit' className='add-button' onClick={addTodoHandler}>
                        추가
                    </button>
                </form>
                <div className='todo-list'>
                    {todos.length !== 0 ? (
                        todos.map((todo) => (
                            <div className={`todo-item ${todo.completed ? 'completed' : ''}`} onClick={() => toggleTodoHandler(todo.id)} key={todo.id}>
                                <input type='checkbox' className='todo-checkbox' checked={todo.completed} onChange={() => toggleTodoHandler(todo.id)} />
                                <span className={`todo-text`}>{todo.text}</span>
                                <button className='delete-button' onClick={() => deleteTodoHandler(todo.id)}>
                                    🗑️
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className='empty-state'>아직 할 일이 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
