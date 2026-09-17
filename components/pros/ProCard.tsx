"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Location01Icon,
  Briefcase01Icon,
  ArrowRight01Icon,
  UserCircleIcon,
  CheckmarkBadge01Icon,
} from "hugeicons-react";
import type { GridViewType } from "./GridSwitcher";

export interface ProData {
  id: string;
  profileSlug?: string | null;
  name: string;
  image: string | null;
  coverImage?: string | null;
  headline: string | null;
  bio?: string | null;
  mission?: string | null;
  quoteStyle?: "serif" | "sans";
  frameColor?: "gold" | "silver" | "blue";
  badgeColor?: "gold" | "blue";
  certBadge?: string | null;
  location: string | null;
  yearsExperience: number | null;
  specialties: string[];
  certifications: string[];
}
export function ProCard({
  pro,
  viewMode = "grid-3",
}: {
  pro: ProData;
  viewMode?: GridViewType;
}) {
  const [imageError, setImageError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const certBadge =
    pro.certBadge ||
    (pro.certifications.some((cert) => /enrolled\s*agent|\bea\b/i.test(cert))
      ? "Enrolled Agent"
      : pro.certifications.some((cert) =>
            /\bcpa\b|certified public accountant/i.test(cert),
          )
        ? "CPA"
        : null);
  const initials = pro.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const mission = pro.mission?.trim();
  return (
    <Link
      href={`/member/${pro.profileSlug || pro.id}`}
      className={`fp-pro-card ${viewMode === "list" ? "fp-pro-list" : ""}`}
      aria-label={`View ${pro.name}'s professional profile`}
    >
      <div className="fp-pro-core">
        <div className="fp-pro-cover" aria-hidden="true">
          {pro.coverImage && !coverError && (
            <Image
              src={pro.coverImage}
              alt=""
              fill
              sizes="(max-width: 700px) 100vw, 500px"
              unoptimized
              onError={() => setCoverError(true)}
            />
          )}
        </div>
        <div className="fp-pro-header">
          <div className="fp-pro-photo">
            {pro.image && !imageError ? (
              <Image
                src={pro.image}
                alt={pro.name}
                fill
                sizes="130px"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="fp-pro-initials">{initials}</span>
            )}
          </div>
          <div className="fp-pro-mission">
            {mission ? (
              <>
                <span className="fp-quote-mark" aria-hidden="true">
                  “
                </span>
                <p>{mission}</p>
                <i />
              </>
            ) : pro.certifications.length > 0 ? (
              <div className="fp-pro-credentials">
                {pro.certifications.slice(0, 2).map((cert) => (
                  <span key={cert}>
                    <CheckmarkBadge01Icon size={14} />
                    {cert}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <span className="fp-eyebrow">
                  MEET YOUR NEXT
                  <br />
                  GOOD CONNECTION
                </span>
                <UserCircleIcon size={32} strokeWidth={1} />
              </>
            )}
          </div>
        </div>
        <div className="fp-pro-details">
          <div className="fp-pro-name">
            <h3>{pro.name}</h3>
            <CheckmarkBadge01Icon size={20} aria-label="Professional profile" />
          </div>
          {certBadge ? (
            <span className="fp-pro-cert">{certBadge}</span>
          ) : pro.headline ? (
            <p className="fp-pro-headline">{pro.headline}</p>
          ) : (
            <p className="fp-pro-headline">Tax & accounting professional</p>
          )}
          {pro.specialties.length > 0 && (
            <div className="fp-pro-tags">
              {pro.specialties
                .slice(0, viewMode === "list" ? 4 : 3)
                .map((specialty) => (
                  <span key={specialty}>{specialty}</span>
                ))}
            </div>
          )}
          {(pro.location || pro.yearsExperience != null) && (
            <div className="fp-pro-meta">
              {pro.location && (
                <span>
                  <Location01Icon size={15} />
                  {pro.location}
                </span>
              )}
              {pro.yearsExperience != null && pro.yearsExperience > 0 && (
                <span>
                  <Briefcase01Icon size={15} />
                  {pro.yearsExperience}+ years
                </span>
              )}
            </div>
          )}
        </div>
        <div className="fp-pro-footer">
          <span>
            <UserCircleIcon size={17} />
            View profile
          </span>
          <span className="fp-pro-action">
            Let’s connect{" "}
            <span>
              <ArrowRight01Icon size={17} />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
