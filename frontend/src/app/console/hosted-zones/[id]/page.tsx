"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";

interface RecordItem {
  id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
  routing_policy: string;
  alias: boolean;
  created_at: string;
}

interface Zone {
  id: string;
  name: string;
  type: string;
  comment: string;
  record_count: number;
}

const RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"];

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = params.id as string;
  const { addNotification } = useNotifications();

  const [zone, setZone] = useState<Zone | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    name: "",
    type: "A",
    value: "",
    ttl: 300,
    routing_policy: "Simple",
  });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editRecord, setEditRecord] = useState<RecordItem | null>(null);
  const [editData, setEditData] = useState({ value: "", ttl: 300, routing_policy: "Simple" });

  // Delete modal
  const [deleteRecord, setDeleteRecord] = useState<RecordItem | null>(null);

  // Detail panel
  const [detailRecord, setDetailRecord] = useState<RecordItem | null>(null);

  const pageSize = 50;

  const fetchZone = useCallback(async () => {
    try {
      const data = await api.getZone(zoneId);
      setZone(data);
    } catch (err: any) {
      addNotification("error", err.message);
    }
  }, [zoneId, addNotification]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listRecords(zoneId, {
        search,
        record_type: typeFilter,
        page,
        page_size: pageSize,
      });
      setRecords(data.records);
      setTotal(data.total);
    } catch (err: any) {
      addNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [zoneId, search, typeFilter, page, addNotification]);

  useEffect(() => {
    fetchZone();
  }, [fetchZone]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createRecord(zoneId, newRecord);
      addNotification("success", `Record ${newRecord.name} created.`);
      setCreateOpen(false);
      setNewRecord({ name: "", type: "A", value: "", ttl: 300, routing_policy: "Simple" });
      fetchRecords();
      fetchZone();
    } catch (err: any) {
      addNotification("error", err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    try {
      await api.updateRecord(zoneId, editRecord.id, editData);
      addNotification("success", `Record updated.`);
      setEditRecord(null);
      fetchRecords();
    } catch (err: any) {
      addNotification("error", err.message);
    }
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    try {
      await api.deleteRecord(zoneId, deleteRecord.id);
      addNotification("success", `Record deleted.`);
      setDeleteRecord(null);
      setSelected(new Set());
      fetchRecords();
      fetchZone();
    } catch (err: any) {
      addNotification("error", err.message);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getValueHelp(type: string): string {
    switch (type) {
      case "A": return "Enter an IPv4 address (e.g., 192.0.2.1)";
      case "AAAA": return "Enter an IPv6 address (e.g., 2001:0db8::1)";
      case "CNAME": return "Enter a domain name (e.g., www.example.com)";
      case "TXT": return 'Enter text value (e.g., "v=spf1 include:_spf.google.com ~all")';
      case "MX": return "Enter priority and mail server (e.g., 10 mail.example.com)";
      case "NS": return "Enter nameserver (e.g., ns1.example.com)";
      case "PTR": return "Enter pointer domain name";
      case "SRV": return "Enter priority weight port target (e.g., 10 5 5060 sip.example.com)";
      case "CAA": return 'Enter flags tag value (e.g., 0 issue "letsencrypt.org")';
      default: return "Enter the record value";
    }
  }

  const selectedRecord = records.find((r) => selected.has(r.id));
  const isProtectedRecord = selectedRecord
    ? (selectedRecord.type === "SOA" || selectedRecord.type === "NS") &&
      selectedRecord.name === zone?.name
    : false;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-4">
        <Link href="/console/hosted-zones" className="text-[#0972d3] hover:underline">
          Hosted zones
        </Link>
        {" > "}
        <span>{zone?.name || "..."}</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">{zone?.name || "Loading..."}</h1>

      {/* Zone info */}
      {zone && (
        <div className="aws-panel mb-5">
          <div className="aws-panel-header text-base">Hosted zone details</div>
          <div className="aws-panel-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-[#545b64] text-xs mb-1">Hosted zone ID</div>
                <div className="font-medium">{zone.id}</div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-1">Domain name</div>
                <div className="font-medium">{zone.name}</div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-1">Type</div>
                <div>
                  <span className="inline-block px-2 py-0.5 bg-[#f2f3f3] rounded text-xs">
                    {zone.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-1">Record count</div>
                <div className="font-medium">{zone.record_count}</div>
              </div>
              {zone.comment && (
                <div className="col-span-2">
                  <div className="text-[#545b64] text-xs mb-1">Description</div>
                  <div>{zone.comment}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Records panel */}
      <div className="aws-panel">
        <div className="px-5 py-3 border-b border-[#d5dbdb] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <select
                className="aws-select w-32"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="SOA">SOA</option>
              </select>
              <div className="flex flex-1">
                <input
                  type="text"
                  className="aws-input rounded-r-none border-r-0"
                  placeholder="Filter records by name"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearch(searchInput);
                      setPage(1);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setSearch(searchInput);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 bg-[#fafafa] border border-[#d5dbdb] rounded-r text-sm hover:bg-[#eaeded]"
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="aws-btn-secondary"
              disabled={selected.size !== 1 || isProtectedRecord}
              onClick={() => {
                const r = records.find((r) => selected.has(r.id));
                if (r) {
                  setEditRecord(r);
                  setEditData({ value: r.value, ttl: r.ttl, routing_policy: r.routing_policy });
                }
              }}
            >
              Edit record
            </button>
            <button
              className="aws-btn-danger"
              disabled={selected.size !== 1 || isProtectedRecord}
              onClick={() => {
                const r = records.find((r) => selected.has(r.id));
                if (r) setDeleteRecord(r);
              }}
            >
              Delete record
            </button>
            <button className="aws-btn-primary" onClick={() => setCreateOpen(true)}>
              Create record
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#545b64]">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#545b64]">
              {search || typeFilter
                ? "No records match your search."
                : "No records found."}
            </p>
          </div>
        ) : (
          <>
            <table className="aws-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === records.length && records.length > 0}
                      onChange={() => {
                        if (selected.size === records.length) setSelected(new Set());
                        else setSelected(new Set(records.map((r) => r.id)));
                      }}
                    />
                  </th>
                  <th>Record name</th>
                  <th>Type</th>
                  <th>Routing policy</th>
                  <th>Value / Route traffic to</th>
                  <th>TTL (seconds)</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => setDetailRecord(record)}
                        className="text-[#0972d3] hover:underline text-left"
                      >
                        {record.name}
                      </button>
                    </td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        record.type === "A" ? "bg-blue-100 text-blue-800" :
                        record.type === "AAAA" ? "bg-purple-100 text-purple-800" :
                        record.type === "CNAME" ? "bg-green-100 text-green-800" :
                        record.type === "MX" ? "bg-yellow-100 text-yellow-800" :
                        record.type === "TXT" ? "bg-orange-100 text-orange-800" :
                        record.type === "NS" ? "bg-gray-100 text-gray-800" :
                        record.type === "SOA" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="text-sm text-[#545b64]">{record.routing_policy}</td>
                    <td className="max-w-[300px]">
                      <div className="text-sm font-mono truncate" title={record.value}>
                        {record.value.split("\n")[0]}
                        {record.value.includes("\n") && (
                          <span className="text-[#545b64]">
                            {" "}(+{record.value.split("\n").length - 1} more)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-[#545b64]">{record.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create Record Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create record" width="max-w-2xl">
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <label className="aws-label">Record name</label>
            <p className="aws-description">
              The full domain name for this record (e.g., www.{zone?.name || "example.com."})
            </p>
            <input
              type="text"
              className="aws-input"
              value={newRecord.name}
              onChange={(e) => setNewRecord((p) => ({ ...p, name: e.target.value }))}
              placeholder={`subdomain.${zone?.name || "example.com."}`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="aws-label">Record type</label>
              <select
                className="aws-select"
                value={newRecord.type}
                onChange={(e) => setNewRecord((p) => ({ ...p, type: e.target.value }))}
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} — {t === "A" ? "IPv4 address" :
                           t === "AAAA" ? "IPv6 address" :
                           t === "CNAME" ? "Canonical name" :
                           t === "TXT" ? "Text" :
                           t === "MX" ? "Mail exchange" :
                           t === "NS" ? "Name server" :
                           t === "PTR" ? "Pointer" :
                           t === "SRV" ? "Service locator" :
                           t === "CAA" ? "Certification Authority Auth" : t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="aws-label">TTL (seconds)</label>
              <input
                type="number"
                className="aws-input"
                value={newRecord.ttl}
                onChange={(e) => setNewRecord((p) => ({ ...p, ttl: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="aws-label">Value</label>
            <p className="aws-description">{getValueHelp(newRecord.type)}</p>
            <textarea
              className="aws-input min-h-[80px] font-mono text-sm"
              value={newRecord.value}
              onChange={(e) => setNewRecord((p) => ({ ...p, value: e.target.value }))}
              placeholder="Enter record value"
              required
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="aws-label">Routing policy</label>
            <select
              className="aws-select"
              value={newRecord.routing_policy}
              onChange={(e) => setNewRecord((p) => ({ ...p, routing_policy: e.target.value }))}
            >
              <option value="Simple">Simple routing</option>
              <option value="Weighted">Weighted</option>
              <option value="Latency">Latency-based</option>
              <option value="Failover">Failover</option>
              <option value="Geolocation">Geolocation</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
            <button type="button" className="aws-btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="aws-btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Record Modal */}
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="Edit record" width="max-w-2xl">
        <form onSubmit={handleEdit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="aws-label">Record name</label>
              <input type="text" className="aws-input bg-[#f2f3f3]" value={editRecord?.name || ""} disabled />
            </div>
            <div>
              <label className="aws-label">Type</label>
              <input type="text" className="aws-input bg-[#f2f3f3]" value={editRecord?.type || ""} disabled />
            </div>
          </div>

          <div className="mb-4">
            <label className="aws-label">Value</label>
            <textarea
              className="aws-input min-h-[80px] font-mono text-sm"
              value={editData.value}
              onChange={(e) => setEditData((p) => ({ ...p, value: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="aws-label">TTL (seconds)</label>
              <input
                type="number"
                className="aws-input"
                value={editData.ttl}
                onChange={(e) => setEditData((p) => ({ ...p, ttl: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="aws-label">Routing policy</label>
              <select
                className="aws-select"
                value={editData.routing_policy}
                onChange={(e) => setEditData((p) => ({ ...p, routing_policy: e.target.value }))}
              >
                <option value="Simple">Simple routing</option>
                <option value="Weighted">Weighted</option>
                <option value="Latency">Latency-based</option>
                <option value="Failover">Failover</option>
                <option value="Geolocation">Geolocation</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
            <button type="button" className="aws-btn-secondary" onClick={() => setEditRecord(null)}>
              Cancel
            </button>
            <button type="submit" className="aws-btn-primary">
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Record Modal */}
      <Modal
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        title="Delete record"
      >
        <div className="mb-4">
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-[#d13212] mb-4">
            This will permanently delete this DNS record.
          </div>
          <div className="text-sm space-y-1">
            <div><strong>Name:</strong> {deleteRecord?.name}</div>
            <div><strong>Type:</strong> {deleteRecord?.type}</div>
            <div><strong>Value:</strong> <span className="font-mono">{deleteRecord?.value}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
          <button className="aws-btn-secondary" onClick={() => setDeleteRecord(null)}>
            Cancel
          </button>
          <button className="aws-btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>

      {/* Record Detail Drawer */}
      <Modal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title="Record details"
      >
        {detailRecord && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[#545b64] text-xs mb-0.5">Record name</div>
                <div className="font-medium">{detailRecord.name}</div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-0.5">Type</div>
                <div className="font-medium">{detailRecord.type}</div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-0.5">TTL</div>
                <div>{detailRecord.ttl} seconds</div>
              </div>
              <div>
                <div className="text-[#545b64] text-xs mb-0.5">Routing policy</div>
                <div>{detailRecord.routing_policy}</div>
              </div>
            </div>
            <div>
              <div className="text-[#545b64] text-xs mb-0.5">Value</div>
              <pre className="bg-[#f2f3f3] rounded p-3 text-xs font-mono whitespace-pre-wrap break-all">
                {detailRecord.value}
              </pre>
            </div>
            <div>
              <div className="text-[#545b64] text-xs mb-0.5">Created</div>
              <div>{new Date(detailRecord.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
