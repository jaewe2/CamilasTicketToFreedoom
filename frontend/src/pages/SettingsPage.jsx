// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { auth, signInWithEmailAndPassword } from "../firebase";
import { updatePassword, updateEmail } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import "./SettingsPage.css";

export default function AccountSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [displayAsCompany, setDisplayAsCompany] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Security state
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Avatar state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email);
      setNewEmail(user.email);

      (async () => {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/user/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setCompanyName(data.company_name || "");
          setDisplayAsCompany(data.display_as_company || false);
          setPhoneNumber(data.phone_number || "");
          if (data.profile_picture) setPreviewUrl(data.profile_picture);
        } catch {
          toast.error("Could not load profile info.");
        }
      })();
    }
  }, []);

  const handleEmailUpdate = async () => {
    try {
      await updateEmail(auth.currentUser, newEmail);
      setEmail(newEmail);
      toast.success("Email updated!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const user = auth.currentUser;
      await signInWithEmailAndPassword(auth, user.email, currentPassword);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated!");
    } catch {
      toast.error("Current password is incorrect or update failed.");
    }
  };

  // Route-based highlights
  const isAnalyticsActive = location.pathname === "/analytics";
  const isSalesActive = location.pathname === "/sales";

  return (
    <div class="settings container" style={styles.container}>
      <h1 class="heading" style={styles.heading}>Account settings</h1>
      <div class="content">
        
      <div class="tabsRow" style={styles.tabsRow}>
        <div
          onClick={() => setActiveTab("profile")}
          class={activeTab==="profile" ? "active" : ""}
          style={{
            ...styles.tab,
            ...(activeTab === "profile" && !isAnalyticsActive && !isSalesActive
              ? styles.activeTab
              : {}),
          }}
        >
          Profile
        </div>

        <div
          onClick={() => setActiveTab("security")}
          class={activeTab==="security" ? "active" : ""}
          style={{
            ...styles.tab,
            ...(activeTab === "security" && !isAnalyticsActive && !isSalesActive
              ? styles.activeTab
              : {}),
          }}
        >
          Security
        </div>

        <div
          onClick={() => navigate("/analytics")}
          style={{
            ...styles.tab,
            ...(isAnalyticsActive ? styles.activeTab : {}),
          }}
        >
          Analytics
        </div>

        <div
          onClick={() => navigate("/sales")}
          style={{
            ...styles.tab,
            ...(isSalesActive ? styles.activeTab : {}),
          }}
        >
          Sales
        </div>
      </div>

      {/* Profile Form */}
      {activeTab === "profile" && !isAnalyticsActive && !isSalesActive && (
        <div class="profileTab" style={styles.profileTab}>
          <div class="profileGrid" style={styles.profileGrid}>
            <div class="leftColumn" style={styles.leftColumn}>
              <label class="label" style={styles.label}>First Name*</label>
              <input
                class="input" style={styles.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <label class="label" style={styles.label}>Last Name*</label>
              <input
                class="input" style={styles.input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <label class="label" style={styles.label}>Company</label>
              <input
                class="input" style={styles.input}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <div class="checkboxRow" style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={displayAsCompany}
                  onChange={(e) =>
                    setDisplayAsCompany(e.target.checked)
                  }
                />
                <label style={{ marginLeft: 8 }}>
                  Display as a company?
                </label>
              </div>

              <label class="label" style={styles.label}>Phone number</label>
              <input
                class="input" style={styles.input}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />

              <button class="updateBtn" style={styles.updateBtn}>
                Update Profile
              </button>
            </div>
            <div class="rightColumn" style={styles.rightColumn}>
              <div class="avatarWrapper" style={styles.avatarWrapper}>
                <img
                  src={previewUrl || "https://via.placeholder.com/100"}
                  alt="Profile"
                  class="avatar" style={styles.avatar}
                />
                <label htmlFor="avatarUpload" class="pencilOverlay" style={styles.pencilOverlay}>
                  ✎
                </label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfileImage(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Form */}
      {activeTab === "security" && !isAnalyticsActive && !isSalesActive && (
        <div class="securityTab" style={styles.securityTab}>
          <div class="formField" style={styles.formField}>
            <label class="label" style={styles.label}>Change Email</label>
            <input
              type="email"
              class="input" style={styles.input}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button class="saveBtn} onClick={handleEmailUpdate" style={styles.saveBtn} onClick={handleEmailUpdate}>
              Save Email
            </button>
          </div>

          <div class="formField" style={styles.formField}>
            <label class="label" style={styles.label}>Current Password</label>
            <input
              type="password"
              class="input" style={styles.input}
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
            />
          </div>

          <div class="formField" style={styles.formField}>
            <label class="label" style={styles.label}>New Password</label>
            <input
              type="password"
              class="input" style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              class="saveBtn" style={styles.saveBtn}
              onClick={handlePasswordUpdate}
            >
              Save Password
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "2rem",
    fontFamily: "Segoe UI, sans-serif",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
  },
  tabsRow: {
    display: "flex",
    borderBottom: "1px solid #e2e2e2",
    marginBottom: "1.5rem",
  },
  tab: {
    padding: "0.75rem 1.25rem",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    color: "#666",
    marginRight: "1rem",
  },
  activeTab: {
    borderBottom: "3px solid #22c55e",
    color: "#111",
    fontWeight: "600",
  },
  profileGrid: {
    display: "flex",
    gap: "2rem",
  },
  leftColumn: { flex: 2 },
  rightColumn: { flex: 1, textAlign: "center" },
  avatarWrapper: { position: "relative", display: "inline-block" },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "9999px",
    objectFit: "cover",
    border: "2px solid #ddd",
  },
  pencilOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    background: "#fff",
    borderRadius: "9999px",
    padding: "4px 6px",
    fontSize: "0.8rem",
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  label: { display: "block", marginBottom: "0.25rem", fontWeight: 500 },
  input: {
    width: "100%",
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  checkboxRow: { display: "flex", alignItems: "center", marginBottom: "1rem" },
  updateBtn: {
    backgroundColor: "#22c55e",
    color: "white",
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  saveBtn: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "none",
    marginTop: "0.5rem",
    cursor: "pointer",
  },
  formField: { marginBottom: "2rem" },
  securityTab: { maxWidth: "500px" },
};
