"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const cities = ["Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Other"];
const roomTypes = ["Single room", "Cottage", "Shared room", "Apartment", "House"];

export default function TenantRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8f7] px-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-700">Profile received</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">You&apos;re on the list.</h1>
          <p className="mt-4 leading-7 text-slate-600">We&apos;ll use your preferences to show matching available rooms. Database saving comes in the next build step.</p>
          <Link className="mt-7 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white" href="/">Back to home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-5 py-8 sm:py-14">
      <section className="mx-auto max-w-2xl">
        <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-800" href="/">← Back to Mastanda Plug</Link>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Tenant profile</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">What kind of place are you looking for?</h1>
          <p className="mt-3 max-w-xl leading-7 text-slate-600">Complete these details so Mastanda Plug can find rooms that fit your needs and budget.</p>

          <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Full name" name="name" placeholder="e.g. Sarah Khumalo" />
            <Field label="WhatsApp number" name="whatsapp" placeholder="e.g. 077 123 4567" type="tel" />
            <label className="grid gap-2"><span className="text-sm font-bold text-slate-800">Preferred city</span><select className="field" defaultValue="" name="city" required><option disabled value="">Select a city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
            <Field label="Preferred suburb or area" name="area" placeholder="e.g. Tshabalala" />
            <label className="grid gap-2"><span className="text-sm font-bold text-slate-800">Room type</span><select className="field" defaultValue="" name="roomType" required><option disabled value="">Select room type</option>{roomTypes.map((roomType) => <option key={roomType}>{roomType}</option>)}</select></label>
            <Field label="Maximum monthly budget (USD)" name="budget" placeholder="e.g. 80" type="number" />
            <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-bold text-slate-800">Anything else we should know? <span className="font-normal text-slate-400">(optional)</span></span><textarea className="field min-h-28 resize-y" name="notes" placeholder="For example: borehole water, solar power, number of occupants..." /></label>
            <button className="sm:col-span-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700" type="submit">Save my tenant profile</button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder: string; type?: string }) {
  return <label className="grid gap-2"><span className="text-sm font-bold text-slate-800">{label}</span><input className="field" name={name} placeholder={placeholder} required type={type} /></label>;
}
