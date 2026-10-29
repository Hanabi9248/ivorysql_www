"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { ArrowRight, Award, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";

import { type PartnerCategory, certificates } from "@/lib/partners";

type TranslatedPartnerCategory = PartnerCategory & {
  label: string;
  description: string;
};

// ─── Partner Card ───────────────────────────────────────────────────────────

function PartnerCard({
  partner,
}: {
  partner: { name: string; logo: string; url: string };
}) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card hover:border-primary/30 flex flex-col items-center gap-3 rounded-xl border p-6 transition-all hover:shadow-sm"
    >
      <div className="relative overflow-hidden rounded-lg bg-white p-3 transition-transform group-hover:scale-105">
        <Image
          src={partner.logo}
          alt={`${partner.name} logo`}
          width={80}
          height={48}
          className="h-12 w-20 object-contain"
        />
      </div>
      <span className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
        {partner.name}
      </span>
    </a>
  );
}

// ─── Category Section ───────────────────────────────────────────────────────

function CategorySection({
  category,
}: {
  category: TranslatedPartnerCategory;
}) {
  return (
    <section id={category.id} className="py-12">
      <div className="mb-8 text-center">
        <h2 className="text-foreground text-2xl font-semibold md:text-3xl">
          {category.label}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-base">
          {category.description}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {category.partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </div>
    </section>
  );
}

// ─── Certificates Section ───────────────────────────────────────────────────

function CertificatesSection() {
  const t = useTranslations("PartnersUI");
  const doubled = [...certificates, ...certificates];

  return (
    <section className="py-16">
      <div className="mb-10 text-center">
        <div className="bg-muted/50 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <Award className="text-muted-foreground size-5" />
        </div>
        <h2 className="text-foreground text-2xl font-semibold md:text-3xl">
          {t("certificatesTitle")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-base">
          {t("certificatesDescription")}
        </p>
      </div>
      <div className="overflow-hidden">
        <div
          className="flex gap-6"
          style={{
            animation: "cert-scroll 30s linear infinite",
            width: "max-content",
          }}
        >
          {doubled.map((cert, i) => (
            <div
              key={`cert-${i}`}
              className="shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm"
            >
              <Image
                src={cert.image}
                alt={t("certificateAlt", { n: (i % certificates.length) + 1 })}
                width={200}
                height={140}
                className="h-36 w-52 object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits Section ───────────────────────────────────────────────────────

function BenefitsSection({
  benefits,
}: {
  benefits: { title: string; description: string }[];
}) {
  const t = useTranslations("PartnersUI");
  return (
    <section className="py-16">
      <div className="mb-10 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <Handshake className="text-primary size-5" />
        </div>
        <h2 className="text-foreground text-2xl font-semibold md:text-3xl">
          {t("benefitsTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="bg-card rounded-xl border p-6 shadow-sm"
          >
            <h3 className="text-primary text-base font-semibold">
              {benefit.title}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────────────────────

function CTASection({ applyUrl }: { applyUrl: string }) {
  const t = useTranslations("PartnersUI");
  return (
    <section id="become-a-partner" className="py-16 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
          <Handshake className="text-primary size-7" />
        </div>
        <h2 className="text-foreground text-2xl font-semibold md:text-3xl">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-md text-base">
          {t("ctaDescription")}
        </p>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          {t("ctaButton")}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────

export function PartnersClient({
  categories,
  benefits,
  applyUrl,
}: {
  categories: TranslatedPartnerCategory[];
  benefits: { title: string; description: string }[];
  applyUrl: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0].id,
  );

  const previousCategory = useRef(activeCategory);

  useEffect(() => {
    if (previousCategory.current === activeCategory) return;
    previousCategory.current = activeCategory;
    document
      .getElementById(activeCategory)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeCategory]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.id === activeCategory);
  }, [categories, activeCategory]);

  const categoryNavItems = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        label: c.label,
      })),
    [categories],
  );

  const handleNavClick = (id: string) => {
    setActiveCategory(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Category Filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-8">
        {categoryNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Partner Sections */}
      {filteredCategories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {/* Divider */}
      <div className="border-t" />

      {/* Certificates */}
      <CertificatesSection />

      {/* Divider */}
      <div className="border-t" />

      {/* Benefits */}
      <BenefitsSection benefits={benefits} />

      {/* Divider */}
      <div className="border-t" />

      {/* CTA */}
      <CTASection applyUrl={applyUrl} />
    </div>
  );
}

// ─── Global Styles for Certificates Animation ──────────────────────────────

if (typeof document !== "undefined") {
  const styleId = "partners-cert-animation";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes cert-scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `;
    document.head.appendChild(style);
  }
}
