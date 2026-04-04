"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const OPS_URL =
  process.env.NEXT_PUBLIC_TEXAXES_OPS_URL ||
  "https://texaxes-ops.vercel.app";

export default function WaiverPage() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("booking_id");
  const customerId = searchParams.get("customer_id");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    is_minor: false,
    guardian_first_name: "",
    guardian_last_name: "",
    guardian_email: "",
    guardian_phone: "",
  });

  const [ack, setAck] = useState({
    read: false,
    risk: false,
    rules: false,
    medical: false,
    media: false,
    guardian: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = useMemo(() => {
    return (
      ack.read &&
      ack.risk &&
      ack.rules &&
      ack.medical &&
      ack.media &&
      (!form.is_minor || ack.guardian)
    );
  }, [ack, form.is_minor]);

  function updateForm(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function getCtx() {
    return canvasRef.current?.getContext("2d");
  }

  function getPoint(e: any) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const src = e.touches ? e.touches[0] : e;

    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  }

  function start(e: any) {
    const ctx = getCtx();
    const p = getPoint(e);
    if (!ctx || !p) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: any) {
    if (!isDrawing) return;
    const ctx = getCtx();
    const p = getPoint(e);
    if (!ctx || !p) return;

    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function stop() {
    setIsDrawing(false);
  }

  function clearSig() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function hasSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return true;
    }
    return false;
  }

  function getSignature() {
    if (!canvasRef.current || !hasSignature()) return null;
    return canvasRef.current.toDataURL("image/png");
  }

  async function submit() {
    setError(null);

    if (!bookingId) return setError("Missing booking context.");
    if (!customerId) return setError("Missing customer context.");

    if (!form.first_name || !form.last_name) {
      return setError("Name required.");
    }

    if (!allChecked) {
      return setError("Please accept all acknowledgments.");
    }

    if (form.is_minor) {
      if (!form.guardian_first_name || !form.guardian_last_name) {
        return setError("Guardian required.");
      }
    }

    const sig = getSignature();
    if (!sig) return setError("Signature required.");

    setSubmitting(true);

    try {
      const res = await fetch(`${OPS_URL}/api/waivers/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          customer_id: customerId,
          customer: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email || null,
            phone: form.phone || null,
          },
          is_minor: form.is_minor,
          guardian: form.is_minor
            ? {
                first_name: form.guardian_first_name,
                last_name: form.guardian_last_name,
                email: form.guardian_email || null,
                phone: form.guardian_phone || null,
              }
            : null,
          signature_data_url: sig,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Waiver Complete</h1>
        <p>Your waiver has been recorded successfully.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1>Waiver</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <input placeholder="First Name" onChange={(e) => updateForm("first_name", e.target.value)} />
      <input placeholder="Last Name" onChange={(e) => updateForm("last_name", e.target.value)} />
      <input placeholder="Email" onChange={(e) => updateForm("email", e.target.value)} />
      <input placeholder="Phone" onChange={(e) => updateForm("phone", e.target.value)} />

      <label>
        <input type="checkbox" onChange={(e) => updateForm("is_minor", e.target.checked)} />
        Minor
      </label>

      {form.is_minor && (
        <>
          <input placeholder="Guardian First Name" onChange={(e) => updateForm("guardian_first_name", e.target.value)} />
          <input placeholder="Guardian Last Name" onChange={(e) => updateForm("guardian_last_name", e.target.value)} />
        </>
      )}

      <h3>Acknowledgments</h3>

      {Object.keys(ack).map((k) => (
        <label key={k}>
          <input
            type="checkbox"
            onChange={(e) => setAck({ ...ack, [k]: e.target.checked })}
          />
          {k}
        </label>
      ))}

      <h3>Signature</h3>

      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        style={{ border: "1px solid black" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />

      <br />

      <button onClick={clearSig}>Clear</button>
      <button onClick={submit} disabled={submitting}>
        {submitting ? "Submitting..." : "Sign Waiver"}
      </button>
    </div>
  );
}
