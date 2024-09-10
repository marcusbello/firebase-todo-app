import { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')


function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const unsubscribe = supabase.onAuthStateChanged((event, session) => {
      console.log(event, session)
      if (event === 'INITIAL_SESSION') {
        // handle initial session
      } else if (event === 'SIGNED_IN') {
        const fetchTodos = fetchUserTasks(user.id)
        setTodos(fetchTodos)
      } else if (event === 'SIGNED_OUT') {
        // handle sign out event
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchUserTasks(userId) {
    const { data: tasks, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  
    return tasks;
  }

  // Replaced Firebase auth with Supabase auth
  const signIn = async () => {
    const { user } = await supabase.auth.signIn({
      provider: 'google'
    })
    setUser(user)

  }

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut()
    console.log(error)
  }

  const addTodo = async (text) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({ text, user_id: user.id });
  }
  
  const deleteTodo = async (id) => {
    const { data, error } = await supabase
      .from('todos')
      .delete()
      .match({ id });
  }

  return (
    <div className="App">
      <h1>Firebase Todo App</h1>
      {user ? (
        <>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={signOutUser}>Sign Out</button>
          <form onSubmit={addTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo"
            />
            <button type="submit">Add Todo</button>
          </form>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id}>
                {todo.text}
                <button onClick={() => deleteTodo(todo.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={signIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default App;