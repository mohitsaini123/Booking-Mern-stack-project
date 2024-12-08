import React, { useContext, useState } from "react";

import { UserContext } from "../UserContext";
import { Link, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import PlacesPage from "./PlacesPage";
import AccountNav from "../AccountNav";
function ProfilePage() {
  const [redirect, setRedirect] = useState(null);
  const { ready, user, setUser } = useContext(UserContext);
  let { subpage } = useParams();
  if (subpage == undefined) {
    subpage = "profile";
  }

  async function logout() {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.data.success) {
      localStorage.removeItem("token");
      alert("Logged out successfully");
      setRedirect("/");
      setUser(null);
    } else {
      alert("Logout failed");
    }
  }

  if (!ready) {
    return "...Loading";
  }

  if (ready && !user && !redirect) {
    return <Navigate to={"/login"} />;
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div>
      {/* Account Navigation */}
      <AccountNav />

      {/* subpage === Profile Page */}
      {subpage === "profile" && (
        <div className="text-center  max-w-lg mx-auto">
          Logged in as {user.name} ({user.email})
          <button onClick={logout} className="primary max-w-sm mt-2 ">
            Logout
          </button>
        </div>
      )}

      {/* subpage===places */}

      {subpage === "places" && <PlacesPage />}
    </div>
  );
}

export default ProfilePage;
