"use client";

import { useState } from "react";
import Image from "next/image";
import { COURSES, type CourseOffering } from "@/lib/courses";
import { BookOpen01Icon, UserGroupIcon, Clock01Icon, StarIcon, Mortarboard01Icon, ArrowRight01Icon, Shield01Icon, FlashIcon, Award01Icon, Layers01Icon } from "hugeicons-react";
import "@/components/courses/courses-directory.css";

function CourseCard({ course }: { course: CourseOffering }) {
  const [imageError, setImageError] = useState(false);
  return <article className="cd-card"><div className="cd-card-core">
    <a className="cd-card-image" href={course.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${course.title}`}>
      {course.thumbnail && !imageError ? <Image src={course.thumbnail} alt={course.title} fill unoptimized sizes="(max-width:640px) 100vw, (max-width:1000px) 50vw, 420px" onError={() => setImageError(true)} /> : <Mortarboard01Icon size={60} />}
      <span className="cd-level">{course.level.charAt(0) + course.level.slice(1).toLowerCase()}</span><span className="cd-modules"><Layers01Icon size={13} />{course.modules} Modules</span>
    </a>
    <div className="cd-card-body"><span className="cd-category">{course.category}</span><h3><a href={course.externalUrl} target="_blank" rel="noopener noreferrer">{course.title}</a></h3><p className="cd-description">{course.description}</p>
      <div className="cd-instructor"><span className="cd-avatar">{course.instructor.image ? <Image src={course.instructor.image} alt="" width={34} height={34} unoptimized /> : course.instructor.name.slice(0,1)}</span><div><span>Instructor</span><strong>{course.instructor.name}</strong></div></div>
      <div className="cd-metrics"><span><BookOpen01Icon size={15} />{course.totalLessons} lessons</span><span><Clock01Icon size={15} />{course.duration}</span><span><UserGroupIcon size={15} />{course.enrolledCount} enrolled</span></div>
      <a className="cd-card-action" href={course.externalUrl} target="_blank" rel="noopener noreferrer">VIEW COURSE DETAILS <span><ArrowRight01Icon size={18} /></span></a>
    </div>
  </div></article>;
}

export default function CoursesPage() {
  return <div className="cd-page"><div className="cd-container">
    <section className="cd-hero" aria-labelledby="courses-heading"><div className="cd-hero-copy"><span className="cd-eyebrow"><Mortarboard01Icon size={18} />Atlas Academy · Professional Learning Hub</span><h1 id="courses-heading">Knowledge is Your <span>Competitive Edge</span></h1><p>Atlas Academy equips Tax Professionals with due diligence training, compliance strategies, and business skills to help build a stronger, more profitable practice.</p>
      <div className="cd-benefits">{[{ Icon: Shield01Icon, label: "IRS-Compliant Content" }, { Icon: FlashIcon, label: "Self-Paced Learning" }, { Icon: Award01Icon, label: "Verified Certificates" }].map(({Icon,label})=><span key={label}><Icon size={18} />{label}</span>)}</div>
    </div><div className="cd-hero-art"><Image src="/courses-hero.webp" alt="Atlas Academy Courses" width={720} height={720} priority unoptimized /><span><StarIcon size={14} />Professional Academy</span></div></section>
    <div className="cd-stats">{[{ num: "6", label: "Professional Masterclasses" },{ num: "100%", label: "IRS-Compliant Modules" },{ num: "CPE / CE", label: "Ready Curriculum" },{ num: "2 mo", label: "Free Marketplace Membership Plus" }].map(stat=><div key={stat.label}><strong>{stat.num}</strong><span>{stat.label}</span></div>)}</div>
    <section className="cd-catalog" aria-labelledby="course-catalog"><header className="cd-catalog-heading"><span className="cd-eyebrow"><StarIcon size={15} />Practice Growth &amp; Defense Systems</span><h2 id="course-catalog">Individual Courses</h2><p>Choose the exact course built for your firm&apos;s launch, due diligence, compliance, and audit defense.</p><div className="cd-offer"><Award01Icon size={20} /><p>Receive 2 Months FREE Marketplace Membership Plus with the purchase of ANY Toolkit or Course Bundle.</p></div></header><div className="cd-grid">{COURSES.map(course=><CourseCard key={course.id} course={course} />)}</div></section>
  </div></div>;
}
