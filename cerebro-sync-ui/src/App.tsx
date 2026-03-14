import { useEffect } from "react";
import API_BASE from "./api";
import { AppRouter } from "./router/AppRouter"

function App() {
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return (
    <AppRouter />
  )
}

export default App
