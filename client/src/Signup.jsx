import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State variable for error message
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check password length
    if (password.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }

    axios
      .post("http://localhost:3001/register", { name, email, password })
      .then((res) => {
        navigate("/");
      })
      .catch((err) => {
        if (err.response && err.response.data.error === "Email already registered") {
          setError("Email already registered"); // Set error message
        } else {
          console.error("Error registering user:", err);
        }
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2>Register</h2>
        {error && ( // Display error message if present
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name">
              <strong>Name</strong>
            </label>
            <input
              type="text"
              placeholder="Enter Name"
              autoComplete="off"
              name="name"
              className="form-control rounded-0"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email">
              <strong>E-mail</strong>
            </label>
            <input
              type="email"
              placeholder="Enter Email"
              autoComplete="off"
              name="email"
              className="form-control rounded-0"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">
              <strong>Password</strong>
            </label>
            <div className="input-group">
              <input
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Enter Password"
                autoComplete="off"
                name="password"
                className="form-control rounded-0"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <i className={`bi ${isPasswordVisible ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-success w-100 rounded-0">
            Register
          </button>
          <p>Already have an account?</p>
          <Link to="/" className="btn btn-light w-100 rounded-0">
            Login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Signup;
