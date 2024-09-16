import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "AUTH_DOMAIN",
  projectId: "PROJECT_ID",
  storageBucket: "STOREAGE_BUCKET",
  messagingSenderId: "MESSAGE_SENDER_ID",
  appId: "APP_ID"
};



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const q = query(collection(db, 'todos'), where('userId', '==', user.uid));
        onSnapshot(q, (querySnapshot) => {
          const todoList = [];
          querySnapshot.forEach((doc) => {
            todoList.push({ id: doc.id, ...doc.data() });
          });
          setTodos(todoList);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const signOutUser = () => {
    signOut(auth);
    setTodos([]);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;
    await addDoc(collection(db, 'todos'), {
      title: newTodo,
      completed: false,
      userId: user.uid,
    });
    setNewTodo('');
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'todos', id));
  };

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