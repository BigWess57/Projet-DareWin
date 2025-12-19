import { describe, it, expect, test } from "vitest";
import { render, screen } from "../../test/utils";
import Home from "@/src/components/shared/RouteBaseElements/HomePage";

// test("Pages Router", () => {
//     render(<Home />);

//     // It will have translations + query client + fake wagmi connection
//     // expect(screen.getByRole("heading")).toBeDefined();
// });

describe("Home Page", () => {
    it("should render correctly", () => {
        render(<Home />);

        // screen.debug();
    });
});
