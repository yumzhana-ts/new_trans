"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Scale, ShieldAlert, CircleUserRound, Globe } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/admin.css";

const chips = [
  "Email address",
  "Display name / username",
  // "Profile picture",
  // "Google account ID (OAuth)",
  // "Game scores & history",
  // "Friends list",
  "IP address & device info",
  "Session cookies",
];

type Tab = "privacy" | "terms";

export default function LegalPolicyClient({
  initialTab,
}: {
  initialTab: Tab;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/legal?tab=${tab}`);
  };

  return (
      <>
        <div className="w-100 d-flex justify-content-center mt-2">
          <div className="btn-group legal-tab-group mt-2">
            <button
              type="button"
              onClick={() => handleTabChange("privacy")}
              className={`btn rounded-pill px-4 py-2 legal-tab-btn ${
                activeTab === "privacy"
                ? "legal-tab-active"
                : ""
              }`}
            >
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("terms")}
              className={`btn rounded-pill px-4 py-2 legal-tab-btn ${
                activeTab === "terms"
                ? "legal-tab-active"
                : ""
              }`}
            >
              Terms of Use
            </button>
          </div>
        </div>

        {activeTab === "privacy" ? (
          <>
            <div className="mt-5 mt-sm-6 text-center">
              <div className="d-inline-flex align-items-center gap-2 rounded-pill border border-white border-opacity-10 bg-white bg-opacity-10 px-3 py-2 legal-kicker">
                <Scale className="legal-kicker-icon text-warning" />
                <span className="text-primary">LEGAL</span>
                <span className="text-white-50">· TRIVIAAPP</span>
              </div>

              <h1 className="mt-4 mt-sm-5 legal-title">
                Transparent by Design
              </h1>

              <p className="mt-3 mx-auto legal-subtitle">
                We keep things simple. Here&apos;s exactly what we collect, why, and what you agree to.
              </p>
            </div>

            <section className="mt-4 mt-sm-5 legal-card legal-card-soft legal-panel p-4 p-sm-5">
              <div className="d-flex align-items-start gap-3 text-white-75">
                <div className="d-flex align-items-center justify-content-center rounded-circle legal-icon-wrap">
                  <Lock size={16} />
                </div>
                <p className="mb-0 legal-text">
                  We never sell your personal data to third parties. This policy explains what we collect, how we use it,
                  and what control you have over it.
                </p>
              </div>
            </section>

            <section className="mt-4 legal-card legal-card-gradient legal-panel p-4 p-sm-5 p-lg-5">
              <div className="d-flex align-items-center gap-2 text-uppercase legal-section-tag">
                <span>01</span>
                <span>-</span>
                <span>Data Collection</span>
              </div>

              <div className="mt-3 legal-divider" />

              <h2 className="mt-4 mt-sm-5 legal-h2">
                What we collect
              </h2>

              <p className="mt-3 legal-muted-text">
                When you create an account or play with us, we collect the following information:
              </p>

              <div className="mt-4 d-flex flex-wrap gap-2 gap-sm-3">
                {chips.map((chip, idx) => (
                  <span key={chip} className="badge rounded-pill legal-chip">
                    <span
                      className={`legal-dot ${
                        idx % 4 === 0
                          ? "bg-primary"
                          : idx % 4 === 1
                          ? "bg-info"
                          : idx % 4 === 2
                          ? "bg-violet"
                          : "bg-success"
                      }`}
                    />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-4 mt-sm-5 text-uppercase legal-small-tag">
                Google Sign-In
              </div>

              <div className="mt-3 legal-card legal-card-inner p-3 p-sm-4">
                <div className="d-flex align-items-start gap-3 text-white-75">
                  <div className="d-flex align-items-center justify-content-center rounded-circle legal-google-icon">
                    <Globe size={16} />
                  </div>
                  <p className="mb-0 legal-text">
                    When you sign in with Google, we receive your name, email from Google. We do not
                    receive your Google password.
                  </p>
                </div>
              </div>

              <div className="row g-3 mt-3 mt-sm-4">
                <div className="col-12 col-md-6">
                  <div className="legal-card legal-card-inner p-3 p-sm-4 h-100">
                    <div className="d-flex align-items-center gap-2 text-white-90">
                      <CircleUserRound className="text-primary" size={20} />
                      <h3 className="h5 mb-0 fw-semibold">Account data</h3>
                    </div>
                    <p className="mt-3 mb-0 legal-muted-text">
                      We store the details required to identify you, connect friends, and keep your game progress available.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="legal-card legal-card-inner p-3 p-sm-4 h-100">
                    <div className="d-flex align-items-center gap-2 text-white-90">
                      <ShieldAlert className="text-violet" size={20} />
                      <h3 className="h5 mb-0 fw-semibold">Security signals</h3>
                    </div>
                    <p className="mt-3 mb-0 legal-muted-text">
                      We use cookies, IP address, and device info for authentication, abuse prevention, and service reliability.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="legal-bottom-space" />
          </>
        ) : (
          <>
            <div className="mt-5 mt-sm-6 text-center">
              <div className="d-inline-flex align-items-center gap-2 rounded-pill border border-white border-opacity-10 bg-white bg-opacity-10 px-3 py-2 legal-kicker">
                <Scale className="legal-kicker-icon text-warning" />
                <span className="text-primary">LEGAL</span>
                <span className="text-white-50">· TRIVIAAPP</span>
              </div>

              <h1 className="mt-4 mt-sm-5 legal-title">
                Terms of Use
              </h1>

              <p className="mt-3 mx-auto legal-subtitle">
                By using this application, you agree to the following terms and conditions.
              </p>
            </div>

            <section className="mt-4 mt-sm-5 mx-auto legal-card legal-panel p-4 p-sm-5">
              <div className="legal-terms">
                <div>
                  <h2 className="h5 fw-semibold text-white">1. Acceptance of Terms</h2>
                  <p className="mt-2 mb-0 legal-text">
                    By accessing or using this app, you agree to be bound by these Terms of Use. If you do not agree,
                    you must not use the service.
                  </p>
                </div>

                <div>
                  <h2 className="h5 fw-semibold text-white">2. User Accounts</h2>
                  <p className="mt-2 mb-0 legal-text">
                    You are responsible for maintaining the confidentiality of your account and all activities under it.
                  </p>
                </div>

                <div>
                  <h2 className="h5 fw-semibold text-white">3. Acceptable Use</h2>
                  <p className="mt-2 mb-0 legal-text">
                    You agree not to misuse the platform, attempt unauthorized access, or disrupt the service.
                  </p>
                </div>

                <div>
                  <h2 className="h5 fw-semibold text-white">4. Content</h2>
                  <p className="mt-2 mb-0 legal-text">
                    You retain ownership of your content, but grant us a license to use it for operating the service.
                  </p>
                </div>

                <div>
                  <h2 className="h5 fw-semibold text-white">5. Termination</h2>
                  <p className="mt-2 mb-0 legal-text">
                    We may suspend or terminate access if these terms are violated.
                  </p>
                </div>

                <div>
                  <h2 className="h5 fw-semibold text-white">6. Disclaimer</h2>
                  <p className="mt-2 mb-0 legal-text">
                    The service is provided &quot;as is&quot; without warranties of any kind.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
    </>
  );
}