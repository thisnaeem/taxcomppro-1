"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search01Icon, ArrowRight01Icon, Cancel01Icon, BookOpen01Icon, UserGroupIcon, ShoppingBag01Icon, UserCircleIcon, Home01Icon, Layers01Icon } from "hugeicons-react";
import { SEARCH_CATEGORIES, SEARCH_PAGES, type SiteSearchResult, type SearchCategory } from "@/lib/site-search";
import "./site-search.css";
const icons = { Pages: Home01Icon, Courses: BookOpen01Icon, Toolkits: Layers01Icon, Professionals: UserCircleIcon, Groups: UserGroupIcon, Networks: UserGroupIcon, Marketplace: ShoppingBag01Icon };
export function SiteSearch({ onClose }: { onClose: () => void }) {
  const [query,setQuery]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const root=useRef<HTMLDivElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => input.current?.focus()); return () => cancelAnimationFrame(frame); }, []);
  return <div className="ss-search" ref={root} onKeyDown={e=>{if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;const links=Array.from(root.current?.querySelectorAll<HTMLAnchorElement>(".ss-result")||[]);if(!links.length)return;const index=links.indexOf(document.activeElement as HTMLAnchorElement);e.preventDefault();if(e.key==="ArrowUp"&&index<=0){input.current?.focus();return;}links[(index+(e.key==="ArrowDown"?1:-1)+links.length)%links.length]?.focus();}}>
    <div className="ss-input"><Search01Icon size={24}/><input ref={input} autoFocus aria-label="Search TaxCompPro" placeholder="Search courses, people, groups, and more…" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();root.current?.querySelector<HTMLAnchorElement>(".ss-result")?.click();}}}/>{query && <button aria-label="Clear search" onClick={()=>{setQuery("");input.current?.focus();}}><Cancel01Icon size={18}/></button>}</div>
    {query.trim().length<2 ? <div className="ss-start"><p>{query ? "Keep typing—enter at least 2 characters." : "Explore TaxCompPro"}</p><div className="ss-shortcuts">{SEARCH_PAGES.slice(1,8).map(page=><Link key={page.id} href={page.href} className="ss-result" onClick={onClose}>{page.title}<ArrowRight01Icon size={15}/></Link>)}</div></div> : <SearchResults key={query.trim()} query={query.trim()} onClose={onClose}/>}
    <footer className="ss-footer"><span>↑ ↓ to navigate · Enter to open</span><span>Esc to close</span></footer>
  </div>;
}
function SearchResults({ query,onClose }: { query:string;onClose:()=>void }) {
  const [results,setResults]=useState<SiteSearchResult[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[partial,setPartial]=useState(false),[retry,setRetry]=useState(0);
  const [category,setCategory]=useState<SearchCategory|"All">("All");
  useEffect(()=>{const controller=new AbortController();const timer=setTimeout(()=>{fetch(`/api/search?q=${encodeURIComponent(query)}`,{signal:controller.signal,cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{setResults(data.results);setPartial(data.partial);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});},180);return()=>{clearTimeout(timer);controller.abort();};},[query,retry]);
  const visible=category==="All"?results:results.filter(r=>r.category===category);
  return <><div className="ss-filters" aria-label="Search categories">{(["All",...SEARCH_CATEGORIES] as const).map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="ss-results" aria-busy={loading}>
    {loading ? <div role="status" aria-label="Searching the site" className="ss-loading">{[0,1,2].map(i=><div key={i}><span/><span/></div>)}</div> : error ? <div className="ss-empty" role="alert"><Search01Icon size={30}/><h3>Search is temporarily unavailable</h3><p>Please try again.</p><button onClick={()=>{setError(false);setLoading(true);setRetry(v=>v+1);}}>Retry search</button></div> : <>{partial && <p className="ss-warning" role="status">Some sections couldn’t load. Available results are shown below.</p>}<p className="ss-count" role="status">{visible.length} {visible.length===1?"result":"results"} for “{query}”</p>{!visible.length ? <div className="ss-empty"><Search01Icon size={30}/><h3>No matches {category!=="All"?`in ${category.toLowerCase()}`:"yet"}</h3><p>Try a different name, topic, or shorter phrase.</p>{category!=="All"&&<button onClick={()=>setCategory("All")}>Search all sections</button>}</div> : SEARCH_CATEGORIES.filter(c=>visible.some(r=>r.category===c)).map(c=><section key={c} aria-label={c}><h3 className="ss-section-title">{c}</h3>{visible.filter(r=>r.category===c).map(result=>{const Icon=icons[result.category];return <Link className="ss-result" key={result.id} href={result.href} onClick={onClose}><span className="ss-result-icon"><Icon size={21}/></span><span className="ss-result-copy"><strong>{result.title}</strong><span>{result.description}</span></span><ArrowRight01Icon size={17}/></Link>;})}</section>)}</>}
  </div></>;
}
