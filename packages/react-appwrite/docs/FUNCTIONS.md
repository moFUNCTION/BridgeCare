# Serverless Cloud Functions Module

The Functions module simplifies executing Appwrite Cloud Functions, handling custom payloads, parsing response bodies, and tracking execution metrics.

---

## `useAppwriteFunction<TData>(functionId, defaultOptions)`

Hook for triggering serverless function executions.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `async` | `boolean` | `false` | When `true`, function executes in background asynchronously without waiting for completion. |
| `xpath` | `string` | `"/"` | Custom execution routing path (e.g. `/api/charge`). |
| `method` | `string` | `"POST"` | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.). |
| `headers` | `Record<string, string>` | `undefined` | Custom request headers. |
| `onSuccess` | `(execution: Models.Execution) => void` | `undefined` | Execution success callback. |
| `onError` | `(error: Error) => void` | `undefined` | Error callback. |

### Returns

```ts
interface UseAppwriteFunctionReturn<TData> {
  execute: (body?: string | Record<string, any>, overrideOptions?: UseFunctionOptions) => Promise<TData>;
  execution: Models.Execution | null;
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
  responseStatusCode: number | null;
  duration: number | null;
}
```

### Example

```tsx
import React, { useState } from "react";
import { useAppwriteFunction } from "@repo/react-appwrite";

interface StripeCheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
}

export function CheckoutButton({ cartItems }: { cartItems: any[] }) {
  const { execute, isLoading, data, error, responseStatusCode, duration } =
    useAppwriteFunction<StripeCheckoutResponse>("create-checkout-session", {
      method: "POST",
      xpath: "/checkout",
    });

  const handleCheckout = async () => {
    try {
      const response = await execute({ items: cartItems, currency: "usd" });
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err) {
      console.error("Checkout execution failed", err);
    }
  };

  return (
    <div>
      <button onClick={handleCheckout} disabled={isLoading}>
        {isLoading ? "Preparing Checkout..." : "Proceed to Checkout"}
      </button>

      {duration && <small>Executed in {duration}ms (Status: {responseStatusCode})</small>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```
