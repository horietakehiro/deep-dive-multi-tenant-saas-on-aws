import { render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
import type { Tenant } from "@intersection/backend/lib/domain/model/data";

import Appointments, { type Context } from "../appointments";
const mockUseOutletContext = vi.hoisted(() => {
  return vi.fn<() => Context>(() => {
    throw NotImplementedError;
  });
});
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext: mockUseOutletContext,
  };
});

describe("予約画面", () => {
  test("hello", async () => {
    // mockUseOutletContext.mockReturnValue({
    //   tenant: {
    //     id: "id",
    //   } as Tenant,
    // });
    // const Stub = createRoutesStub([
    //   {
    //     path: "/appointments",
    //     Component: () => {
    //       return <Appointments />;
    //     },
    //   },
    // ]);
    // render(<Stub initialEntries={["/appointments"]} />);
    // await waitFor(() => screen.findByAltText("AGENDA"));
  });
});
