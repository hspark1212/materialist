import { describe, expect, it } from "vitest"

import { resolveVoteMutation } from "../vote-state"

describe("resolveVoteMutation", () => {
  it("inserts when no existing vote", () => {
    const result = resolveVoteMutation(0, 1)

    expect(result.action).toBe("insert")
    expect(result.nextDirection).toBe(1)
  })

  it("deletes when user clicks same direction", () => {
    const result = resolveVoteMutation(1, 1)

    expect(result.action).toBe("delete")
    expect(result.nextDirection).toBe(0)
  })

  it("updates when switching directions", () => {
    const result = resolveVoteMutation(1, -1)

    expect(result.action).toBe("update")
    expect(result.nextDirection).toBe(-1)
  })

  it("deletes downvote on second downvote click", () => {
    const result = resolveVoteMutation(-1, -1)

    expect(result.action).toBe("delete")
    expect(result.nextDirection).toBe(0)
  })
})
