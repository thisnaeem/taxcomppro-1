"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  UserGroupIcon,
  Shield01Icon,
  Location01Icon,
  Tick01Icon,
  Briefcase01Icon,
} from "hugeicons-react";
import { ProCard, type ProData } from "@/components/pros/ProCard";
import {
  GridSwitcher,
  useGridView,
} from "@/components/pros/GridSwitcher";
import "@/components/pros/pros.css";
import "@/components/pros/pros-light.css";

const FILTERS = [
  { label: "All professionals", value: "", pattern: null },
  {
    label: "CPA",
    value: "CPA",
    pattern: /\bcpa\b|certified public accountant/i,
  },
  { label: "Enrolled Agent", value: "EA", pattern: /\bea\b|enrolled\s*agent/i },
  { label: "Attorney", value: "Attorney", pattern: /attorney|lawyer/i },
  { label: "Bookkeeper", value: "Bookkeeper", pattern: /bookkeep/i },
  {
    label: "CFP",
    value: "CFP",
    pattern: /\bcfp\b|certified financial planner/i,
  },
  { label: "Consultant", value: "Consultant", pattern: /consult/i },
  { label: "JD", value: "JD", pattern: /\bj\.?d\.?\b|juris doctor/i },
  {
    label: "MBA",
    value: "MBA",
    pattern: /\bmba\b|master.*business administration/i,
  },
];

export default function FindAProPage() {
  const [pros, setPros] = useState<ProData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [credential, setCredential] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("recent");
  const [viewMode, setViewMode] = useGridView("fp-grid-view", "grid-4", ["grid-4", "grid-3", "grid-2", "list"]);
  const results = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/pros", {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("We couldn’t load the directory. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data))
          throw new Error("The directory is temporarily unavailable.");
        if (!controller.signal.aborted) {
          setPros(
            data.map((pro: ProData) => ({
              ...pro,
              specialties: Array.isArray(pro.specialties)
                ? pro.specialties
                : [],
              certifications: Array.isArray(pro.certifications)
                ? pro.certifications
                : [],
            })),
          );
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Please check your connection and try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);
  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          pros
            .map((pro) => pro.location?.trim())
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [pros],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pattern = FILTERS.find(
      (filter) => filter.value === credential,
    )?.pattern;
    return pros
      .filter((pro) => {
        const professionalText = [
          pro.headline,
          ...pro.specialties,
          ...pro.certifications,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          (!term ||
            `${pro.name} ${pro.location || ""} ${professionalText}`
              .toLowerCase()
              .includes(term)) &&
          (!pattern || pattern.test(professionalText)) &&
          (!location || pro.location?.trim() === location)
        );
      })
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "experience"
            ? (b.yearsExperience ?? -1) - (a.yearsExperience ?? -1)
            : 0,
      );
  }, [pros, query, credential, location, sort]);
  const hasFilters = !!(query || credential || location);
  function reset() {
    setQuery("");
    setCredential("");
    setLocation("");
  }
  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-page-top">
          <span className="fp-eyebrow">THE PROFESSIONAL DIRECTORY</span>
          <Link href="/apply-professional">
            Are you a professional?{" "}
            <span>
              Get listed <ArrowRight01Icon size={15} />
            </span>
          </Link>
        </div>
        <section className="fp-hero" aria-labelledby="directory-title">
          <div className="fp-hero-copy">
            <span className="fp-kicker">
              <span />
              EXPERTISE MEETS CONNECTION
            </span>
            <h1 id="directory-title">
              The Right Service.
              <br />
              The Right Pro.
              <br />
              <span>Right Here.</span>
            </h1>
            <p>
              Find a Pro makes it easier to discover trusted expertise, compare
              your options, and connect with professionals who offer the
              services you need.
            </p>
            <div className="fp-hero-actions">
              <button
                className="fp-button fp-primary"
                onClick={() => {
                  results.current?.scrollIntoView({ behavior: "smooth" });
                  search.current?.focus({ preventScroll: true });
                }}
              >
                Find your professional{" "}
                <span className="fp-arrow">
                  <ArrowRight01Icon size={17} />
                </span>
              </button>
              <span>
                <UserGroupIcon size={17} /> Real people. Personal expertise.
              </span>
            </div>
          </div>
          <aside className="fp-intro-shell">
            <div className="fp-intro">
              <div className="fp-intro-top">
                <span>A GOOD CONNECTION STARTS HERE</span>
                <span>↗</span>
              </div>
              <div className="fp-intro-art" aria-hidden="true">
                <span className="fp-orbit" />
                <span className="fp-orbit fp-orbit-two" />
                <span className="fp-art-profile">
                  <UserGroupIcon size={55} strokeWidth={1.1} />
                </span>
                <span className="fp-art-check">
                  <Tick01Icon size={20} />
                </span>
                <i className="fp-art-dot one" />
                <i className="fp-art-dot two" />
              </div>
              <h2>
                Different expertise.
                <br />
                One shared purpose.
              </h2>
              <p>Helping you take the next step with confidence.</p>
              <div className="fp-intro-tags">
                <span>Tax & accounting</span>
                <span>Business & beyond</span>
              </div>
            </div>
          </aside>
        </section>
        <div className="fp-value-strip">
          <span>
            <UserGroupIcon size={17} />
            {loading ? (
              "Professional profiles"
            ) : (
              <>
                <strong>{pros.length}</strong> professionals to discover
              </>
            )}
          </span>
          <span>
            <Briefcase01Icon size={17} />
            Expertise for your next chapter
          </span>
          <span>
            <Location01Icon size={17} />
            Find someone who understands your world
          </span>
          <span className="fp-strip-note">A connection worth making.</span>
        </div>
        <section
          className="fp-directory"
          ref={results}
          id="professionals"
          aria-label="Professional directory"
        >
          <div className="fp-directory-heading">
            <div>
              <span className="fp-eyebrow">YOUR NEXT GOOD CONNECTION</span>
              <h2>Meet the professionals.</h2>
            </div>
            <p>Explore their expertise. Get to know their approach.</p>
          </div>
          <div className="fp-search-row">
            <div className="fp-search">
              <Search01Icon size={22} />
              <input
                ref={search}
                aria-label="Search professionals"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, specialty, or city…"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <Cancel01Icon size={17} />
                </button>
              )}
            </div>
            <label className="fp-location">
              <Location01Icon size={18} />
              <select
                aria-label="Filter by location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                <option value="">All locations</option>
                {locations.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="fp-filters"
            aria-label="Filter by professional expertise"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                aria-pressed={credential === filter.value}
                onClick={() => setCredential(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="fp-results-bar">
            <div aria-live="polite">
              <strong>
                {loading
                  ? "Finding your people…"
                  : `${filtered.length} ${filtered.length === 1 ? "professional" : "professionals"}`}
              </strong>
              {!loading && (
                <span>
                  {hasFilters ? " matching your search" : " ready to explore"}
                </span>
              )}
              {hasFilters && (
                <button className="fp-reset" onClick={reset}>
                  Reset filters <Cancel01Icon size={12} />
                </button>
              )}
            </div>
            <div className="fp-view-controls">
              <label>
                Sort by
                <select
                  aria-label="Sort professionals"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recent">Newest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="experience">Most experienced</option>
                </select>
              </label>
              <GridSwitcher currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
          {loading ? (
            <div className="fp-loading" role="status">
              <span className="fp-spinner" />
              Getting the right people in the room…
            </div>
          ) : error ? (
            <div className="fp-empty" role="alert">
              <Shield01Icon size={34} />
              <h3>Let’s try that connection again.</h3>
              <p>{error}</p>
              <button
                className="fp-button fp-primary"
                onClick={() => {
                  setLoading(true);
                  setRetry((value) => value + 1);
                }}
              >
                Reload directory
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="fp-empty">
              <Search01Icon size={34} />
              <span className="fp-eyebrow">A LITTLE MORE EXPLORING</span>
              <h3>
                {hasFilters
                  ? "Your professional is still out there."
                  : "Good connections are on the way."}
              </h3>
              <p>
                {hasFilters
                  ? "Try a broader search, a different specialty, or another location."
                  : "Check back as new professionals join the directory."}
              </p>
              {hasFilters && (
                <button className="fp-button fp-primary" onClick={reset}>
                  Explore all professionals{" "}
                  <span className="fp-arrow">
                    <ArrowRight01Icon size={17} />
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div
              className={`fp-card-grid ${viewMode}`}
              aria-label="Professional profiles"
            >
              {filtered.map((pro) => (
                <ProCard key={pro.id} pro={pro} viewMode={viewMode} />
              ))}
            </div>
          )}
        </section>
        <section className="fp-guidance">
          <div>
            <span className="fp-eyebrow">A BETTER WAY TO CONNECT</span>
            <h2>
              A little research.
              <br />
              The right relationship.
            </h2>
          </div>
          <div>
            <span>01</span>
            <h3>Start with what you need</h3>
            <p>Use specialties and location to narrow your search.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Get to know the person</h3>
            <p>Explore their profile, experience, and approach.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Take the next step</h3>
            <p>Open a profile to find their contact and connection options.</p>
          </div>
        </section>
        <section className="fp-cta">
          <span className="fp-cta-icon">
            <Briefcase01Icon size={32} />
          </span>
          <div>
            <span className="fp-eyebrow">YOUR EXPERTISE BELONGS HERE</span>
            <h2>Be someone’s next great connection.</h2>
            <p>
              Build your professional presence and help people discover what you
              do best.
            </p>
          </div>
          <Link className="fp-button fp-primary" href="/apply-professional">
            Join the directory{" "}
            <span className="fp-arrow">
              <ArrowRight01Icon size={17} />
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
