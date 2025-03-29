import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

const Counter = ({ initialCount = 0 }: CounterProps): React.ReactElement => {
  const [count, setCount] = useState<number>(initialCount);

  return (
    <section>
      <h2>Counter Component</h2>
      <p>Current count: {count}</p>
      <div>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <button onClick={() => setCount(initialCount)}>Reset</button>
      </div>
    </section>
  );
};

const App = (): React.ReactElement => {
  return (
    <div>
      <header>
        <h1>D12 Simulator</h1>
      </header>
      <main>
        <h3>Welcome to the D12 System Simulator</h3>
        <p>
          This is a basic boilerplate for a React application built with Vite, TypeScript, and Bun.
        </p>
        <Counter initialCount={5} />
      </main>
      <footer>
        <p>&copy; 2025 - D12 Simulator - Luan Nico</p>
      </footer>
    </div>
  );
};

export default App;
