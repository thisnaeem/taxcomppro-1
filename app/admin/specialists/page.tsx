"use client";
import { useAdminDialog } from "@/components/layout/useAdminDialog";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  Settings01Icon,
  ArrowUpRight01Icon,
} from "hugeicons-react";
type Knowledge = {
  title: string;
  text: string;
  url?: string;
  priority: number;
  approved: boolean;
  reviewedAt?: string;
};
type Bot = {
  id: string;
  userId: string;
  user: { name: string; image: string; profileSlug: string };
  title: string;
  about: string;
  expertise: string[];
  starters: string[];
  signature: string;
  courseNames: string[];
  personality: string;
  boundaries: string;
  provider: string;
  enabled: boolean;
  autoPublish: boolean;
  autoReply: boolean;
  weeklyPosts: number;
  destination: string;
  destinationId: string | null;
  knowledge: Knowledge[];
};
type Activity = {
  id: string;
  specialistId: string;
  kind: string;
  status: string;
  content: string;
  error: string | null;
  provider: string | null;
  publishedUrl: string | null;
  createdAt: string;
};
type Option = { id: string; name: string };
type Data = {
  bots: Bot[];
  activities: Activity[];
  providers: { openai: boolean; claude: boolean };
  schedulerConfigured: boolean;
  groups: Option[];
  forums: Option[];
  networks: Option[];
  courses: { id: string; title: string; instructorId: string }[];
};
export default function SpecialistsAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [editing, setEditing] = useState<Bot | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Activity | null>(null);
  const closeDialog = useCallback(() => {
    setEditing(null);
    setDraft(null);
  }, []);
  useAdminDialog(!!editing || !!draft, closeDialog);
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/specialists");
    if (!r.ok) throw new Error("Could not load specialists.");
    setData(await r.json());
  }, []);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function action(
    action: string,
    id?: string,
    extra: Record<string, unknown> = {},
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/admin/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      setNotice(
        action === "draft"
          ? "Draft generated. Review it below before publishing."
          : "Changes saved.",
      );
      setDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/specialists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          name: editing.user.name,
          image: editing.user.image || "",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      setEditing(null);
      setNotice("Specialist settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  const update = (patch: Partial<Bot>) =>
    setEditing((b) => (b ? { ...b, ...patch } : b));
  const destinations =
    editing?.destination === "GROUP"
      ? data?.groups
      : editing?.destination === "FORUM"
        ? data?.forums
        : data?.networks;
  return (
    <div className="admin-workspace">
      <header className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">INTELLIGENCE & COMMUNITY</span>
          <h1>Your AI specialist team.</h1>
          <p>
            Seven distinct voices. One connected community. You stay in control.
          </p>
        </div>
        <SparklesIcon size={38} />
      </header>
      {error && (
        <p role="alert" className="admin-alert">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      {!data ? (
        <p>Loading specialists…</p>
      ) : (
        <>
          <div className="admin-metrics">
            <div>
              <span>Specialists enabled</span>
              <strong>{data.bots.filter((b) => b.enabled).length} / 7</strong>
            </div>
            <div>
              <span>Configured providers</span>
              <strong>
                {[
                  data.providers.openai && "OpenAI",
                  data.providers.claude && "Claude",
                ]
                  .filter(Boolean)
                  .join(" + ") || "None configured"}
              </strong>
            </div>
            <div>
              <span>Scheduled posts / week</span>
              <strong>
                {data.bots
                  .filter((b) => b.enabled)
                  .reduce((n, b) => n + b.weeklyPosts, 0)}
              </strong>
            </div>
            <div>
              <span>Scheduler authorization</span>
              <strong>
                {data.schedulerConfigured
                  ? "Configured"
                  : "CRON_SECRET required"}
              </strong>
            </div>
          </div>
          <p className="admin-hint">
            Schedules run at 14:00 UTC on evenly spaced days. Auto-publish sends
            generated posts to the selected destination; otherwise they remain
            drafts. Replies are limited to name mentions and questions on a
            specialist’s own feed threads. All content identifies its AI author.
          </p>
          {!data.bots.length && (
            <button
              className="admin-primary"
              disabled={busy}
              onClick={() => action("initialize")}
            >
              Set up the seven specialists
            </button>
          )}
          <div className="admin-bot-grid">
            {data.bots.map((b) => (
              <article className="admin-bot-card" key={b.id}>
                <div className="admin-bot-top">
                  <img src={b.user.image} alt="" />
                  <span
                    className={
                      b.enabled ? "admin-status" : "admin-status paused"
                    }
                  >
                    {b.enabled ? (
                      <PlayIcon size={12} />
                    ) : (
                      <PauseIcon size={12} />
                    )}{" "}
                    {b.enabled ? "Enabled" : "Paused"}
                  </span>
                </div>
                <h2>{b.user.name}</h2>
                <p>{b.title}</p>
                <small>Tax Comp Pro AI Specialist</small>
                <div className="admin-bot-tags">
                  <span>{b.weeklyPosts} posts / week</span>
                  <span>
                    {b.autoPublish ? "Auto-publish" : "Review drafts"}
                  </span>
                  <span>{b.destination.toLowerCase()}</span>
                </div>
                <footer>
                  <button onClick={() => setEditing(structuredClone(b))}>
                    <Settings01Icon size={16} /> Manage
                  </button>
                  <button
                    disabled={busy || !b.enabled}
                    onClick={() => action("draft", b.id)}
                  >
                    Generate draft
                  </button>
                  <Link
                    aria-label={`View ${b.user.name}`}
                    href={`/member/${b.user.profileSlug}`}
                  >
                    <ArrowUpRight01Icon size={18} />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
          <section className="admin-panel">
            <h2>Activity & publishing queue</h2>
            <p>Review drafts, inspect failures, and open published posts.</p>
            <div className="admin-activity-list">
              {data.activities
                .filter((a) => a.kind !== "CHAT")
                .map((a) => (
                  <article key={a.id}>
                    <div>
                      <strong>
                        {
                          data.bots.find((b) => b.id === a.specialistId)?.user
                            .name
                        }
                      </strong>
                      <span className="admin-status">{a.status}</span>
                      <small>
                        {new Date(a.createdAt).toLocaleString()} · {a.kind}{" "}
                        {a.provider && `· ${a.provider}`}
                      </small>
                    </div>
                    <p className="admin-activity-text">
                      {a.error || a.content || "Generating content…"}
                    </p>
                    <div className="admin-actions">
                      {a.status === "DRAFT" && (
                        <>
                          <button disabled={busy} onClick={() => setDraft(a)}>
                            Edit draft
                          </button>
                          <button
                            className="admin-primary"
                            disabled={busy}
                            onClick={() => action("publish", a.id)}
                          >
                            Publish
                          </button>
                        </>
                      )}
                      {["DRAFT", "FAILED"].includes(a.status) && (
                        <button
                          disabled={busy}
                          onClick={() => action("discard", a.id)}
                        >
                          Discard
                        </button>
                      )}
                      {a.publishedUrl && (
                        <Link href={a.publishedUrl}>
                          View published content ↗
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              {!data.activities.some((a) => a.kind !== "CHAT") && (
                <p>
                  No activity yet. Generate a draft to meet your specialists.
                </p>
              )}
            </div>
          </section>
        </>
      )}
      {editing && (
        <div className="admin-dialog-backdrop">
          <section
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Manage specialist"
          >
            <header>
              <h2>Manage {editing.user.name}</h2>
              <button onClick={() => setEditing(null)} disabled={busy}>
                Close
              </button>
            </header>
            {error && (
              <p className="admin-alert" role="alert">
                {error}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="admin-form-grid">
                <label>
                  Name
                  <input
                    value={editing.user.name}
                    onChange={(e) =>
                      update({
                        user: { ...editing.user, name: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Profile image URL
                  <input
                    value={editing.user.image || ""}
                    onChange={(e) =>
                      update({
                        user: { ...editing.user, image: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="wide">
                  Professional title
                  <input
                    value={editing.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </label>
                <label className="wide">
                  About
                  <textarea
                    value={editing.about}
                    onChange={(e) => update({ about: e.target.value })}
                  />
                </label>
                <label>
                  Personality
                  <textarea
                    value={editing.personality}
                    onChange={(e) => update({ personality: e.target.value })}
                  />
                </label>
                <label>
                  Boundaries
                  <textarea
                    value={editing.boundaries}
                    onChange={(e) => update({ boundaries: e.target.value })}
                  />
                </label>
                <label>
                  Expertise (one per line)
                  <textarea
                    value={editing.expertise.join("\n")}
                    onChange={(e) =>
                      update({ expertise: e.target.value.split("\n") })
                    }
                  />
                </label>
                <label>
                  Conversation starters (3–5 lines)
                  <textarea
                    value={editing.starters.join("\n")}
                    onChange={(e) =>
                      update({ starters: e.target.value.split("\n") })
                    }
                  />
                </label>
                <label className="wide">
                  Signature
                  <input
                    value={editing.signature}
                    onChange={(e) => update({ signature: e.target.value })}
                  />
                </label>
                <label>
                  Provider
                  <select
                    value={editing.provider}
                    onChange={(e) => update({ provider: e.target.value })}
                  >
                    <option value="auto">Automatic / Atlas preference</option>
                    <option value="openai">OpenAI first</option>
                    <option value="claude">Claude first</option>
                  </select>
                </label>
                <label>
                  Posts per week (0–5)
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={editing.weeklyPosts}
                    onChange={(e) =>
                      update({ weeklyPosts: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Destination
                  <select
                    value={editing.destination}
                    onChange={(e) =>
                      update({
                        destination: e.target.value,
                        destinationId: null,
                      })
                    }
                  >
                    {["FEED", "GROUP", "FORUM", "NETWORK"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                {editing.destination !== "FEED" && (
                  <label>
                    Community space
                    <select
                      value={editing.destinationId || ""}
                      onChange={(e) =>
                        update({ destinationId: e.target.value })
                      }
                    >
                      <option value="">Choose a destination</option>
                      {destinations?.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="wide">
                  Course expertise (one per line)
                  <textarea
                    value={editing.courseNames.join("\n")}
                    onChange={(e) =>
                      update({
                        courseNames: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </label>
              </div>
              <div className="admin-actions">
                {(["enabled", "autoPublish", "autoReply"] as const).map(
                  (key) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={editing[key]}
                        onChange={(e) => update({ [key]: e.target.checked })}
                      />
                      {key === "enabled"
                        ? "Enabled"
                        : key === "autoPublish"
                          ? "Auto-publish scheduled posts"
                          : "Respond when invited"}
                    </label>
                  ),
                )}
              </div>
              <h3>Approved knowledge</h3>
              <p className="admin-hint">
                Priority: 1 government law, 2 IRS forms, 3 Treasury / IRS
                rulings, 4 TCP training, 5 platform FAQs, 6 general education.
                Paste verified excerpts; links alone do not train the bot.
              </p>
              {editing.knowledge.map((k, i) => (
                <fieldset className="admin-knowledge" key={i}>
                  <input
                    aria-label="Source title"
                    placeholder="Source title"
                    value={k.title}
                    onChange={(e) =>
                      update({
                        knowledge: editing.knowledge.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="Source URL"
                    placeholder="https://…"
                    value={k.url || ""}
                    onChange={(e) =>
                      update({
                        knowledge: editing.knowledge.map((x, j) =>
                          j === i ? { ...x, url: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <textarea
                    aria-label="Approved source text"
                    placeholder="Verified source excerpt"
                    value={k.text}
                    onChange={(e) =>
                      update({
                        knowledge: editing.knowledge.map((x, j) =>
                          j === i ? { ...x, text: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <div className="admin-actions">
                    <label>
                      Priority
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={k.priority}
                        onChange={(e) =>
                          update({
                            knowledge: editing.knowledge.map((x, j) =>
                              j === i
                                ? { ...x, priority: Number(e.target.value) }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={k.approved}
                        onChange={(e) =>
                          update({
                            knowledge: editing.knowledge.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    approved: e.target.checked,
                                    reviewedAt: new Date().toISOString(),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                      Approved
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          knowledge: editing.knowledge.filter(
                            (_, j) => j !== i,
                          ),
                        })
                      }
                    >
                      Remove source
                    </button>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  update({
                    knowledge: [
                      ...editing.knowledge,
                      { title: "", text: "", priority: 4, approved: false },
                    ],
                  })
                }
              >
                Add knowledge source
              </button>
              <footer className="admin-actions">
                <button className="admin-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save specialist"}
                </button>
              </footer>
            </form>
            <h3>Assign as course instructor</h3>
            <p className="admin-hint">
              This changes the instructor of an existing course.
            </p>
            {data?.courses.map((c) => (
              <div className="admin-course-row" key={c.id}>
                <span>{c.title}</span>
                <button
                  disabled={busy || c.instructorId === editing.userId}
                  onClick={() =>
                    action("assignCourse", editing.id, { courseId: c.id })
                  }
                >
                  {c.instructorId === editing.userId ? "Assigned" : "Assign"}
                </button>
              </div>
            ))}
          </section>
        </div>
      )}
      {draft && (
        <div className="admin-dialog-backdrop">
          <section
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Edit draft"
          >
            <h2>Edit draft</h2>
            <textarea
              aria-label="Draft content"
              rows={12}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
            <div className="admin-actions">
              <button
                disabled={busy}
                className="admin-primary"
                onClick={() =>
                  action("editDraft", draft.id, { content: draft.content })
                }
              >
                Save draft
              </button>
              <button onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
