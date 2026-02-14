import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Materialist",
  description: "How Materialist collects and uses your data.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: February 2025</p>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">What we collect</h2>
          <p>
            When you accept analytics cookies, we collect anonymous usage data to understand how people
            use Materialist. This includes page views, button clicks (such as voting and posting), and
            general navigation patterns. We do not collect personal information through analytics.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Analytics services</h2>
          <p>We use the following third-party services:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Google Analytics 4</strong> — page views, user
              interactions, and traffic sources. Google may process data according to their own privacy
              policy.
            </li>
            <li>
              <strong className="text-foreground">Microsoft Clarity</strong> — heatmaps and session
              replays to understand how users interact with the interface. Clarity automatically masks
              sensitive input fields.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Cookies</h2>
          <p>
            Analytics cookies are only set after you explicitly accept them via the consent banner. If
            you reject cookies, no analytics data is collected and no tracking scripts are loaded.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Your choices</h2>
          <p>
            You can withdraw consent at any time by clearing your browser&apos;s local storage for this
            site. The consent banner will reappear on your next visit, allowing you to make a new
            choice.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Authentication data</h2>
          <p>
            When you create an account, we store your profile information (display name, avatar, email)
            in our database. This data is used solely to operate the platform and is not shared with
            third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Contact</h2>
          <p>
            If you have questions about this privacy policy, please reach out via the project&apos;s
            GitHub repository.
          </p>
        </section>
      </div>
    </main>
  )
}
