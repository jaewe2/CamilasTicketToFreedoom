// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Walker from "../components/Walker";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../App.css";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
  });

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const uc = await signInWithEmailAndPassword(auth, values.email, values.password);
      const token = await uc.user.getIdToken(true);
      localStorage.setItem("token", token);
      const resp = await fetch("http://127.0.0.1:8000/api/verify-token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await resp.json();
      if (resp.ok) {
        localStorage.setItem("user_id", data.uid || data.id);
        localStorage.setItem("user_email", data.email);
        navigate("/");
      } else {
        console.error("Token rejected:", data.error);
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const walkerCount = 3;
  const totalWidth = 8;
  const maxAmplitude = totalWidth / (2 * walkerCount);
  const walkers = Array.from({ length: walkerCount }, (_, i) => {
    const initialX = -totalWidth / 2 + (i * (totalWidth / (walkerCount - 1)));
    return { initialX, amplitude: maxAmplitude, speed: 0.8 + i * 0.2, scale: 0.8 };
  });

  const roles = ["student", "faculty", "connectee"];

  return (
    <div id="bg">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {walkers.map((props, idx) => (
          <Walker key={idx} {...props} role={roles[idx]} />
        ))}
      </Canvas>

      <div className="login-card">
        <h2 className="login-title">Student Connect Login</h2>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                className="login-input"
                type="email"
                name="email"
                placeholder="Email"
              />
              <ErrorMessage name="email" component="div" className="login-error" />

              <div className="password-wrapper">
                <Field
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
              <ErrorMessage name="password" component="div" className="login-error" />

              <button className="login-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>

              <p className="login-link">
                Need an account? <Link to="/register">Register here</Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
