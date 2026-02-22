import type { Metadata } from "next"

import { SITE_NAME, SITE_URL } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"
import { UserPageClient } from "./user-page-client"

type PageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, karma, is_anonymous")
    .eq("username", username)
    .maybeSingle()

  if (!profile) {
    return { title: "User Not Found" }
  }

  const displayName = profile.display_name ?? username
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${displayName}'s profile on ${SITE_NAME}. ${profile.karma} karma.`

  return {
    title: displayName,
    description,
    alternates: { canonical: `${SITE_URL}/u/${username}` },
    openGraph: {
      title: `${displayName} — ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/u/${username}`,
      type: "profile",
    },
    robots: { index: !profile.is_anonymous, follow: true },
  }
}

export default function UserPage() {
  return <UserPageClient />
}
