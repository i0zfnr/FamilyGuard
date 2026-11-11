import { createClient, type User } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const enrollmentEnabled =
  Deno.env.get("XENNGUARD_ENROLLMENT_ENABLED") !== "false";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ApiError(422, message);
  }
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return hex(new Uint8Array(digest));
}

function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return hex(bytes);
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("Invalid JSON object");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Invalid JSON request.");
  }
}

async function authenticatedUser(request: Request): Promise<User> {
  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    throw new ApiError(401, "Unauthenticated.");
  }

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new ApiError(401, "Unauthenticated.");
  }
  return data.user;
}

function publicDevice(row: Record<string, unknown>): Record<string, unknown> {
  const { public_key: _publicKey, ...safe } = row;
  return safe;
}

async function recordAudit(
  eventType: string,
  userId: string | null,
  deviceId: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await admin.from("audit_logs").insert({
    event_type: eventType,
    user_id: userId,
    device_id: deviceId,
    payload,
  });
  if (error) {
    console.error("Audit event insert failed:", error.code);
  }
}

async function deviceForToken(
  request: Request,
): Promise<Record<string, unknown>> {
  const token = request.headers.get("Authorization")?.match(
    /^Bearer\s+([0-9a-f]{64})$/i,
  )?.[1];
  if (!token) {
    throw new ApiError(401, "Unauthorized.");
  }

  const { data: credential, error } = await admin
    .from("device_tokens")
    .select("id, device_id, expires_at, revoked_at")
    .eq("token_hash", await sha256(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !credential) {
    throw new ApiError(401, "Unauthorized.");
  }

  const { data: device } = await admin
    .from("devices")
    .select("id, owner_id, device_name, enrollment_status")
    .eq("id", credential.device_id)
    .eq("enrollment_status", "active")
    .maybeSingle();

  if (!device) {
    throw new ApiError(401, "Unauthorized.");
  }
  return device;
}

async function verifyDeviceSignature(
  publicKeyPem: string,
  message: string,
  signatureBase64: string,
): Promise<boolean> {
  const encodedKey = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(
    atob(encodedKey),
    (character) => character.charCodeAt(0),
  );
  const signatureBytes = Uint8Array.from(
    atob(signatureBase64),
    (character) => character.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "spki",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const keyLength = (key.algorithm as RsaHashedKeyAlgorithm).modulusLength;
  if (keyLength < 2048 || keyLength > 4096) {
    return false;
  }
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signatureBytes,
    new TextEncoder().encode(message),
  );
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const route = segments.slice(3).join("/");
  if (route === "api/v1/health" && request.method === "GET") {
    const { error } = await admin.from("profiles").select("id").limit(1);
    if (error) {
      throw new ApiError(503, "XennGuard data service is not ready.");
    }
    return json({ status: "ok" });
  }

  if (route === "api/v1/auth/me" && request.method === "GET") {
    const user = await authenticatedUser(request);
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, name, role, mfa_enabled, created_at")
      .eq("id", user.id)
      .single();
    if (error || !profile) {
      throw new ApiError(503, "Your profile is not ready. Try again later.");
    }
    return json({ user: { ...profile, email: user.email } });
  }

  if (route === "api/v1/devices" && request.method === "GET") {
    const user = await authenticatedUser(request);
    const { data, error } = await admin
      .from("devices")
      .select(
        "id, owner_id, device_name, platform, manufacturer, model, os_version, agent_version, enrollment_status, last_seen_at, created_at, updated_at",
      )
      .eq("owner_id", user.id)
      .order("device_name");
    if (error) {
      throw new ApiError(503, "Could not load devices.");
    }
    return json({
      data: data ?? [],
      current_page: 1,
      last_page: 1,
      total: data?.length ?? 0,
      per_page: 100,
    });
  }

  const deviceMatch = route.match(/^api\/v1\/devices\/([0-9a-f-]+)$/i);
  if (deviceMatch && request.method === "GET") {
    const user = await authenticatedUser(request);
    const { data, error } = await admin
      .from("devices")
      .select(
        "id, owner_id, device_name, platform, manufacturer, model, os_version, agent_version, enrollment_status, last_seen_at, created_at, updated_at",
      )
      .eq("id", deviceMatch[1])
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) {
      throw new ApiError(503, "Could not load this device.");
    }
    if (!data) {
      throw new ApiError(404, "Device not found.");
    }
    return json({ device: data });
  }

  const telemetryMatch = route.match(
    /^api\/v1\/devices\/([0-9a-f-]+)\/telemetry$/i,
  );
  if (telemetryMatch && request.method === "GET") {
    const user = await authenticatedUser(request);
    const deviceId = telemetryMatch[1];
    const { data: device } = await admin
      .from("devices")
      .select("id")
      .eq("id", deviceId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!device) {
      throw new ApiError(404, "Device not found.");
    }
    const { data, error } = await admin
      .from("device_telemetry")
      .select(
        "id, device_id, battery_percentage, charging, storage_total, storage_available, network_type, recorded_at",
      )
      .eq("device_id", deviceId)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100);
    if (error) {
      throw new ApiError(503, "Could not load device activity.");
    }
    return json({
      data: data ?? [],
      current_page: 1,
      last_page: 1,
      total: data?.length ?? 0,
      per_page: 100,
    });
  }

  const revokeMatch = route.match(/^api\/v1\/devices\/([0-9a-f-]+)\/revoke$/i);
  if (revokeMatch && request.method === "POST") {
    const user = await authenticatedUser(request);
    const { data, error } = await admin.rpc("revoke_owned_device", {
      target_device_id: revokeMatch[1],
      requesting_user_id: user.id,
    });
    if (error) {
      throw new ApiError(503, "Could not revoke device access.");
    }
    if (!data) {
      throw new ApiError(404, "Device not found.");
    }
    await recordAudit("device.revoked", user.id, revokeMatch[1]);
    return json({ message: "Device access revoked." });
  }

  if (
    route === "api/v1/devices/enrollment-challenges" &&
    request.method === "POST"
  ) {
    const user = await authenticatedUser(request);
    const token = randomHex(32);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("enrollment_challenges")
      .insert({
        user_id: user.id,
        token_hash: await sha256(token),
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();
    if (error || !data) {
      throw new ApiError(503, "Could not create a device setup code.");
    }
    await recordAudit("challenge.issued", user.id, null, {
      challenge_id: data.id,
      expires_at: data.expires_at,
    });
    return json(
      { ...data, token, enrollment_available: enrollmentEnabled },
      201,
    );
  }

  const challengeMatch = route.match(
    /^api\/v1\/devices\/enrollment-challenges\/([0-9a-f-]+)$/i,
  );
  if (challengeMatch && request.method === "DELETE") {
    const user = await authenticatedUser(request);
    const { data, error } = await admin
      .from("enrollment_challenges")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", challengeMatch[1])
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new ApiError(503, "Could not cancel the device setup code.");
    }
    if (data) {
      await recordAudit("challenge.revoked", user.id, null, {
        challenge_id: data.id,
      });
    }
    return json({ message: "Challenge revoked." });
  }

  if (route === "api/v1/devices/enroll" && request.method === "POST") {
    if (!enrollmentEnabled) {
      throw new ApiError(503, "Device enrollment is not available.");
    }
    const input = await body(request);
    const challengeId = typeof input.challenge_id === "string"
      ? input.challenge_id
      : "";
    const challengeToken = typeof input.challenge_token === "string"
      ? input.challenge_token
      : "";
    const deviceName = typeof input.device_name === "string"
      ? input.device_name.trim()
      : "";
    const platform = typeof input.platform === "string" ? input.platform : "";
    const publicKey = typeof input.public_key === "string"
      ? input.public_key
      : "";
    const signature = typeof input.signature === "string"
      ? input.signature
      : "";
    requireValue(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(challengeId),
      "Invalid enrollment request.",
    );
    requireValue(
      /^[0-9a-f]{64}$/i.test(challengeToken),
      "Invalid enrollment request.",
    );
    requireValue(
      deviceName.length > 0 && deviceName.length <= 100,
      "Invalid enrollment request.",
    );
    requireValue(
      platform === "android" || platform === "windows",
      "Invalid enrollment request.",
    );
    requireValue(
      publicKey.length <= 8192 && signature.length <= 8192,
      "Invalid enrollment request.",
    );
    requireValue(
      input.owner_approved === true || input.enrollment_approved === true,
      "Device owner approval is required.",
    );

    let signatureValid = false;
    try {
      signatureValid = await verifyDeviceSignature(
        publicKey,
        `${challengeId}:${challengeToken}`,
        signature,
      );
    } catch {
      signatureValid = false;
    }
    requireValue(signatureValid, "Invalid enrollment request.");

    const deviceToken = randomHex(32);
    const { data, error } = await admin.rpc("claim_device_enrollment", {
      challenge_id: challengeId,
      challenge_token_hash: await sha256(challengeToken),
      new_device_name: deviceName,
      new_platform: platform,
      new_public_key: publicKey,
      new_device_token_hash: await sha256(deviceToken),
    });
    if (error) {
      throw new ApiError(503, "Could not complete device setup.");
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.device_id) {
      throw new ApiError(422, "Invalid or expired device setup code.");
    }
    await recordAudit("device.enrolled", result.owner_id, result.device_id, {
      device_name: deviceName,
      platform,
      challenge_id: challengeId,
    });
    return json({
      device_id: result.device_id,
      device_token: deviceToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, 201);
  }

  if (route === "api/v1/agent/heartbeat" && request.method === "POST") {
    const device = await deviceForToken(request);
    const now = new Date().toISOString();
    const { error } = await admin.from("devices").update({ last_seen_at: now })
      .eq("id", device.id);
    if (error) {
      throw new ApiError(503, "Could not record device status.");
    }
    await recordAudit(
      "heartbeat.received",
      String(device.owner_id),
      String(device.id),
    );
    return json({ status: "acknowledged", server_time: now });
  }

  if (route === "api/v1/agent/telemetry" && request.method === "POST") {
    const device = await deviceForToken(request);
    const input = await body(request);
    const telemetry: Record<string, unknown> = {
      device_id: device.id,
      recorded_at: new Date().toISOString(),
    };
    for (
      const key of [
        "battery_percentage",
        "charging",
        "storage_total",
        "storage_available",
        "network_type",
      ]
    ) {
      if (key in input) {
        telemetry[key] = input[key];
      }
    }
    const battery = telemetry.battery_percentage;
    const charging = telemetry.charging;
    const storageTotal = telemetry.storage_total;
    const storageAvailable = telemetry.storage_available;
    const networkType = telemetry.network_type;
    requireValue(
      battery === undefined || battery === null ||
        (Number.isInteger(battery) && Number(battery) >= 0 &&
          Number(battery) <= 100),
      "Invalid battery percentage.",
    );
    requireValue(
      charging === undefined || charging === null ||
        typeof charging === "boolean",
      "Invalid charging status.",
    );
    requireValue(
      storageTotal === undefined || storageTotal === null ||
        (Number.isSafeInteger(storageTotal) && Number(storageTotal) >= 0),
      "Invalid total storage.",
    );
    requireValue(
      storageAvailable === undefined || storageAvailable === null ||
        (Number.isSafeInteger(storageAvailable) &&
          Number(storageAvailable) >= 0),
      "Invalid available storage.",
    );
    requireValue(
      networkType === undefined || networkType === null ||
        ["wifi", "cellular", "ethernet", "none", "other"].includes(
          String(networkType),
        ),
      "Invalid network type.",
    );
    requireValue(
      storageTotal === undefined || storageAvailable === undefined ||
        storageTotal === null || storageAvailable === null ||
        Number(storageAvailable) <= Number(storageTotal),
      "Available storage cannot exceed total storage.",
    );
    requireValue(
      Object.keys(telemetry).some((key) =>
        key !== "device_id" && key !== "recorded_at" && telemetry[key] !== null
      ),
      "At least one measurement is required.",
    );

    const { data, error } = await admin.from("device_telemetry").insert(
      telemetry,
    ).select("id, recorded_at").single();
    if (error || !data) {
      throw new ApiError(503, "Could not save device status.");
    }
    await recordAudit(
      "telemetry.ingested",
      String(device.owner_id),
      String(device.id),
      {
        telemetry_id: data.id,
        battery_percentage: battery ?? null,
        charging: charging ?? null,
        network_type: networkType ?? null,
      },
    );
    return json({ status: "ingested", ...data }, 201);
  }

  throw new ApiError(404, "Endpoint not found.");
}

Deno.serve(async (request: Request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    if (error instanceof ApiError) {
      return json({ message: error.message }, error.status);
    }
    console.error(
      "XennGuard API request failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return json({
      message: "XennGuard could not complete this request. Try again later.",
    }, 500);
  }
});
