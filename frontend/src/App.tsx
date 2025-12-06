import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/test")
      .then((r) => r.json())
      .then((d) => setMsg(d.message));
  }, []);

  return <div>{msg}</div>;
}

export default App;
