import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { Quiz } from "./components/Quiz";
import { BattleRoom } from "./components/BattleRoom";
import { Flashcards } from "./components/Flashcards";
import { Summary } from "./components/Summary";
import { Login } from "./components/Login";
import { Profile } from "./components/Profile";
import { Library } from "./components/Library";
import { ProtectedLayout } from "./components/ProtectedLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/dashboard",
        Component: Dashboard,
      },
      {
        path: "/library",
        Component: Library,
      },
      {
        path: "/profile",
        Component: Profile,
      },
      {
        path: "/quiz/:collectionId",
        Component: Quiz,
      },
      {
        path: "/battle/:collectionId",
        Component: BattleRoom,
      },
      {
        path: "/flashcards/:collectionId",
        Component: Flashcards,
      },
      {
        path: "/summary",
        Component: Summary,
      },
    ],
  },
]);
