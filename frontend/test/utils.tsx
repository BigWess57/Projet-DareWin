// src/test/utils.tsx
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import your actual messages so you don't mock them manually
import messages from "@/messages/en.json"; // Adjust path to your locale file

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Turn off retries for testing
            },
        },
    });

const AllTheProviders = ({ children }: { children: ReactNode }) => {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <NextIntlClientProvider locale="en" messages={messages}>
                {/* NOTE: We do NOT include RainbowKit/WagmiProvider here. 
            Because we mocked 'wagmi' in setup.ts, the components 
            won't ask for the real provider. This makes tests 10x faster.
         */}
                {children}
            </NextIntlClientProvider>
        </QueryClientProvider>
    );
};

// Custom render function
const customRender = (ui: ReactElement, options?: RenderOptions) =>
    render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything so you can import from this file directly
export * from "@testing-library/react";
export { customRender as render };
