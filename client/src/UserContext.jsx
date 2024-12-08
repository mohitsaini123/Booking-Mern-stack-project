import React, { useEffect, useState, createContext } from "react";
import axios from "axios";
export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // const fetchProfile = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       throw new Error("No token available");
  //     }
  //     if (!user) {
  //       const response = await axios.get("/profile", {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       const { data } = response;
  //       setUser(data);
  //       setReady(true);
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch user profile:", error.message);
  //   }
  // };

  // useEffect(() => {
  //   fetchProfile();
  // }, []);
  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
