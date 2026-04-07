import React, { useState } from "react";
import {
  fetchGraphQL,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
} from "../graphql/api.js";

const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-card { animation: fadeUp 0.4s ease both; }

  .auth-input {
    width: 100%;
    padding: 11px 13px;
    background: #1a1a1a;
    border: 0.5px solid #2a2a2a;
    border-radius: 9px;
    color: #e8ddd0;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }

  .auth-input:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29,185,84,0.12);
  }

  .auth-input::placeholder { color: #3a3a3a; }
  .auth-input option { background: #1a1a1a; }

  .submit-btn {
    width: 100%;
    border: none;
    border-radius: 9px;
    padding: 13px;
    background: #1DB954;
    color: #000;
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.15s ease;
    letter-spacing: 0.01em;
  }

  .submit-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

if (!document.head.querySelector("[data-auth-styles]")) {
  styleTag.setAttribute("data-auth-styles", "");
  document.head.appendChild(styleTag);
}

export const Login = ({ onLogin }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState("LISTENER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFullName("");
    setSignupRole("LISTENER");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && signupRole === "ARTIST" && !fullName.trim()) {
      setError("Full name is required for artist accounts.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const data = await fetchGraphQL(LOGIN_MUTATION, {
          input: { email: email.trim(), password },
        });
        onLogin(data.login.token, data.login.role, data.login.email);
      } else {
        const data = await fetchGraphQL(SIGNUP_MUTATION, {
          input: {
            email: email.trim(),
            password,
            role: signupRole,
            fullName: fullName.trim() || null,
          },
        });
        onLogin(data.signup.token, data.signup.role, data.signup.email);
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: "block",
    marginBottom: 7,
    color: "#484848",
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0a0a0a",
      }}
    >
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "40px 36px",
          backgroundColor: "#121212",
          border: "0.5px solid #222",
          borderRadius: 18,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11"
                cy="11"
                r="10.25"
                stroke="#1DB954"
                strokeWidth="0.5"
              />
              <path d="M8 7.5v7l7-3.5-7-3.5z" fill="#1DB954" />
            </svg>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 24,
                color: "#e8ddd0",
                fontWeight: 400,
              }}
            >
              Music
              <span style={{ color: "#1DB954", fontStyle: "italic" }}>DB</span>
            </span>
          </div>
          <p
            style={{
              color: "#333",
              margin: 0,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {mode === "signin" ? "sign in to continue" : "create your account"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Signup-only: Full Name (first) */}
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                className="auth-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signin" ? "Your password" : "Create a password"
                }
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "#484848",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1DB954")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#484848")}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Eye OPEN — password is visible */
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* Eye CLOSED — password is hidden */
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Signup-only: Role */}
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>I am a…</label>
              <select
                className="auth-input"
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value)}
              >
                <option value="LISTENER">Listener</option>
                <option value="ARTIST">Artist</option>
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "11px 13px",
                borderRadius: 8,
                background: "rgba(224,85,85,0.08)",
                border: "0.5px solid rgba(224,85,85,0.22)",
                color: "#c97070",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* Switch mode */}
        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 11,
            color: "#333",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.06em",
          }}
        >
          {mode === "signin" ? "New here? " : "Already have one? "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              switchMode(mode === "signin" ? "signup" : "signin");
            }}
            style={{ color: "#1DB954", textDecoration: "none" }}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </a>
        </p>
      </div>
    </div>
  );
};
