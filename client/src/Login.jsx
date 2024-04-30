import React, { useState} from 'react';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Login = ({setIsLoggedIn}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post("http://localhost:3001/", {
        email,
        password,
      });
    
      if (data.status === "success") {
        localStorage.setItem('name', data.name);
        setIsLoggedIn(true);
        navigate('/home');
      } 
      
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setLoginError("Incorrect password. Please try again.");
      } else if (err.response && err.response.status === 403) {
        setLoginError("Your account is locked due to multiple failed login attempts. Please try again later.");
      }
      else if(err.response && err.response.status === 404){
        setLoginError("Email not found. Please check your email and try again.");
      } 
      else {
        setLoginError("An unexpected error occurred. Please try again later.");
        console.error("Error logging in:", err);
      }
    }
    
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-info vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2>Login</h2>
        {loginError && ( // Display login error message
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email"><strong>E-mail</strong></label>
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
            <label htmlFor="email"><strong>Password</strong></label>
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
                <i className={`bi ${isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-success w-100 rounded-0">Login</button>
          <p>Don't have an account</p>
          <Link to='/register' className="btn btn-light w-100 rounded-0">Register</Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
