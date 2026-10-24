
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  async function loginAs(email) {
    try {
      setError("");
      await login(email, "password");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response
          ? `Login failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`
          : `Login failed: ${err.message}`
      );
    }
  }

  return (
    <div className="login">
      <h1>Threadbase Live Chat</h1>
      <p>
        Log in as one user here, then open a second browser window
        and log in as the other. Chat between them.
      </p>

      <div className="login-buttons">
        <button onClick={() => loginAs("ada@threadbase.dev")}>
          Log in as Ada
        </button>
        <button onClick={() => loginAs("linus@threadbase.dev")}>
          Log in as Linus
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
