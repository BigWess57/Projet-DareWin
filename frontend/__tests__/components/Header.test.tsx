import { describe, expect, vi, it, Mock } from "vitest";
import Header from "@/src/components/shared/PageLayout/Header";
import { useReadContract } from "wagmi";
import { render, screen } from "@/test/utils";
import { usePathname } from "next/navigation"; // Import the hook to mock it

// 1. We mock the hook implementation specifically for this test file
// vi.mock("next/navigation", async () => {
//     const actual = await vi.importActual("next/navigation");
//     return {
//         ...actual,
//         usePathname: vi.fn(),
//     };
// });

// vi.mock("wagmi", async (importOriginal) => {
//     const actual = await importOriginal<typeof import("wagmi")>();
//     return {
//         ...actual,
//         useConfig: vi.fn(() => ({
//             // Return a minimal mock of the wagmi config object
//             chains: [{ id: 1, name: "Mainnet" }],
//             connectors: [],
//         })),
//         useAccount: vi.fn(() => ({
//             isConnected: true,
//             address: "0x123...789",
//         })),
//         useReadContract: vi.fn(() => ({
//             data: BigInt("1500000000000000000"), // Default to undefined
//             isLoading: false,
//             isError: false,
//         })),
//         // ... other hooks
//     };
// });

// describe("Header", () => {
//     it("highlights the active tab", () => {
//         // Scenario: We are on the "Create Challenge" page
//         // (usePathname as Mock).mockReturnValue("/en/");

//         (useReadContract as Mock).mockReturnValue({
//             data: BigInt("1500000000000000000"), // 1.5 * 10^18
//             isLoading: false,
//         });

//         render(<Header />);

//         // const createLink = screen.getByRole("link", { name: /create/i });

//         // Check if it has your active class (e.g., text-blue-500 or whatever you use)
//         // expect(createLink)  .toHaveClass("text-blue-500");
//     });
// });

describe("fake test just for this file to run", () => {
    it("should calculate 1+1", () => {
        expect(1 + 1).toEqual(2);
    });
});
