import { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')


function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const loginEvent = async () => {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(event, session);
        
        if (event === 'INITIAL_SESSION') {
          // handle initial session if needed
          setUser(null);
          setTodos([]);
        } else if (event === 'SIGNED_IN') {
          setUser(session.user);
          const fetchTodos = await fetchUserTasks(session.user.id); // use session.user.id
          setTodos(fetchTodos);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setTodos([]);
        }
      });
  
      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    loginEvent();

    const checkSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();

      if (sessionData?.session) {
        setUser(sessionData.session.user);
        const fetchTodos = await fetchUserTasks(sessionData.session.user.id)
        setTodos(fetchTodos)
      } else if (error) {
        console.error('Error fetching session:', error.message);
      }
    };

    checkSession();
    
  }, []);
  

  async function fetchUserTasks(userId) {
    const { data: tasks, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  
    return tasks;
  }

  // Replaced Firebase auth with Supabase auth
  const signIn = async () => {
    const { user } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
    setUser(user)
  }

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut()
    console.log(error)
  }

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;
    const { data, error } = await supabase
      .from('todos')
      .insert({ title:newTodo, user_id: user.id,  completed: false});

    if (error) {
      console.error(error.message)
    } else {
      console.log(data)
      // After adding a new todo, refetch all todos
      const { data: todos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching todos:', fetchError.message);
      } else {
        setTodos(todos); // Update the todos state with the latest data
      }

      setNewTodo('');
    }
  }
  
  const deleteTodo = async (id) => {
    const { data, error } = await supabase
      .from('todos')
      .delete()
      .match({ id });

      if (error) {
        console.error(error.message)
      } else {
        console.log(data)
        // After adding a new todo, refetch all todos
        const { data: todos, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);
  
        if (fetchError) {
          console.error('Error fetching todos:', fetchError.message);
        } else {
          setTodos(todos); // Update the todos state with the latest data
        }
      }
  }

  return (
    <div className="App">
      <h1>Supabase Todo App</h1>
      {user ? (
        <>
          <p>Welcome, {user.user_metadata.full_name || ''}!</p>
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
                {todo.title}
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