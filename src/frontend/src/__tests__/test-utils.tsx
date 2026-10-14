import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { setActorForTest } from "./setup";

/**
 * Renders `ui` with a React Query provider and installs `actor` as the mocked
 * platform actor. The actor is typed structurally so tests can pass the app's
 * own `@/types`-shaped mocks (the surface the hooks actually consume) without
 * being forced into the generated enum-based `backendInterface` shapes.
 */
export function renderWithActor<A extends object>(ui: ReactElement, actor: A) {
  setActorForTest(actor);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
    queryClient,
  };
}
