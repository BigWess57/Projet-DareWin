// Setup
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// 1. Mock Next.js Navigation (Router)
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => "/en",
    useParams: () => ({ locale: "en" }),
}));

// 2. Mock Wagmi (Blockchain)
// This prevents you from needing the real RainbowKitAndWagmiProvider in unit tests
vi.mock("wagmi", async (importOriginal) => {
    const actual = await importOriginal<typeof import("wagmi")>();
    return {
        ...actual,
        useConfig: vi.fn(() => ({
            // Return a minimal mock of the wagmi config object
            chains: [{ id: 1, name: "Mainnet" }],
            connectors: [],
        })),
        useAccount: vi.fn(() => ({
            isConnected: true,
            address: "0x123...789",
        })),
        useConnect: vi.fn(() => ({ connect: vi.fn() })),
        useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
        useBalance: vi.fn(() => ({
            data: BigInt("1500000000000000000"),
            isLoading: false,
        })),
        useWriteContract: vi.fn(() => ({ writeContract: vi.fn() })),
        useWaitForTransactionReceipt: vi.fn(() => ({
            isLoading: false,
            isSuccess: true,
            error: null,
        })),
        useReadContract: vi.fn(() => ({ refetch: vi.fn() })),
        // Add other hooks you use frequently here
    };
});

// 3. Mock window.matchMedia (Required by many UI libraries like RainbowKit/Chakra/Mantine)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
