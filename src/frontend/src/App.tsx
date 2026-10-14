import { Layout } from "@/components/Layout";
import { RequireAdmin } from "@/components/RequireAdmin";
import AdminBookingsPage from "@/pages/AdminBookingsPage";
import AdminRoomsPage from "@/pages/AdminRoomsPage";
import BookingPage from "@/pages/BookingPage";
import CatalogPage from "@/pages/CatalogPage";
import RoomDetailPage from "@/pages/RoomDetailPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CatalogPage,
});

const roomDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kamar/$roomId",
  component: RoomDetailPage,
});

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kamar/$roomId/pesan",
  component: BookingPage,
});

const adminRoomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/kamar",
  component: () => (
    <RequireAdmin>
      <AdminRoomsPage />
    </RequireAdmin>
  ),
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/pemesanan",
  component: () => (
    <RequireAdmin>
      <AdminBookingsPage />
    </RequireAdmin>
  ),
});

const routeTree = rootRoute.addChildren([
  catalogRoute,
  roomDetailRoute,
  bookingRoute,
  adminRoomsRoute,
  adminBookingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
