// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Walker from "../components/Walker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  const RegisterSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
    confirmPassword: Yup.string()
      .required("Required")
      .oneOf([Yup.ref("password"), null], "Passwords must match"),
  });

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const { email, password } = values;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // user is already signed in at this point
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      const response = await fetch("http://127.0.0.1:8000/api/verify-token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user_id", data.uid || data.id);
        localStorage.setItem("user_email", data.email);
        navigate("/");
      } else {
        console.error("Token rejected:", data.error);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // walker layout
  const walkerCount = 3;
  const totalWidth = 8;
  const maxAmplitude = totalWidth / (2 * walkerCount);
  const walkers = Array.from({ length: walkerCount }, (_, i) => {
    const initialX = -totalWidth / 2 + i * (totalWidth / (walkerCount - 1));
    return {
      initialX,
      amplitude: maxAmplitude,
      speed: 0.8 + i * 0.2,
      scale: 0.8,
    };
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

      <div className="register-card">
        <h2 className="register-title">Student Connect Register</h2>
        <Formik
          initialValues={{
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                className="register-input"
                type="email"
                name="email"
                placeholder="Email"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="register-error"
              />

              <div className="register-password-group">
                <Field
                  className="register-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                />
                <span
                  className="register-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="register-error"
              />

              <div className="register-password-group">
                <Field
                  className="register-input"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                />
                <span
                  className="register-toggle"
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </span>
              </div>
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="register-error"
              />

              <button
                className="register-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>

              <p className="register-link">
                Already have an account? <Link to="/login">Log in here</Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
