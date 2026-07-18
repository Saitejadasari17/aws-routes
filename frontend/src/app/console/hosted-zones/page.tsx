"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";

interface HostedZone {
  id: string;
  name: string;
  type: string;
  comment: string;
  record_count: number;
  created_at: string;
}

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { addNotification } = useNotifications();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("Public");
  const [createComment, setCreateComment] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [editComment, setEditComment] = useState("");

  // Delete modal
  const [deleteZone, setDeleteZone] = useState<HostedZone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const pageSize = 20;

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listZones({ search, page, page_size: pageSize });
      setZones(data.zones);
      setTotal(data.total);
    } catch (err: any) {
      addNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page, addNotification]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createZone({ name: createName, type: createType, comment: createComment });
      addNotification("success", `Hosted zone ${createName} created successfully.`);
      setCreateOpen(false);
      setCreateName("");
      setCreateComment("");
      setCreateType("Public");
      fetchZones();
    } catch (err: any) {
      addNotification("error", err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editZone) return;
    try {
      await api.updateZone(editZone.id, { comment: editComment });
      addNotification("success", `Hosted zone updated.`);
      setEditZone(null);
      fetchZones();
    } catch (err: any) {
      addNotification("error", err.message);
    }
  }

  async function handleDelete() {
    if (!deleteZone) return;
    try {
      await api.deleteZone(deleteZone.id);
      addNotification("success", `Hosted zone ${deleteZone.name} deleted.`);
      setDeleteZone(null);
      setDeleteConfirm("");
      setSelected(new Set());
      fetchZones();
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

  function toggleAll() {
    if (selected.size === zones.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(zones.map((z) => z.id)));
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-4">
        <span className="text-[#0972d3]">Route 53</span> &gt; Hosted zones
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Hosted zones</h1>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm text-[#16191f]">
        <strong>Hosted zones</strong> are containers for DNS records that define how traffic is routed for a domain
        and its subdomains. Create a hosted zone to start managing DNS records.
      </div>

      {/* Panel */}
      <div className="aws-panel">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#d5dbdb] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 max-w-md">
              <div className="flex">
                <input
                  type="text"
                  className="aws-input rounded-r-none border-r-0"
                  placeholder="Find hosted zones"
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
              disabled={selected.size !== 1}
              onClick={() => {
                const z = zones.find((z) => selected.has(z.id));
                if (z) {
                  setEditZone(z);
                  setEditComment(z.comment);
                }
              }}
            >
              Edit
            </button>
            <button
              className="aws-btn-danger"
              disabled={selected.size !== 1}
              onClick={() => {
                const z = zones.find((z) => selected.has(z.id));
                if (z) setDeleteZone(z);
              }}
            >
              Delete
            </button>
            <button className="aws-btn-primary" onClick={() => setCreateOpen(true)}>
              Create hosted zone
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-sm text-[#545b64]">Loading hosted zones...</div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-3">🌐</div>
            <p className="text-sm text-[#545b64] mb-4">
              {search ? "No hosted zones match your search." : "You don't have any hosted zones yet."}
            </p>
            {!search && (
              <button className="aws-btn-primary" onClick={() => setCreateOpen(true)}>
                Create hosted zone
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="aws-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === zones.length && zones.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Hosted zone name</th>
                  <th>Type</th>
                  <th>Record count</th>
                  <th>Comment</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(zone.id)}
                        onChange={() => toggleSelect(zone.id)}
                      />
                    </td>
                    <td>
                      <Link
                        href={`/console/hosted-zones/${zone.id}`}
                        className="text-[#0972d3] hover:underline"
                      >
                        {zone.name}
                      </Link>
                      <div className="text-xs text-[#545b64] mt-0.5">{zone.id}</div>
                    </td>
                    <td>
                      <span className="inline-block px-2 py-0.5 bg-[#f2f3f3] rounded text-xs">
                        {zone.type} hosted zone
                      </span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td className="text-[#545b64] max-w-[200px] truncate">{zone.comment || "—"}</td>
                    <td className="text-[#545b64] text-xs">
                      {new Date(zone.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create hosted zone">
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <label className="aws-label">Domain name</label>
            <p className="aws-description">
              Enter the domain name you want to manage (e.g., example.com)
            </p>
            <input
              type="text"
              className="aws-input"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="example.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="aws-label">Type</label>
            <select
              className="aws-select"
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
            >
              <option value="Public">Public hosted zone</option>
              <option value="Private">Private hosted zone</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="aws-label">Comment</label>
            <p className="aws-description">Optional description for this hosted zone</p>
            <input
              type="text"
              className="aws-input"
              value={createComment}
              onChange={(e) => setCreateComment(e.target.value)}
              placeholder="Optional comment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
            <button type="button" className="aws-btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="aws-btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create hosted zone"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editZone}
        onClose={() => setEditZone(null)}
        title="Edit hosted zone"
      >
        <form onSubmit={handleEdit}>
          <div className="mb-4">
            <label className="aws-label">Domain name</label>
            <input type="text" className="aws-input bg-[#f2f3f3]" value={editZone?.name || ""} disabled />
          </div>

          <div className="mb-4">
            <label className="aws-label">Hosted zone ID</label>
            <input type="text" className="aws-input bg-[#f2f3f3]" value={editZone?.id || ""} disabled />
          </div>

          <div className="mb-6">
            <label className="aws-label">Comment</label>
            <input
              type="text"
              className="aws-input"
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Optional comment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
            <button type="button" className="aws-btn-secondary" onClick={() => setEditZone(null)}>
              Cancel
            </button>
            <button type="submit" className="aws-btn-primary">
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteZone}
        onClose={() => {
          setDeleteZone(null);
          setDeleteConfirm("");
        }}
        title="Delete hosted zone"
      >
        <div className="mb-4">
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-[#d13212] mb-4">
            Deleting a hosted zone will permanently remove all DNS records in the zone. This action cannot be undone.
          </div>
          <p className="text-sm mb-3">
            To confirm deletion, type the domain name{" "}
            <strong>{deleteZone?.name}</strong> below:
          </p>
          <input
            type="text"
            className="aws-input"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={deleteZone?.name}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
          <button
            className="aws-btn-secondary"
            onClick={() => {
              setDeleteZone(null);
              setDeleteConfirm("");
            }}
          >
            Cancel
          </button>
          <button
            className="aws-btn-danger"
            disabled={deleteConfirm !== deleteZone?.name}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
