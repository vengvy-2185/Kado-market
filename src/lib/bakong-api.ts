/**
 * Client for the National Bank of Cambodia's Bakong Open API
 * (official spec: https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf).
 *
 * IMPORTANT — production restriction confirmed directly from NBC/community
 * integration guides: the production check_transaction_by_md5 endpoint
 * only accepts requests from servers physically located in Cambodia.
 * Calling it from a server outside Cambodia (e.g. Vercel's default
 * regions) will be blocked. This client will work immediately against the
 * SIT/sandbox environment from anywhere; production use requires either
 * hosting this specific call on a Cambodia-based server, or routing it
 * through a relay service — see the admin Settings page for the sandbox
 * toggle.
 */

const PRODUCTION_BASE_URL = "https://api-bakong.nbc.gov.kh";
const SANDBOX_BASE_URL = "https://sit-api-bakong.nbc.gov.kh";

export type BakongTransactionResult =
  | { status: "success"; hash: string; fromAccountId: string; toAccountId: string; currency: string; amount: number; description: string | null }
  | { status: "not_found" | "failed" | "error"; message: string };

export async function checkBakongTransactionByMd5(params: {
  md5: string;
  token: string;
  useSandbox: boolean;
}): Promise<BakongTransactionResult> {
  const baseUrl = params.useSandbox ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/v1/check_transaction_by_md5`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ md5: params.md5 }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body) {
      return { status: "error", message: `Bakong API returned ${response.status}` };
    }

    if (body.responseCode === 0 && body.data) {
      return {
        status: "success",
        hash: body.data.hash,
        fromAccountId: body.data.fromAccountId,
        toAccountId: body.data.toAccountId,
        currency: body.data.currency,
        amount: Number(body.data.amount),
        description: body.data.description ?? null,
      };
    }

    // responseCode 1 with errorCode 1 = not found (not paid yet — this is
    // the *expected* result while waiting for payment, not a real error)
    if (body.errorCode === 1) {
      return { status: "not_found", message: body.responseMessage ?? "Transaction not found yet." };
    }

    return { status: "failed", message: body.responseMessage ?? "Transaction failed." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Network error contacting Bakong." };
  }
}
