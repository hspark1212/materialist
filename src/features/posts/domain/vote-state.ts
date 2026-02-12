import type { PersistedVoteDirection, VoteDirection } from "./types"

export type VoteMutation = {
  action: "insert" | "update" | "delete"
  nextDirection: PersistedVoteDirection
}

export function resolveVoteMutation(
  existingDirection: PersistedVoteDirection,
  requestedDirection: VoteDirection,
): VoteMutation {
  if (existingDirection === 0) {
    return {
      action: "insert",
      nextDirection: requestedDirection,
    }
  }

  if (existingDirection === requestedDirection) {
    return {
      action: "delete",
      nextDirection: 0,
    }
  }

  return {
    action: "update",
    nextDirection: requestedDirection,
  }
}
