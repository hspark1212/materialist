import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Materialist",
  description: "How Materialist collects and uses your data.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4 text-sm">Last updated: February 2025</p>

      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">What we collect</h2>
          <p>
            Materialist does not use third-party analytics or tracking services. We do not collect anonymous usage data,
            page views, or navigation patterns through external tools.
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">Authentication data</h2>
          <p>
            When you create an account, we store your profile information (display name, avatar, email) in our database.
            This data is used solely to operate the platform and is not shared with third parties for marketing
            purposes.
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">Contact</h2>
          <p>
            If you have questions about this privacy policy, please reach out via the project&apos;s GitHub repository.
          </p>
        </section>
      </div>
    </main>
  )
}
