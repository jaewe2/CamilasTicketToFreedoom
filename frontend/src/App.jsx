// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import EventDetails from './components/EventDetails';
import EditEventForm from "./components/EditEventForm";
import AISummarizer from './pages/AISummarizer';
import AssessmentReminders from './pages/AssessmentReminders';
import Login from "./Auth/Login";
import Register from "./Auth/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import PostAdPage from "./pages/PostAdPage";
import MyAdsPage from "./pages/MyAdsPage";
import MyMessages from "./MyMessages";
import Inbox from "./pages/Inbox";
import SettingsPage from "./pages/SettingsPage";
import Profile from "./pages/Profile";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmation from "./OrderConfirmation";
import StripeSuccessPage from "./StripeSuccessPage";
import PrivateRoute from "./PrivateRoute";
import Navbar from "./Navbar";
import Notifications from "./components/Notifications";
import Community from './pages/Community';
import Events from './pages/Events';
import Features from './pages/Features';
import Resources from './pages/Resources';
import Home from './pages/Home';
import AddEventForm from "./components/AddEventForm";
import ListingsPage from "./Listings/ListingsPage";
import ListingDetail from "./Listings/ListingDetail";
import EditListing from "./Listings/EditListing";
import Favorites from "./Listings/Favorites";
import SalesPage from "./pages/SalesPage";
import OrdersPage from "./pages/OrdersPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Chat from './pages/Chat';

const stripePromise = loadStripe("pk_test_YourPublishableKeyHere");

export default function App() {
  const token = localStorage.getItem('token'); // or from context
  const currentUser = localStorage.getItem('username'); 
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Navbar />
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listing-detail/:id" element={<ListingDetail />} />
          <Route path="/order-confirmation/success" element={<StripeSuccessPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/ai-summarizer" element={<AISummarizer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/events" element={<Events />} />
          <Route path="/features" element={<Features />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/reminders" element={<AssessmentReminders />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/messages" element={<MyMessages />} />
          <Route path="/inbox" element={<PrivateRoute><Inbox /></PrivateRoute>} />
          <Route path="/chat" element={<Chat token={token} currentUser={currentUser} />} />
          <Route path="/chat/:recipient" element={<Chat token={token} currentUser={currentUser} />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <PrivateRoute>
                <AddEventForm />
              </PrivateRoute>
            }
          />
          <Route path="/events/:id" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
          <Route path="/events/:id/edit" element={<PrivateRoute><EditEventForm /></PrivateRoute>} />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <SalesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersPage />
              </PrivateRoute>
            }
          />
          <Route path="/post" element={<PrivateRoute><PostAdPage /></PrivateRoute>} />
          <Route path="/my-ads" element={<PrivateRoute><MyAdsPage /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><MyMessages /></PrivateRoute>} />
          <Route path="/inbox" element={<PrivateRoute><Inbox /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/edit-listing/:id" element={<PrivateRoute><EditListing /></PrivateRoute>} />
          <Route path="/checkout/:id" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/order-confirmation/:id" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
          <Route path="*" element={<ListingsPage />} />
        </Routes>
      </Router>
    </Elements>
  );
}
