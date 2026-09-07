import { useState } from "react";
import { ChefHat, Settings2, Table2, Users } from "lucide-react";

export default function ManagerControlPanel() {
  const [serverLive, setServerLive] = useState(true);
  const [kitchenAccepting, setKitchenAccepting] = useState(true);
  const [zone, setZone] = useState("Main floor");

  return (
    <section className="mt-8 rounded-2xl border border-[#dfe1dc] bg-[#24312e] p-5 text-white sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4bc83]">
            Manager controls
          </p>
          <h2 className="display-font mt-2 text-2xl font-bold">
            Run the shift
          </h2>
          <p className="mt-1 text-sm text-[#aab8b0]">
            Control service availability without leaving your dashboard.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-[#30403a] px-3 py-2 text-xs font-bold text-[#cfe0d0]">
          <span className="h-2 w-2 rounded-full bg-[#9ac49f]" />
          Manager access active
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <button
          onClick={() => setServerLive(!serverLive)}
          className="rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left transition hover:border-[#f4bc83]"
        >
          <div className="flex items-center justify-between">
            <Users size={20} className="text-[#f4bc83]" />
            <span
              className={`h-2.5 w-2.5 rounded-full ${serverLive ? "bg-[#9ac49f]" : "bg-[#d98865]"}`}
            />
          </div>
          <p className="mt-5 text-sm font-bold">Server service</p>
          <p className="mt-1 text-xs text-[#aab8b0]">
            {serverLive
              ? "Accepting table assignments"
              : "Paused for reassignment"}
          </p>
        </button>
        <button
          onClick={() => setKitchenAccepting(!kitchenAccepting)}
          className="rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left transition hover:border-[#f4bc83]"
        >
          <div className="flex items-center justify-between">
            <ChefHat size={20} className="text-[#f4bc83]" />
            <span
              className={`h-2.5 w-2.5 rounded-full ${kitchenAccepting ? "bg-[#9ac49f]" : "bg-[#d98865]"}`}
            />
          </div>
          <p className="mt-5 text-sm font-bold">Kitchen intake</p>
          <p className="mt-1 text-xs text-[#aab8b0]">
            {kitchenAccepting
              ? "Receiving new kitchen tickets"
              : "Paused for kitchen maintenance"}
          </p>
        </button>
        <label className="rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left">
          <div className="flex items-center justify-between">
            <Table2 size={20} className="text-[#f4bc83]" />
            <Settings2 size={17} className="text-[#aab8b0]" />
          </div>
          <span className="mt-5 block text-sm font-bold">
            Active server zone
          </span>
          <select
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#52625b] bg-[#24312e] px-2 py-2 text-xs font-bold text-white outline-none"
          >
            <option>Main floor</option>
            <option>Garden patio</option>
            <option>Private dining</option>
          </select>
        </label>
      </div>
    </section>
  );
}
